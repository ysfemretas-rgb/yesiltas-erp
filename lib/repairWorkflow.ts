// Servis iş akışı (aşamalar), kalite kontrol listesi, teklif durumu ve teslim tarihi kuralları.
// Saf fonksiyonlar: hiçbir içe aktarma yok, testle doğrulanır.

export type RepairStatus = "waiting" | "in_progress" | "completed"

export type RepairStage =
  | "received"
  | "diagnosed"
  | "awaiting_approval"
  | "awaiting_parts"
  | "in_repair"
  | "qc"
  | "ready"
  | "delivered"

// Her aşama, mevcut üç durumdan (Bekliyor / Devam Ediyor / Tamamlandı) birine karşılık gelir;
// böylece eski ekranlar, rapor ve bildirimler bozulmaz.
export const REPAIR_STAGES: { key: RepairStage; label: string; icon: string; status: RepairStatus }[] = [
  { key: "received", label: "Teslim Alındı", icon: "📥", status: "waiting" },
  { key: "diagnosed", label: "Teşhis Edildi", icon: "🔍", status: "waiting" },
  { key: "awaiting_approval", label: "Müşteri Onayı Bekliyor", icon: "⏳", status: "waiting" },
  { key: "awaiting_parts", label: "Parça Bekliyor", icon: "📦", status: "waiting" },
  { key: "in_repair", label: "Tamirde", icon: "🔧", status: "in_progress" },
  { key: "qc", label: "Kalite Kontrolde", icon: "✅", status: "in_progress" },
  { key: "ready", label: "Teslime Hazır", icon: "🎁", status: "completed" },
  { key: "delivered", label: "Teslim Edildi", icon: "🤝", status: "completed" },
]

const STAGE_KEYS = REPAIR_STAGES.map((s) => s.key as string)

export function stageLabel(stage: string): string {
  return REPAIR_STAGES.find((s) => s.key === stage)?.label || stage
}

export function statusForStage(stage: RepairStage): RepairStatus {
  return REPAIR_STAGES.find((s) => s.key === stage)?.status || "waiting"
}

export function defaultStageForStatus(status: string): RepairStage {
  if (status === "in_progress") return "in_repair"
  if (status === "completed") return "delivered"
  return "received"
}

// Kayıtta aşama yoksa (eski kayıtlar) durumdan türetilir
export function stageOf(r: { stage?: string; status: string }): RepairStage {
  return r.stage && STAGE_KEYS.includes(r.stage) ? (r.stage as RepairStage) : defaultStageForStatus(r.status)
}

// Durum eski yöntemle (durum seçiciyle) değiştirildiğinde aşamayı tutarlı tutar:
// mevcut aşama zaten yeni durumla uyumluysa korunur, değilse o durumun varsayılan aşamasına geçilir.
export function reconcileStage(currentStage: string | undefined, newStatus: string): RepairStage {
  if (currentStage && STAGE_KEYS.includes(currentStage) && statusForStage(currentStage as RepairStage) === newStatus) return currentStage as RepairStage
  return defaultStageForStatus(newStatus)
}

export function nextStage(stage: RepairStage): RepairStage | null {
  const i = STAGE_KEYS.indexOf(stage)
  return i >= 0 && i < STAGE_KEYS.length - 1 ? (STAGE_KEYS[i + 1] as RepairStage) : null
}

// ---- Kalite kontrol ----
export const QC_ITEMS: { key: string; label: string }[] = [
  { key: "screen", label: "Ekran ve dokunmatik" },
  { key: "camera", label: "Kameralar (ön/arka)" },
  { key: "audio", label: "Hoparlör, ahize ve mikrofon" },
  { key: "charge", label: "Şarj ve şarj portu" },
  { key: "network", label: "Wi-Fi, Bluetooth ve operatör/SIM" },
  { key: "buttons", label: "Tuşlar ve titreşim" },
  { key: "biometric", label: "Yüz/parmak izi ve sensörler" },
  { key: "battery", label: "Pil sağlığı / ısınma" },
  { key: "clean", label: "Temizlik ve dış görünüş" },
]

export interface RepairQc {
  checks: Record<string, boolean>
  by?: string
  at?: string
}

export function qcProgress(qc?: RepairQc | null): { done: number; total: number; complete: boolean } {
  const total = QC_ITEMS.length
  const done = QC_ITEMS.filter((i) => qc?.checks?.[i.key]).length
  return { done, total, complete: done === total }
}

// ---- Teklif ----
export interface RepairQuote {
  status: "pending" | "approved" | "rejected"
  amount: number
  note: string
  createdAt: string
  decidedAt?: string
  decidedBy?: string
}

export const QUOTE_LABELS: Record<RepairQuote["status"], string> = {
  pending: "Müşteri yanıtı bekleniyor",
  approved: "Müşteri onayladı",
  rejected: "Müşteri reddetti",
}

// ---- Tahmini teslim ----
// today: "YYYY-MM-DD". late: tarihi geçmiş ve tamir bitmemiş; soon: bugün veya yarın.
export function deliveryState(estimated: string | undefined, status: string, today: string): "none" | "ok" | "soon" | "late" {
  if (!estimated || status === "completed") return "none"
  if (estimated < today) return "late"
  const diffDays = Math.round((new Date(`${estimated}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000)
  return diffDays <= 1 ? "soon" : "ok"
}

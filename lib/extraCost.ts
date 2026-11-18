// Ek ücret onayı: tamir sırasında beklenmeyen bir ek ücret çıktığında, müşteriye
// WhatsApp ile onay sorulur ve ONAY GELMEDEN ücrete eklenmez — Superfix'in
// "şeffaflık, onaysız ücret yok" vaadine karşılık. Parça siparişi gibi (bkz.
// lib/partOrder.ts), yeni bir SQL sütunu gerektirmeden tamir notuna (notes) yazılan
// etiketli bir satır olarak saklanır.
import { appendNote } from "@/lib/partOrder"

export interface ExtraCostInfo {
  amount: number
  note: string
  date: string // YYYY-MM-DD
  status: "pending" | "approved" | "rejected"
}

const REQUEST_RE = /➕ Ek ücret talebi: ([\d.,]+) TL — (.*?) — (\d{4}-\d{2}-\d{2})/g
const DECISION_RE = /➕ Ek ücret (onaylandı|reddedildi): ([\d.,]+) TL — (\d{4}-\d{2}-\d{2})/g

function parseAmount(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0
}

export function extraCostRequestNote(amount: number, note: string, date: string): string {
  return `➕ Ek ücret talebi: ${amount.toLocaleString("tr-TR")} TL — ${note.trim() || "-"} — ${date}`
}

export function extraCostDecisionNote(decision: "approved" | "rejected", amount: number, date: string): string {
  return `➕ Ek ücret ${decision === "approved" ? "onaylandı" : "reddedildi"}: ${amount.toLocaleString("tr-TR")} TL — ${date}`
}

// Tamir notundaki EN SON ek ücret talebi ve varsa kararı birleştirilir.
export function lastExtraCost(notes?: string): ExtraCostInfo | null {
  const text = String(notes ?? "")
  let lastReq: { amount: number; note: string; date: string } | null = null
  for (const m of text.matchAll(REQUEST_RE)) lastReq = { amount: parseAmount(m[1]), note: m[2], date: m[3] }
  if (!lastReq) return null
  let lastDecision: { status: "approved" | "rejected"; date: string } | null = null
  for (const m of text.matchAll(DECISION_RE)) {
    lastDecision = { status: m[1] === "onaylandı" ? "approved" : "rejected", date: m[3] }
  }
  // Karar, talepten SONRA geldiyse geçerlidir (eski bir karar yeni talebi etkilemez)
  const status: ExtraCostInfo["status"] = lastDecision && lastDecision.date >= lastReq.date ? lastDecision.status : "pending"
  return { ...lastReq, status }
}

export { appendNote }

export function extraCostApprovalMessage(customer: string, device: string, amount: number, note: string): string {
  const money = amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return [
    `\u{1F44B} Merhaba *${customer}*,`,
    ``,
    `\u{1F527} *${device}* cihazınızın tamiri sırasında beklenmeyen bir durum tespit edildi:`,
    note.trim() ? `\u{1F4DD} ${note.trim()}` : "",
    ``,
    `➕ Ek ücret: *${money} TL*`,
    ``,
    `Bu ek ücreti onaylıyor musunuz? Onay için bu mesaja *EVET*, onaylamıyorsanız *HAYIR* yazmanız yeterlidir. Onayınız olmadan işleme devam edilmeyecektir.`,
    `\u{1F3EA} *Yeşiltaş Teknoloji*`,
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n")
}

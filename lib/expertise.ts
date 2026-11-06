// İkinci el cihaz alımında ekspertiz kontrol listesi. Sonuç metin olarak alım belgesine (durum notu), alış kaydına ve
// cihaz satılırken satış fişine yazılır.
export type Tri = "" | "ok" | "fail"
export interface Expertise {
  battery: string // pil sağlığı %
  biometric: Tri // Face ID / Touch ID
  screen: "" | "original" | "changed" | "unknown"
  accountLock: "" | "clean" | "locked"
  imeiChecked: boolean // IMEI e-Devlet / BTK'da sorgulandı
  tests: { camera: boolean; speaker: boolean; mic: boolean; charge: boolean; buttons: boolean; network: boolean }
  cosmetic: string
}

export const EMPTY_EXPERTISE: Expertise = {
  battery: "",
  biometric: "",
  screen: "",
  accountLock: "",
  imeiChecked: false,
  tests: { camera: false, speaker: false, mic: false, charge: false, buttons: false, network: false },
  cosmetic: "",
}

export const TEST_LABELS: Record<keyof Expertise["tests"], string> = {
  camera: "Kamera",
  speaker: "Hoparlör",
  mic: "Mikrofon",
  charge: "Şarj",
  buttons: "Tuşlar",
  network: "Şebeke/Wi-Fi",
}

export function isExpertiseEmpty(e: Expertise): boolean {
  return !e.battery && !e.biometric && !e.screen && !e.accountLock && !e.imeiChecked && !Object.values(e.tests).some(Boolean) && !e.cosmetic.trim()
}

// Belgeye ve fişe yazılacak tek satırlık özet
export function formatExpertise(e: Expertise): string {
  if (isExpertiseEmpty(e)) return ""
  const parts: string[] = []
  const bat = Number(String(e.battery).replace(",", "."))
  if (e.battery !== "" && Number.isFinite(bat)) parts.push(`Pil %${Math.round(bat)}`)
  if (e.biometric) parts.push(`Face/Touch ID: ${e.biometric === "ok" ? "Çalışıyor" : "Çalışmıyor"}`)
  if (e.screen) parts.push(`Ekran: ${e.screen === "original" ? "Orijinal" : e.screen === "changed" ? "Değişmiş" : "Bilinmiyor"}`)
  if (e.accountLock) parts.push(`Hesap kilidi: ${e.accountLock === "clean" ? "Yok" : "VAR"}`)
  if (e.imeiChecked) parts.push("IMEI sorgulandı")
  const ok = (Object.keys(TEST_LABELS) as (keyof Expertise["tests"])[]).filter((k) => e.tests[k]).map((k) => TEST_LABELS[k])
  if (ok.length) parts.push(`Test edildi: ${ok.join(", ")}`)
  if (e.cosmetic.trim()) parts.push(`Kozmetik: ${e.cosmetic.trim()}`)
  return `🔎 Ekspertiz: ${parts.join(" • ")}`
}

// Alımdan önce dikkat edilmesi gerekenler (uyarı olarak gösterilir, alımı engellemez)
export function expertiseWarnings(e: Expertise): string[] {
  const w: string[] = []
  if (e.accountLock === "locked") w.push("iCloud / Google hesap kilidi VAR: kilitli cihaz kullanılamaz ve satılamaz, alım önerilmez.")
  if (!e.imeiChecked) w.push("IMEI sorgulanmadı (e-Devlet / BTK IMEI sorgusu): kayıtsız ya da kayıp/çalıntı bildirimli cihaz riski.")
  const bat = Number(String(e.battery).replace(",", "."))
  if (e.battery !== "" && Number.isFinite(bat) && bat < 80) w.push(`Pil sağlığı düşük (%${Math.round(bat)}): fiyata yansıtın ya da pil değişimi gerekebilir.`)
  if (e.biometric === "fail") w.push("Face ID / Touch ID çalışmıyor: değeri ciddi düşer.")
  return w
}

// Ekspertiz satırını durum notundan ayırır (satış fişinde göstermek için)
export function extractExpertise(note?: string): string {
  const m = String(note ?? "").match(/🔎 Ekspertiz:[^|\n]*/)
  return m ? m[0].trim() : ""
}

// Parça siparişi / parça geldi / teslim hatırlatması: tamir notuna yazılan satırlar ve WhatsApp mesajları (saf modül).
export interface PartOrderInfo {
  part: string
  qty: number
  supplier: string
  date: string // YYYY-MM-DD
}

const LINE_RE = /📦 Parça siparişi: (.+?) x(\d+) — (.+?) — (\d{4}-\d{2}-\d{2})/g

export function partOrderNote(o: PartOrderInfo): string {
  return `📦 Parça siparişi: ${o.part.trim()} x${o.qty} — ${o.supplier.trim()} — ${o.date}`
}

// Tamir notundaki EN SON parça siparişi
export function lastPartOrder(notes?: string): PartOrderInfo | null {
  let last: PartOrderInfo | null = null
  for (const m of String(notes ?? "").matchAll(LINE_RE)) last = { part: m[1], qty: Number(m[2]), supplier: m[3], date: m[4] }
  return last
}

export function appendNote(notes: string | undefined, line: string): string {
  const n = String(notes ?? "").trim()
  return n ? `${n}\n${line}` : line
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${String(from).slice(0, 10)}T12:00:00`).getTime()
  const b = new Date(`${String(to).slice(0, 10)}T12:00:00`).getTime()
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) : 0
}

export function partOrderMessage(o: { contact: string; part: string; qty: number; device: string; note?: string }): string {
  return [
    `👋 Merhaba${o.contact ? ` ${o.contact}` : ""},`,
    ``,
    `🔧 *${o.part.trim()}* — *${o.qty} adet* lazım.`,
    o.device ? `📱 Cihaz: ${o.device}` : "",
    o.note?.trim() ? `📝 ${o.note.trim()}` : "",
    ``,
    `Fiyatını ve ne zaman gönderebileceğinizi yazabilir misiniz?`,
    `🏪 *Yeşiltaş Teknoloji*`,
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).filter((l) => l !== null).join("\n").replace(/\n{3,}/g, "\n\n")
}

export function partsArrivedMessage(customer: string, device: string): string {
  return `👋 Merhaba *${customer}*,\n\n📦 *${device}* cihazınız için beklediğimiz parça geldi, cihazınız tamire alındı. 🔧\nTamamlandığında size haber vereceğiz.\n\n🏪 *Yeşiltaş Teknoloji*`
}

export function pickupReminderMessage(customer: string, device: string, days: number, remaining: number): string {
  const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `👋 Merhaba *${customer}*,\n\n✅ *${device}* cihazınızın tamiri ${days} gün önce tamamlandı ve teslim almanızı bekliyor. 🎁\n${remaining > 0 ? `💰 Kalan ücret: *${money(remaining)} TL*\n` : ""}\nUygun olduğunuzda mağazamıza uğrayabilirsiniz.\n🏪 *Yeşiltaş Teknoloji*`
}

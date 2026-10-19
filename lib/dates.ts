// Yerel (cihazın saat dilimine göre) bugünün tarihi: YYYY-MM-DD.
// toISOString() UTC verdiği için Türkiye'de 00:00-03:00 arası "dün" yazıyordu.
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

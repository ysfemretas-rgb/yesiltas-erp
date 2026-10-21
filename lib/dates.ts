// Yerel (cihazın saat dilimine göre) bugünün tarihi: YYYY-MM-DD.
// toISOString() UTC verdiği için Türkiye'de 00:00-03:00 arası "dün" yazıyordu.
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// Veritabanından gelen tarih değerini YEREL güne çevirir.
// Bazı sütunlar (ör. devices.received_date) "timestamptz"dir: "2026-10-21" yazıldığında veritabanı saat dilimine göre
// gece yarısı olarak saklanır ve geri "2026-10-20T21:00:00+00:00" gelebilir; ilk 10 karakteri almak günü bir gün
// geri gösteriyordu. Saat bilgisi varsa tarayıcının yerel gününe çevrilir; düz tarihler ("2026-10-21") aynen döner.
export function dbDateToLocal(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  const str = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return str.slice(0, 10)
  return localDateStr(d)
}

// Telefon numarası düzenleyici: boşluk, parantez, tire, +90/0090/90 öneki temizlenir; yurt içi numara 05XXXXXXXXX (11 hane) olur.
// Yurt dışı numara (+90 dışında "+" ile başlayan) bozulmaz: "+86..." gibi kalır.
export function normalizePhoneTR(raw: string): string {
  const text = String(raw ?? "").trim()
  let d = text.replace(/\D/g, "")
  if (text.startsWith("+") && !d.startsWith("90")) return "+" + d.slice(0, 15) // yurt dışı
  if (d.startsWith("0090")) d = "0" + d.slice(4)
  else if (d.startsWith("90") && d.length >= 12 && d[2] === "5") d = "0" + d.slice(2) // +90 532 ... → 0532 ...
  else if (d.length >= 10 && d.startsWith("5")) d = "0" + d // 532 123 45 67 → 0532 123 45 67
  return d.slice(0, 11)
}

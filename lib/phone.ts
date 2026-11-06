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

// WhatsApp için uluslararası numara (ülke kodlu, sadece rakam): 05XX… / 5XX… / +90 … / 0090 … / "90"+"05…" → 905XXXXXXXXX.
// Sayfalar numarayı "90" + "05…" diye birleştirince oluşan 9005… hatası da burada düzelir. Yurt dışı numaralar olduğu gibi kalır.
export function toWhatsAppNumber(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/\D/g, "")
  if (!d) return ""
  if (d.startsWith("00")) d = d.slice(2) // 0090… → 90…
  if (d.startsWith("900")) d = "90" + d.replace(/^900+/, "") // 90 + 0554… → 90554…
  if (d.startsWith("0")) d = "90" + d.replace(/^0+/, "") // 0554… → 90554…
  if (d.length === 10 && d.startsWith("5")) d = "90" + d // 554… → 90554…
  return d
}

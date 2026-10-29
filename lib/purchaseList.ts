// "Listeyi yapıştır": Notlar/Excel'den kopyalanan alış satırlarını (ürün; adet; birim fiyat; iskonto%) okur. SAF fonksiyon, testle doğrulanır.

export interface ParsedPurchaseRow {
  lineNo: number
  name: string
  quantity: number
  price: number
  discountPct: number
  error?: string
}

// "1.250,50" → 1250.5 ; "1250.5" → 1250.5 ; "12,5" → 12.5 ; "1.250" → 1250 (binlik) ; "₺ 90 TL" → 90
export function parseNumberTR(raw: string): number {
  let s = String(raw ?? "").replace(/[₺$€]|TL|TRY|USD|EUR|adet|%/gi, "").replace(/\s/g, "")
  if (!s) return NaN
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".")
  else if (s.includes(",")) s = s.replace(",", ".")
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "")
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

export function parsePurchaseList(text: string): ParsedPurchaseRow[] {
  const rows: ParsedPurchaseRow[] = []
  String(text || "").split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return
    const delim = line.includes("\t") ? "\t" : line.includes(";") ? ";" : line.includes("|") ? "|" : null
    const parts = (delim ? line.split(delim) : [line]).map((p) => p.trim())
    const row: ParsedPurchaseRow = { lineNo: idx + 1, name: parts[0] || "", quantity: NaN, price: NaN, discountPct: 0 }
    if (!delim || parts.length < 3) {
      row.error = "Biçim: ürün adı; adet; birim fiyat; (iskonto %)"
    } else {
      row.quantity = parseNumberTR(parts[1])
      row.price = parseNumberTR(parts[2])
      if (parts[3] !== undefined && parts[3] !== "") row.discountPct = parseNumberTR(parts[3])
      if (!row.name) row.error = "Ürün adı boş"
      else if (!(row.quantity > 0) || Math.floor(row.quantity) !== row.quantity) row.error = "Adet geçersiz"
      else if (!(row.price >= 0)) row.error = "Birim fiyat geçersiz"
      else if (!(row.discountPct >= 0 && row.discountPct <= 100)) row.error = "İskonto % geçersiz"
    }
    rows.push(row)
  })
  return rows
}

// Ad eşleştirme anahtarı: İ/I/ı/i, ş, ğ, ü, ö, ç farkları ve büyük/küçük harf yok sayılır ("TEST TEDARİKÇİ" = "test tedarikci").
// (JavaScript'te "İ".toLowerCase() "i" + birleşik nokta verir; düz toLowerCase bu yüzden Türkçe adlarda eşleşmez.)
export function normKey(s: string): string {
  return String(s ?? "")
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim()
}

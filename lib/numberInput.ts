// Sayı kutuları için metin temizleme (components/ui/input.tsx kullanır).
// - Sadece rakam ve TEK ondalık ayracı kalır (virgül noktaya çevrilir), eksi işareti yalnızca izin verilirse ve başta
// - Baştaki gereksiz sıfırlar silinir: "050" → "50", "00" → "0"; "0.5" korunur
export function sanitizeNumberText(raw: string, allowNegative = false): string {
  let t = String(raw ?? "").replace(/\s/g, "").replace(/,/g, ".")
  const negative = allowNegative && t.startsWith("-")
  t = t.replace(/[^0-9.]/g, "")
  const dot = t.indexOf(".")
  if (dot >= 0) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "")
  t = t.replace(/^0+(?=\d)/, "")
  return (negative ? "-" : "") + t
}

// Metnin sayı karşılığı; boş / yarım yazılmış ("-", ".", "5.") durumlar için null / sayı döner
export function parseNumberText(text: string): number | null {
  const t = String(text ?? "").trim()
  if (t === "" || t === "-" || t === "." || t === "-.") return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// Odak kaybında yarım kalan metni toparlar: "5." → "5"; boş bırakılmışsa emptyValue yazılır (normalde "0")
export function finalizeNumberText(text: string, emptyValue: string): string {
  const t = text.replace(/\.$/, "")
  return t === "" || t === "-" || t === "." ? emptyValue : t
}

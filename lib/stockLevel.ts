// Envanter stok durumu: 0 ve altı = TÜKENDİ (kırmızı), min. stok adedine ya da altına düşen = KRİTİK (sarı), diğerleri normal.
// Min. stok 0 verilmişse (ör. ikinci el cihazlar) kritik uyarı verilmez, ama stok 0 olunca yine "tükendi" olur.
export type StockLevel = "out" | "low" | "ok"

export function stockLevel(item: { quantity?: number | null; minQuantity?: number | null }): StockLevel {
  const q = Number(item.quantity) || 0
  const m = Number(item.minQuantity) || 0
  if (q <= 0) return "out"
  if (m > 0 && q <= m) return "low"
  return "ok"
}

// Yeni ürünlerde varsayılan minimum stok adedi (Ayarlar > Envanter Minimum Stok Adedi). Ayar yoksa 5.
export function getDefaultMinStock(): number {
  if (typeof window === "undefined") return 5
  try {
    const raw = window.localStorage.getItem("yt_company")
    const n = raw ? Number(JSON.parse(raw)?.defaultMinStock) : NaN
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 5
  } catch {
    return 5
  }
}

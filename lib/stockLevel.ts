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

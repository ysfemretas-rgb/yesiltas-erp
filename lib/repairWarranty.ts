// Garanti dönüşü: aynı cihaz, önceki tamirin tamamlanmasından sonraki N gün içinde tekrar gelirse "garanti dönüşü" sayılır.
// Aynı cihaz = IMEI aynı (en az 8 hane) ya da IMEI yoksa aynı müşteri + aynı marka/model. Kayıt saklanmaz, her seferinde hesaplanır.
export interface WarrantyRepair {
  id: string
  repairCode?: string
  imei?: string
  customerCode?: string
  customerName?: string
  brand?: string
  model?: string
  createdAt: string // YYYY-MM-DD
  completedAt?: string
  status?: string
  parts?: { productId: string; name: string; quantity: number }[]
}

const norm = (s?: string) => String(s ?? "").trim().toLocaleLowerCase("tr").replace(/\s+/g, " ")
const digits = (s?: string) => String(s ?? "").replace(/\D/g, "")
const dayMs = 86400000
const toTime = (d?: string) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).getTime() : NaN)

export function sameDevice(a: WarrantyRepair, b: WarrantyRepair): boolean {
  const ia = digits(a.imei)
  const ib = digits(b.imei)
  if (ia.length >= 8 && ib.length >= 8) return ia === ib
  const sameCustomer = a.customerCode && b.customerCode ? a.customerCode === b.customerCode : !!norm(a.customerName) && norm(a.customerName) === norm(b.customerName)
  return sameCustomer && !!norm(a.model) && norm(a.brand) === norm(b.brand) && norm(a.model) === norm(b.model)
}

// r, önceki bir tamirin garanti süresi içinde mi geldi? En yakın (en son tamamlanan) önceki tamiri döndürür.
export function findWarrantyReturn(r: WarrantyRepair, all: WarrantyRepair[], days: number): { prev: WarrantyRepair; daysSince: number } | null {
  const t = toTime(r.createdAt)
  if (!Number.isFinite(t) || days <= 0) return null
  let best: { prev: WarrantyRepair; daysSince: number } | null = null
  for (const p of all) {
    if (p.id === r.id || p.status !== "completed") continue
    const done = toTime(p.completedAt || p.createdAt)
    if (!Number.isFinite(done) || done > t) continue
    const since = Math.round((t - done) / dayMs)
    if (since > days) continue
    if (!sameDevice(r, p)) continue
    if (!best || since < best.daysSince) best = { prev: p, daysSince: since }
  }
  return best
}

// Garanti dönüşlerinde önceki tamirde kullanılan parçaların tedarikçilerine göre sayım (hangi tedarikçinin parçası geri geliyor)
export function warrantyReturnsBySupplier(
  repairs: WarrantyRepair[],
  days: number,
  supplierOf: (productId: string) => string
): { returns: { repair: WarrantyRepair; prev: WarrantyRepair; daysSince: number }[]; bySupplier: { supplier: string; count: number }[] } {
  const returns: { repair: WarrantyRepair; prev: WarrantyRepair; daysSince: number }[] = []
  for (const r of repairs) {
    const hit = findWarrantyReturn(r, repairs, days)
    if (hit) returns.push({ repair: r, prev: hit.prev, daysSince: hit.daysSince })
  }
  return { returns, bySupplier: supplierCounts(returns, supplierOf) }
}

export function supplierCounts(returns: { prev: WarrantyRepair }[], supplierOf: (productId: string) => string): { supplier: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const x of returns) {
    const sups = new Set((x.prev.parts || []).map((p) => supplierOf(p.productId) || "Bilinmiyor"))
    if (sups.size === 0) sups.add("Parça kullanılmamış")
    for (const s of sups) counts.set(s, (counts.get(s) || 0) + 1)
  }
  return Array.from(counts.entries()).map(([supplier, count]) => ({ supplier, count })).sort((a, b) => b.count - a.count)
}

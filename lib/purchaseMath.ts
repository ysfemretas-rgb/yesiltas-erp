// Alış hesapları (saf fonksiyonlar, hiçbir içe aktarma yok; testlerle doğrulanır).

export type Currency = "TRY" | "USD" | "EUR"

export function rateFor(currency: Currency, rates: { USD: number; EUR: number }): number {
  return currency === "USD" ? rates.USD : currency === "EUR" ? rates.EUR : 1
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// Dövizli alış fiyatını TL'ye çevirir (satır birim maliyeti)
export function unitCostTRY(unitPrice: number, currency: Currency, rates: { USD: number; EUR: number }): number {
  return r2(unitPrice * rateFor(currency, rates))
}

// Satış fiyatı = TL maliyet x (1 + kâr marjı), tam liraya yuvarlanır
export function suggestedSalePrice(unitPrice: number, currency: Currency, marginPercent: number, rates: { USD: number; EUR: number }): number {
  return Math.round(unitCostTRY(unitPrice, currency, rates) * (1 + (marginPercent || 0) / 100))
}

export function purchaseTotal(lines: { quantity: number; unitCostTRY: number }[]): number {
  return r2(lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCostTRY) || 0), 0))
}

export type PayStatus = "paid" | "partial" | "unpaid"

export function paymentStatusOf(total: number, paid: number): PayStatus {
  if (paid <= 0.009) return total <= 0.009 ? "paid" : "unpaid"
  return paid >= total - 0.009 ? "paid" : "partial"
}

// Ödemeyi en eski borçtan başlayarak alışlara dağıtır. Artan tutar (alışlara sığmayan) `leftover` olur.
export function allocatePayment(
  purchases: { id: string; remaining: number }[],
  amount: number
): { allocations: { id: string; amount: number }[]; leftover: number } {
  let left = r2(amount)
  const allocations: { id: string; amount: number }[] = []
  for (const p of purchases) {
    if (left <= 0) break
    const rem = r2(Number(p.remaining) || 0)
    if (rem <= 0) continue
    const pay = Math.min(rem, left)
    allocations.push({ id: p.id, amount: r2(pay) })
    left = r2(left - pay)
  }
  return { allocations, leftover: left }
}

// Tedarikçiye net borç = eski sistemdeki ödenmemiş ürün borcu + ödenmemiş alış kalanları - genel ödemeler
export function supplierNetDebt(legacyUnpaid: number, purchasesRemaining: number, genericPayments: number): number {
  return r2(legacyUnpaid + purchasesRemaining - genericPayments)
}

// Eski (ürün bazlı) borç hesabında, Alışlar kayıtlarıyla zaten izlenen adetler tekrar sayılmaz.
export function legacyOutstandingQty(purchasedQty: number, coveredByPurchases: number): number {
  return Math.max(0, (Number(purchasedQty) || 0) - (Number(coveredByPurchases) || 0))
}

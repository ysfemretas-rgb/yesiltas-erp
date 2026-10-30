// Tedarikçi borcu: eski ürün-bazlı borç + Alışlar kayıtlarının ödenmemiş kalanı − genel ödemeler.
// (Tedarikçiler sayfası ve "indirimle kapat" penceresi aynı hesabı kullanır.)
import { InventoryItem } from "@/lib/inventory"
import { Purchase } from "@/lib/purchases"
import { supplierNetDebt, legacyOutstandingQty } from "@/lib/purchaseMath"

export function supplierDebtInfo(
  supplierName: string,
  inventory: InventoryItem[],
  purchases: Purchase[],
  payments: { supplierName: string; amount: number }[],
  rates: { USD: number; EUR: number }
): { orderCount: number; debt: number; credit: number; net: number } {
  const items = inventory.filter((i) => i.supplier === supplierName)
  // Alışlar kayıtlarıyla zaten izlenen adetler eski ürün-bazlı borç hesabında tekrar sayılmaz
  // (hangi tedarikçiden alınmış olursa olsun: o adetler zaten Alışlar kayıtlarında borç olarak izlenir)
  const coveredQty: Record<string, number> = {}
  purchases.filter((p) => p.kind === "supplier").forEach((p) => {
    p.items.forEach((l) => { if (l.inventoryId) coveredQty[l.inventoryId] = (coveredQty[l.inventoryId] || 0) + l.quantity })
  })
  const legacyUnpaid = items.reduce((sum, i) => {
    const priceInTRY = i.purchaseCurrency === "USD" ? i.purchasePrice * rates.USD : i.purchaseCurrency === "EUR" ? i.purchasePrice * rates.EUR : i.purchasePrice
    const total = priceInTRY * legacyOutstandingQty(i.purchasedQuantity ?? i.quantity, coveredQty[i.id] || 0)
    const paid = i.paymentStatus === "paid" ? total : i.paymentStatus === "partial" ? (i.paidAmount || 0) : 0
    return sum + Math.max(0, total - paid)
  }, 0)
  const extraPaid = payments.filter((p) => p.supplierName === supplierName).reduce((sum, p) => sum + p.amount, 0)
  const supplierPurchases = purchases.filter((p) => p.kind === "supplier" && p.partyName === supplierName)
  const purchasesRemaining = supplierPurchases.reduce((sum, p) => sum + Math.max(0, p.total - p.paid), 0)
  const net = supplierNetDebt(legacyUnpaid, purchasesRemaining, extraPaid)
  // Alışlar kaydıyla izlenen ürün zaten o alışın içinde sayılır; sadece alışa bağlı OLMAYAN (eski) ürünler ayrıca eklenir
  const orderCount = items.filter((i) => !(coveredQty[i.id] > 0)).length + supplierPurchases.length
  return { orderCount, debt: Math.max(0, net), credit: Math.max(0, -net), net }
}

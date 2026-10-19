// Müşteri borcunu hesaplayan ortak yardımcılar (Müşteriler sayfası, Bugün sayfası ve
// bildirimler aynı kuralı kullanır).
//
// Eşleştirme sırası: kayıtlı müşteri ID'si -> müşteri kodu -> sadece isim BENZERSİZSE tam isim.
// (Eskiden isim "içeriyor mu" diye bakılıyordu; "Ahmet" tüm Ahmet'lerin borcunu karıştırıyordu.)
// Borç = tamir kalanı + satış kalanı + SADECE elle eklenmiş borçlar. Satış/tamirden doğan
// borç kayıtları kalan tutarın aynası olduğu için tekrar toplanmaz; eşantiyon ve iptal sayılmaz.

interface Rec {
  customerId?: string
  customerCode?: string
  customerName?: string
  remaining?: number
  status?: string
  paymentMethod?: string
  paymentType?: string
}

interface CustomerLike {
  id: string
  name: string
  customerCode?: string
  debts?: { amount: number; status: string; source?: string }[]
}

export function makeMatcher(customers: CustomerLike[]) {
  const counts = new Map<string, number>()
  customers.forEach(c => {
    const key = (c.name || "").trim().toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return (c: CustomerLike, rec: Rec): boolean => {
    if (rec.customerId) return rec.customerId === c.id
    if (rec.customerCode) return rec.customerCode === c.customerCode
    const key = (c.name || "").trim().toLowerCase()
    return !!key && (rec.customerName || "").trim().toLowerCase() === key && (counts.get(key) || 0) === 1
  }
}

export function computeCustomerDebts(customers: CustomerLike[], repairs: Rec[], sales: Rec[]): Map<string, number> {
  const matches = makeMatcher(customers)
  const result = new Map<string, number>()
  customers.forEach(c => {
    const repairDebt = repairs
      .filter(r => r.paymentType !== "gift" && matches(c, r))
      .reduce((sum, r) => sum + (r.remaining || 0), 0)
    const saleDebt = sales
      .filter(s => s.status !== "cancelled" && s.paymentMethod !== "gift" && matches(c, s))
      .reduce((sum, s) => sum + (s.remaining || 0), 0)
    const manualDebt = (c.debts || [])
      .filter(d => d.status === "unpaid" && (d.source ?? "manual") === "manual")
      .reduce((sum, d) => sum + d.amount, 0)
    result.set(c.id, repairDebt + saleDebt + manualDebt)
  })
  return result
}

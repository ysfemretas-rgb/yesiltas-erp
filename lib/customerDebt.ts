// Müşteri borcunu hesaplayan ortak yardımcılar (Müşteriler sayfası, Bugün sayfası ve
// bildirimler aynı kuralı kullanır).
//
// Eşleştirme sırası: kayıtlı müşteri ID'si -> müşteri kodu -> sadece isim BENZERSİZSE tam isim.
// (Eskiden isim "içeriyor mu" diye bakılıyordu; "Ahmet" tüm Ahmet'lerin borcunu karıştırıyordu.)
// Borç = tamir kalanı + satış kalanı + SADECE elle eklenmiş borçlar. Satış/tamirden doğan
// borç kayıtları kalan tutarın aynası olduğu için tekrar toplanmaz; eşantiyon ve iptal sayılmaz.

interface Rec {
  date?: string
  createdAt?: string
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
  debts?: { amount: number; status: string; source?: string; date?: string }[]
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

// Müşterinin açık borcu ve en eski açık borcun tarihi/yaşı (satışta risk uyarısı için).
// today: "YYYY-MM-DD" (test edilebilirlik için dışarıdan verilir)
export function openDebtInfo(
  customer: CustomerLike,
  repairs: Rec[],
  sales: Rec[],
  all: CustomerLike[],
  today: string
): { debt: number; oldestDate: string | null; ageDays: number } {
  const matches = makeMatcher(all.length ? all : [customer])
  const dates: string[] = []
  let debt = 0
  repairs.forEach((r) => {
    if (r.paymentType === "gift" || !matches(customer, r)) return
    const rem = r.remaining || 0
    debt += rem
    if (rem > 0 && r.createdAt) dates.push(r.createdAt)
  })
  sales.forEach((s) => {
    if (s.status === "cancelled" || s.paymentMethod === "gift" || !matches(customer, s)) return
    const rem = s.remaining || 0
    debt += rem
    if (rem > 0 && s.date) dates.push(s.date)
  })
  ;(customer.debts || []).forEach((d) => {
    if (d.status === "unpaid" && (d.source ?? "manual") === "manual") {
      debt += d.amount
      if (d.amount > 0 && d.date) dates.push(d.date)
    }
  })
  const oldest = dates.length ? [...dates].sort()[0] : null
  const ageDays = oldest ? Math.max(0, Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${oldest}T12:00:00`).getTime()) / 86400000)) : 0
  return { debt: Math.round(debt * 100) / 100, oldestDate: oldest, ageDays }
}

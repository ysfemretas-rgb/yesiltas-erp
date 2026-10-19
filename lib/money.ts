// Para hesapları (saf fonksiyonlar). Satış sayfası ve tahsilat bu fonksiyonları kullanır;
// böylece hesaplar otomatik testlerle doğrulanabilir (bkz. tests/ klasörü, `npm test`).
// Bu dosya bilerek hiçbir içe aktarma (import) içermez.

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface InstallmentLike {
  no: number
  dueDate: string
  amount: number
  paidAmount: number
}

// Aylık eşit taksit planı: son taksit yuvarlama farkını alır; taksitler toplamı her zaman `total`'e eşittir.
export function buildInstallments(total: number, count: number, firstDate: string): InstallmentLike[] {
  if (!(total > 0) || count < 1) return []
  const base = Math.floor((total / count) * 100) / 100
  const list: InstallmentLike[] = []
  const start = new Date(`${firstDate}T12:00:00`)
  let allocated = 0
  for (let i = 0; i < count; i++) {
    const due = new Date(start.getFullYear(), start.getMonth() + i, start.getDate(), 12)
    const amount = i === count - 1 ? round2(total - allocated) : base
    allocated = round2(allocated + amount)
    list.push({ no: i + 1, dueDate: dateStr(due), amount, paidAmount: 0 })
  }
  return list
}

// Tahsilatı en eski ödenmemiş taksitten başlayarak taksitlere dağıtır.
export function allocateInstallments<T extends InstallmentLike>(installments: T[], collected: number): T[] {
  let left = collected
  return installments.map((inst) => {
    if (left <= 0) return inst
    const need = Math.max(0, round2((Number(inst.amount) || 0) - (Number(inst.paidAmount) || 0)))
    const pay = Math.min(need, left)
    left = round2(left - pay)
    return { ...inst, paidAmount: round2((Number(inst.paidAmount) || 0) + pay) }
  })
}

export interface RefundInput {
  items: { price: number; quantity: number }[]
  discount: number
  totalAmount: number
  paid: number
  // her satır için iade edilecek adet (items ile aynı sıra)
  returnQty: number[]
  mode: "cash" | "balance"
}

export type RefundResult =
  | { ok: false; reason: "none" | "all" }
  | {
      ok: true
      remainingQty: number[]
      newDiscount: number
      newTotal: number
      refundValue: number
      cashRefund: number
      newPaid: number
      newRemaining: number
    }

// Kısmi iade hesabı: iade edilen ürünler çıkarılır, iskonto orantılı düşer.
// Nakit iade: müşterinin yeni toplamın üzerinde ödediği kısım geri verilir.
// Bakiyeye mahsup: ödenen tutar değişmez, fark müşteri alacağı (negatif kalan) olur.
export function computeRefund(input: RefundInput): RefundResult {
  const qty = input.items.map((it, i) => Math.min(it.quantity, Math.max(0, Math.floor(Number(input.returnQty[i]) || 0))))
  if (qty.every((q) => q === 0)) return { ok: false, reason: "none" }
  const remainingQty = input.items.map((it, i) => it.quantity - qty[i])
  if (remainingQty.every((q) => q === 0)) return { ok: false, reason: "all" }

  const subtotal = input.items.reduce((s, it) => s + it.price * it.quantity, 0)
  const newSubtotal = input.items.reduce((s, it, i) => s + it.price * remainingQty[i], 0)
  const newDiscount = subtotal > 0 ? round2((input.discount * newSubtotal) / subtotal) : 0
  const newTotal = round2(Math.max(0, newSubtotal - newDiscount))
  const refundValue = round2(input.totalAmount - newTotal)
  let cashRefund = 0
  let newPaid = input.paid
  if (input.mode === "cash") {
    cashRefund = Math.max(0, round2(input.paid - newTotal))
    newPaid = round2(input.paid - cashRefund)
  }
  const newRemaining = round2(newTotal - newPaid)
  return { ok: true, remainingQty, newDiscount, newTotal, refundValue, cashRefund, newPaid, newRemaining }
}

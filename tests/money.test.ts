// Çalıştırma: npm test   (Node 22.6 veya üstü gerekir)
import test from "node:test"
import assert from "node:assert/strict"
import { round2, buildInstallments, allocateInstallments, computeRefund } from "../lib/money.ts"
import { computeCustomerDebts, openDebtInfo } from "../lib/customerDebt.ts"

test("round2 kayan nokta hatalarını düzeltir", () => {
  assert.equal(round2(1.005), 1.01)
  assert.equal(round2(0.1 + 0.2), 0.3)
})

test("taksitlerin toplamı her zaman toplam tutara eşittir", () => {
  for (const [total, count] of [[1000, 3], [100, 7], [99.99, 6], [1, 12], [12345.67, 11]] as [number, number][]) {
    const plan = buildInstallments(total, count, "2026-01-31")
    assert.equal(plan.length, count)
    assert.equal(round2(plan.reduce((s, i) => s + i.amount, 0)), total)
  }
})

test("taksit vade tarihleri aylık ilerler ve ay sonunu aşmaz", () => {
  const plan = buildInstallments(300, 3, "2026-01-15")
  assert.deepEqual(plan.map((i) => i.dueDate), ["2026-01-15", "2026-02-15", "2026-03-15"])
})

test("taksit tahsilatı en eski taksitten başlayarak dağıtılır", () => {
  const plan = buildInstallments(300, 3, "2026-01-15")
  const after = allocateInstallments(plan, 150)
  assert.equal(after[0].paidAmount, 100)
  assert.equal(after[1].paidAmount, 50)
  assert.equal(after[2].paidAmount, 0)
  const total = round2(after.reduce((s, i) => s + i.paidAmount, 0))
  assert.equal(total, 150)
})

test("kısmi iade: tam ödenmiş satışta nakit iade", () => {
  // 2 x 500 TL, 100 TL iskonto, toplam 900 TL, tamamı ödenmiş
  const r = computeRefund({ items: [{ price: 500, quantity: 2 }], discount: 100, totalAmount: 900, paid: 900, returnQty: [1], mode: "cash" })
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.newDiscount, 50)
    assert.equal(r.newTotal, 450)
    assert.equal(r.refundValue, 450)
    assert.equal(r.cashRefund, 450)
    assert.equal(r.newPaid, 450)
    assert.equal(r.newRemaining, 0)
  }
})

test("kısmi iade: bakiyeye mahsup müşteriyi alacaklı yapar", () => {
  const r = computeRefund({ items: [{ price: 500, quantity: 2 }], discount: 0, totalAmount: 1000, paid: 1000, returnQty: [1], mode: "balance" })
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.cashRefund, 0)
    assert.equal(r.newPaid, 1000)
    assert.equal(r.newRemaining, -500)
  }
})

test("kısmi iade: borcu olan müşteriye nakit iade yapılmaz, borç düşer", () => {
  // toplam 1000, 300 ödenmiş (700 borç); 1 adet (500) iade -> yeni toplam 500, ödenen 300 -> borç 200, nakit iade yok
  const r = computeRefund({ items: [{ price: 500, quantity: 2 }], discount: 0, totalAmount: 1000, paid: 300, returnQty: [1], mode: "cash" })
  assert.ok(r.ok)
  if (r.ok) {
    assert.equal(r.cashRefund, 0)
    assert.equal(r.newPaid, 300)
    assert.equal(r.newRemaining, 200)
  }
})

test("kısmi iade: hiç/tüm ürün iadesi reddedilir", () => {
  const base = { items: [{ price: 10, quantity: 2 }], discount: 0, totalAmount: 20, paid: 20, mode: "cash" as const }
  assert.deepEqual(computeRefund({ ...base, returnQty: [0] }), { ok: false, reason: "none" })
  assert.deepEqual(computeRefund({ ...base, returnQty: [5] }), { ok: false, reason: "all" })
})

test("müşteri borcu: eşantiyon ve iptal sayılmaz, satış borcu çift sayılmaz", () => {
  const customers = [
    { id: "c1", name: "Ahmet Yılmaz", customerCode: "YTM-0001", debts: [
      { amount: 100, status: "unpaid", source: "manual" },
      { amount: 700, status: "unpaid", source: "sale" }, // satış borcunun aynası: tekrar toplanmamalı
    ] },
    { id: "c2", name: "Ahmet Demir", customerCode: "YTM-0002", debts: [] },
  ]
  const sales = [
    { customerId: "c1", remaining: 700 },
    { customerId: "c1", remaining: 50, status: "cancelled" },
    { customerId: "c1", remaining: 30, paymentMethod: "gift" },
    { customerId: "c2", remaining: 20 },
  ]
  const debts = computeCustomerDebts(customers, [], sales)
  assert.equal(debts.get("c1"), 800) // 100 manuel + 700 satış
  assert.equal(debts.get("c2"), 20)
})

test("müşteri eşleştirme: aynı isimli iki müşteride isimle eşleşme yapılmaz", () => {
  const customers = [
    { id: "a", name: "Ali Veli", customerCode: "YTM-1" },
    { id: "b", name: "Ali Veli", customerCode: "YTM-2" },
  ]
  const sales = [{ customerName: "Ali Veli", remaining: 100 }] // ID ve kod yok
  const debts = computeCustomerDebts(customers, [], sales)
  assert.equal(debts.get("a"), 0)
  assert.equal(debts.get("b"), 0)
})

test("risk bilgisi: en eski açık borcun yaşı hesaplanır, iptal ve eşantiyon sayılmaz", () => {
  const c = { id: "c1", name: "Ali", customerCode: "YTM-1", debts: [{ amount: 50, status: "unpaid", source: "manual", date: "2026-09-01" }] }
  const sales = [
    { customerId: "c1", remaining: 200, date: "2026-08-01" },
    { customerId: "c1", remaining: 999, date: "2026-01-01", status: "cancelled" },
    { customerId: "c1", remaining: 77, date: "2026-02-01", paymentMethod: "gift" },
  ]
  const info = openDebtInfo(c, [], sales, [c], "2026-10-01")
  assert.equal(info.debt, 250)
  assert.equal(info.oldestDate, "2026-08-01")
  assert.equal(info.ageDays, 61)
})

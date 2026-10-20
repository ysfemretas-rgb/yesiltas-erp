import test from "node:test"
import assert from "node:assert/strict"
import { unitCostTRY, suggestedSalePrice, purchaseTotal, paymentStatusOf, allocatePayment, supplierNetDebt } from "../lib/purchaseMath.ts"

const rates = { USD: 40, EUR: 45 }

test("dövizli alış TL'ye çevrilir", () => {
  assert.equal(unitCostTRY(10, "USD", rates), 400)
  assert.equal(unitCostTRY(10, "EUR", rates), 450)
  assert.equal(unitCostTRY(123.45, "TRY", rates), 123.45)
})

test("satış fiyatı maliyet + kâr marjı", () => {
  assert.equal(suggestedSalePrice(1000, "TRY", 20, rates), 1200)
  assert.equal(suggestedSalePrice(10, "USD", 25, rates), 500)
})

test("alış toplamı satırlardan hesaplanır", () => {
  assert.equal(purchaseTotal([{ quantity: 3, unitCostTRY: 100 }, { quantity: 2, unitCostTRY: 50.5 }]), 401)
})

test("ödeme durumu", () => {
  assert.equal(paymentStatusOf(1000, 1000), "paid")
  assert.equal(paymentStatusOf(1000, 400), "partial")
  assert.equal(paymentStatusOf(1000, 0), "unpaid")
})

test("ödeme en eski alıştan başlayarak dağıtılır, artan tutar kalır", () => {
  const r = allocatePayment([{ id: "a", remaining: 300 }, { id: "b", remaining: 500 }, { id: "c", remaining: 0 }], 600)
  assert.deepEqual(r.allocations, [{ id: "a", amount: 300 }, { id: "b", amount: 300 }])
  assert.equal(r.leftover, 0)
  const r2 = allocatePayment([{ id: "a", remaining: 100 }], 250)
  assert.deepEqual(r2.allocations, [{ id: "a", amount: 100 }])
  assert.equal(r2.leftover, 150)
})

test("tedarikçi net borcu", () => {
  assert.equal(supplierNetDebt(500, 1500, 200), 1800)
  assert.equal(supplierNetDebt(0, 0, 100), -100)
})

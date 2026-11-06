import test from "node:test"
import assert from "node:assert/strict"
import { saleDiscountInfo, repairDiscountInfo } from "../lib/discountInfo.ts"

test("tamir iskontosu: cost net, liste = cost + iskonto", () => {
  assert.deepEqual(repairDiscountInfo({ cost: 1061, discount: 39 }), { lineDiscount: 0, generalDiscount: 39, total: 39, listTotal: 1100 })
  assert.equal(repairDiscountInfo({ cost: 500 }).total, 0)
  assert.equal(repairDiscountInfo({ cost: 500, discount: 0 }).listTotal, 500)
})

test("satış iskontosu: genel + ürün satırı iskontosu", () => {
  const s = saleDiscountInfo({ totalAmount: 97.2, discount: 0, items: [{ price: 97.2, quantity: 1, listPrice: 108 }] })
  assert.equal(s.lineDiscount, 10.8)
  assert.equal(s.total, 10.8)
  assert.equal(s.listTotal, 108)
  const t = saleDiscountInfo({ totalAmount: 180, discount: 20, items: [{ price: 100, quantity: 2 }] })
  assert.deepEqual(t, { lineDiscount: 0, generalDiscount: 20, total: 20, listTotal: 200 })
  const u = saleDiscountInfo({ totalAmount: 90, discount: 10, items: [{ price: 45, quantity: 2, listPrice: 50 }] })
  assert.equal(u.total, 20) // 2×5 ürün iskontosu + 10 genel
  assert.equal(u.listTotal, 110)
})

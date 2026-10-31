import test from "node:test"
import assert from "node:assert/strict"
import { stockLevel } from "../lib/stockLevel.ts"

test("stok durumu: 0 = tükendi (kırmızı), min. adede ya da altına inen = kritik (sarı), diğerleri normal", () => {
  assert.equal(stockLevel({ quantity: 0, minQuantity: 5 }), "out")
  assert.equal(stockLevel({ quantity: 0, minQuantity: 0 }), "out") // min 0 olsa da stok 0 kırmızıdır
  assert.equal(stockLevel({ quantity: -2, minQuantity: 5 }), "out")
  assert.equal(stockLevel({ quantity: 3, minQuantity: 5 }), "low")
  assert.equal(stockLevel({ quantity: 5, minQuantity: 5 }), "low") // min'e eşit = kritik
  assert.equal(stockLevel({ quantity: 6, minQuantity: 5 }), "ok")
  assert.equal(stockLevel({ quantity: 1, minQuantity: 0 }), "ok") // min 0 = kritik uyarı yok
  assert.equal(stockLevel({ quantity: undefined, minQuantity: undefined }), "out")
})

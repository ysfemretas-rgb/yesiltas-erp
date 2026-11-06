import test from "node:test"
import assert from "node:assert/strict"
import { findWarrantyReturn, sameDevice, warrantyReturnsBySupplier } from "../lib/repairWarranty.ts"

const R = (o: any) => ({ id: o.id, status: "completed", createdAt: "2026-10-01", ...o })

test("aynı cihaz: IMEI varsa IMEI, yoksa müşteri + marka/model", () => {
  assert.equal(sameDevice(R({ id: "a", imei: "35 123456 789012 3" }), R({ id: "b", imei: "351234567890123" })), true)
  assert.equal(sameDevice(R({ id: "a", imei: "351234567890123" }), R({ id: "b", imei: "359999999999999" })), false)
  assert.equal(sameDevice(R({ id: "a", customerCode: "YTM-1", brand: "Samsung", model: "Galaxy A11" }), R({ id: "b", customerCode: "YTM-1", brand: "samsung", model: "galaxy  a11" })), true)
  assert.equal(sameDevice(R({ id: "a", customerCode: "YTM-1", brand: "Samsung", model: "A11" }), R({ id: "b", customerCode: "YTM-2", brand: "Samsung", model: "A11" })), false)
  assert.equal(sameDevice(R({ id: "a", customerName: "Ali", brand: "Apple", model: "" }), R({ id: "b", customerName: "Ali", brand: "Apple", model: "" })), false) // model yoksa eşleştirme yapılmaz
})

test("garanti dönüşü: süre içinde tamamlanmış önceki tamir bulunur", () => {
  const prev = R({ id: "p", repairCode: "YTT-0005", customerCode: "YTM-1", brand: "Samsung", model: "A11", createdAt: "2026-10-01", completedAt: "2026-10-03" })
  const now = R({ id: "n", customerCode: "YTM-1", brand: "Samsung", model: "A11", createdAt: "2026-10-15", status: "waiting" })
  const hit = findWarrantyReturn(now, [prev, now], 90)
  assert.equal(hit?.prev.repairCode, "YTT-0005")
  assert.equal(hit?.daysSince, 12)
  assert.equal(findWarrantyReturn(now, [prev, now], 10), null) // 12 gün > 10 gün garanti
  assert.equal(findWarrantyReturn(now, [{ ...prev, status: "in_progress" }, now], 90), null) // tamamlanmamış tamir sayılmaz
  assert.equal(findWarrantyReturn(prev, [prev, now], 90), null) // sonraki tamir önceki sayılmaz
})

test("tedarikçiye göre garanti dönüşü sayımı", () => {
  const p1 = R({ id: "p1", customerCode: "C1", brand: "Apple", model: "iPhone 11", completedAt: "2026-10-02", parts: [{ productId: "e1", name: "Ekran", quantity: 1 }] })
  const n1 = R({ id: "n1", customerCode: "C1", brand: "Apple", model: "iPhone 11", createdAt: "2026-10-20", status: "waiting" })
  const p2 = R({ id: "p2", customerCode: "C2", brand: "Xiaomi", model: "Note 12", completedAt: "2026-10-05", parts: [{ productId: "b1", name: "Batarya", quantity: 1 }] })
  const n2 = R({ id: "n2", customerCode: "C2", brand: "Xiaomi", model: "Note 12", createdAt: "2026-10-25", status: "waiting" })
  const p3 = R({ id: "p3", customerCode: "C3", brand: "Apple", model: "iPhone 12", completedAt: "2026-10-05", parts: [{ productId: "e2", name: "Ekran", quantity: 1 }] })
  const n3 = R({ id: "n3", customerCode: "C3", brand: "Apple", model: "iPhone 12", createdAt: "2026-10-09", status: "waiting" })
  const sup: Record<string, string> = { e1: "A-CEPGO", e2: "A-CEPGO", b1: "Fenk aksesuar" }
  const r = warrantyReturnsBySupplier([p1, n1, p2, n2, p3, n3], 90, (id) => sup[id])
  assert.equal(r.returns.length, 3)
  assert.deepEqual(r.bySupplier, [{ supplier: "A-CEPGO", count: 2 }, { supplier: "Fenk aksesuar", count: 1 }])
})

import test from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_REPAIR_SERVICES, normalizeServices, servicesTotal } from "../lib/repairServices.ts"

test("hazır işlem listesi: varsayılanlar ve toplam", () => {
  assert.equal(DEFAULT_REPAIR_SERVICES.length, 7)
  assert.equal(servicesTotal(["Ekran değişimi"], DEFAULT_REPAIR_SERVICES), 1800)
  assert.equal(servicesTotal(["Ekran değişimi", "Batarya değişimi"], DEFAULT_REPAIR_SERVICES), 2700)
  assert.equal(servicesTotal([], DEFAULT_REPAIR_SERVICES), 0)
  assert.equal(servicesTotal(["Olmayan işlem"], DEFAULT_REPAIR_SERVICES), 0)
})

test("işlem listesi ayardan okunur; bozuk/boş ayar varsayılana döner", () => {
  assert.deepEqual(normalizeServices([{ name: " Ekran ", price: "2500.4" }, { name: "", price: 5 }]), [{ name: "Ekran", price: 2500 }])
  assert.deepEqual(normalizeServices([]), DEFAULT_REPAIR_SERVICES)
  assert.deepEqual(normalizeServices(undefined), DEFAULT_REPAIR_SERVICES)
  assert.equal(normalizeServices([{ name: "X", price: -5 }])[0].price, 0)
})

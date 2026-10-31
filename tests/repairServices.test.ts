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

import { normalizePhoneTR } from "../lib/phone.ts"
import { isSparePart } from "../lib/productKinds.ts"

test("telefon düzenleme: boşluk/parantez/+90 temizlenir, 05 ile başlar", () => {
  assert.equal(normalizePhoneTR("+90 (532) 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("0090 532 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("90 532 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("(0532) 123-45-67"), "05321234567")
  assert.equal(normalizePhoneTR("532 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("05321234567"), "05321234567")
  assert.equal(normalizePhoneTR("0532 123 45 67 89 99"), "05321234567") // fazlası kesilir
  assert.equal(normalizePhoneTR("0"), "0")
  assert.equal(normalizePhoneTR("053"), "053") // yazarken bozulmaz
  assert.equal(normalizePhoneTR("5"), "5")
  assert.equal(normalizePhoneTR(""), "")
})

test("telefon düzenleme: yurt dışı numara bozulmaz, sabit hat 0 ile kalır", () => {
  assert.equal(normalizePhoneTR("+86 138 0013 8000"), "+8613800138000")
  assert.equal(normalizePhoneTR("0312 123 45 67"), "03121234567")
})

test("yedek parça ayrımı: kategoriye göre", () => {
  assert.equal(isSparePart({ category: "Yedek Parça - Ekran" }), true)
  assert.equal(isSparePart({ category: "yedek parca" }), true)
  assert.equal(isSparePart({ category: "Yedek Parça" }), true)
  assert.equal(isSparePart({ category: "Kılıf" }), false)
  assert.equal(isSparePart({ category: "Telefon (Sıfır)" }), false)
  assert.equal(isSparePart({ category: "" }), false)
  assert.equal(isSparePart({}), false)
})

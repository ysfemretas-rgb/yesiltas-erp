import test from "node:test"
import assert from "node:assert/strict"
import { normalizePhoneTR } from "../lib/phone.ts"

test("telefon: boşluk, parantez, tire ve +90 temizlenir, 05 ile başlar", () => {
  assert.equal(normalizePhoneTR("+90 (532) 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("0 (532) 123-45-67"), "05321234567")
  assert.equal(normalizePhoneTR("532 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("0090 532 123 45 67"), "05321234567")
  assert.equal(normalizePhoneTR("905321234567"), "05321234567")
  assert.equal(normalizePhoneTR("0532 123 4567"), "05321234567")
})

test("telefon: sabit hat bozulmaz, yurt dışı numara + ile korunur, fazla hane kesilir", () => {
  assert.equal(normalizePhoneTR("0312 123 45 67"), "03121234567")
  assert.equal(normalizePhoneTR("+86 138 0013 8000"), "+8613800138000")
  assert.equal(normalizePhoneTR("053212345678999"), "05321234567")
  assert.equal(normalizePhoneTR(""), "")
})

import { toWhatsAppNumber } from "../lib/phone.ts"

test("WhatsApp numarası: her biçim 905… olur (\"90\"+\"05…\" hatası dahil)", () => {
  assert.equal(toWhatsAppNumber("90" + "05541247062"), "905541247062")
  assert.equal(toWhatsAppNumber("05541247062"), "905541247062")
  assert.equal(toWhatsAppNumber("5541247062"), "905541247062")
  assert.equal(toWhatsAppNumber("+90 (554) 124 70 62"), "905541247062")
  assert.equal(toWhatsAppNumber("00905541247062"), "905541247062")
  assert.equal(toWhatsAppNumber("905541247062"), "905541247062")
  assert.equal(toWhatsAppNumber("8613800138000"), "8613800138000") // yurt dışı
  assert.equal(toWhatsAppNumber(""), "")
  assert.equal(toWhatsAppNumber(null), "")
})

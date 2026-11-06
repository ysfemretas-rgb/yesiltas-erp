import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeNumberText, parseNumberText, finalizeNumberText } from "../lib/numberInput.ts"

test("sayı kutusu: baştaki sıfırlar silinir, boş bırakılabilir", () => {
  assert.equal(sanitizeNumberText("050"), "50")
  assert.equal(sanitizeNumberText("00"), "0")
  assert.equal(sanitizeNumberText("0"), "0")
  assert.equal(sanitizeNumberText("007.50"), "7.50")
  assert.equal(sanitizeNumberText("0.5"), "0.5")
  assert.equal(sanitizeNumberText("0,5"), "0.5")
  assert.equal(sanitizeNumberText(""), "")
})

test("sayı kutusu: harf/simge temizlenir, tek ondalık ayracı, eksi sadece izinliyse", () => {
  assert.equal(sanitizeNumberText("abc12x"), "12")
  assert.equal(sanitizeNumberText("1,,2"), "1.2")
  assert.equal(sanitizeNumberText("1.2.3"), "1.23")
  assert.equal(sanitizeNumberText("₺ 1.250"), "1.250")
  assert.equal(sanitizeNumberText("-5"), "5")
  assert.equal(sanitizeNumberText("-5", true), "-5")
  assert.equal(sanitizeNumberText("5-", true), "5")
})

test("sayı kutusu: yarım yazılmış metinler ve odak kaybı", () => {
  assert.equal(parseNumberText(""), null)
  assert.equal(parseNumberText("-"), null)
  assert.equal(parseNumberText("5."), 5)
  assert.equal(parseNumberText("0"), 0)
  assert.equal(finalizeNumberText("5.", "0"), "5")
  assert.equal(finalizeNumberText("", "0"), "0") // boş bırakılırsa otomatik 0
  assert.equal(finalizeNumberText("", "1"), "1") // en az 1 olan kutuda 1
  assert.equal(finalizeNumberText("", ""), "") // boş bırakmanın anlamı olan kutu boş kalır
  assert.equal(finalizeNumberText("-", "0"), "0")
})

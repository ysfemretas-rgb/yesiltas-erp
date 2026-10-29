import test from "node:test"
import assert from "node:assert/strict"
import { planSettlement, discountAmount, lineNetUnitPrice, generalFactor, scaleFactorForReduction, effectivePct } from "../lib/settlementMath.ts"

test("350 borç: 300 öde + 50 indirim tek borcu kapatır", () => {
  const p = planSettlement([{ id: "a", remaining: 350 }], 300, 50)
  assert.deepEqual(p.pays, [{ id: "a", amount: 300 }])
  assert.deepEqual(p.discounts, [{ id: "a", amount: 50 }])
  assert.equal(p.remainingAfter, 0)
})

test("ödeme en eski borçtan başlar, indirim kalan borçlara en eskiden dağılır", () => {
  const p = planSettlement([{ id: "eski", remaining: 100 }, { id: "yeni", remaining: 250 }], 120, 30)
  assert.deepEqual(p.pays, [{ id: "eski", amount: 100 }, { id: "yeni", amount: 20 }])
  assert.deepEqual(p.discounts, [{ id: "yeni", amount: 30 }])
  assert.equal(p.remainingAfter, 200)
})

test("5100 borç, 5000 öde, 100 indirim", () => {
  const p = planSettlement([{ id: "x", remaining: 5100 }], 5000, 100)
  assert.equal(p.remainingAfter, 0)
  assert.equal(p.payTotal, 5000)
  assert.equal(p.discountTotal, 100)
})

test("toplam borcu aşan ödeme+indirim reddedilir, sıfır işlem reddedilir", () => {
  assert.throws(() => planSettlement([{ id: "a", remaining: 100 }], 90, 20), /aşıyor/)
  assert.throws(() => planSettlement([{ id: "a", remaining: 100 }], 0, 0), /girin/)
})

test("kapalı (kalanı 0) borçlar atlanır", () => {
  const p = planSettlement([{ id: "kapali", remaining: 0 }, { id: "a", remaining: 50 }], 50, 0)
  assert.deepEqual(p.pays, [{ id: "a", amount: 50 }])
})

test("yüzde ve tutar iskonto, sınırlar", () => {
  assert.equal(discountAmount("pct", 10, 350), 35)
  assert.equal(discountAmount("amt", 50, 350), 50)
  assert.equal(discountAmount("pct", 150, 200), 200)   // %100'den fazla olamaz
  assert.equal(discountAmount("amt", 500, 200), 200)   // borçtan fazla olamaz
  assert.equal(discountAmount("pct", -5, 200), 0)
})

test("alış satırı: %10 ve satır toplamından ₺ indirim, net birim fiyat", () => {
  assert.equal(lineNetUnitPrice(100, 5, "pct", 10), 90)          // 500 → 450 → 90/adet
  assert.equal(lineNetUnitPrice(100, 5, "amt", 100), 80)         // satırdan 100 TL → 400 → 80/adet
  assert.equal(lineNetUnitPrice(33.33, 3, "amt", 10), 29.9967)   // hassas maliyet (4 ondalık)
  assert.equal(lineNetUnitPrice(100, 0, "pct", 10), 100)
})

test("genel iskonto satırlara orantılı: toplam tam olarak düşer", () => {
  const subtotal = 100 * 5 + 40 * 3            // 620
  const f = generalFactor(subtotal, 62)         // %10
  assert.equal(Math.round(subtotal * f * 100) / 100, 558)
  assert.equal(generalFactor(0, 10), 1)
  assert.equal(generalFactor(100, 500), 0)
})

test("alış kaydını iskontoyla azaltma çarpanı ve etkin yüzde", () => {
  assert.equal(scaleFactorForReduction(5100, 100), 5000 / 5100)
  assert.equal(effectivePct(500, 450), 10)
  assert.equal(effectivePct(0, 0), 0)
})

import { parseNumberTR, parsePurchaseList } from "../lib/purchaseList.ts"

test("sayı okuma: Türkçe ve İngilizce biçimler", () => {
  assert.equal(parseNumberTR("1.250,50"), 1250.5)
  assert.equal(parseNumberTR("1250.5"), 1250.5)
  assert.equal(parseNumberTR("12,5"), 12.5)
  assert.equal(parseNumberTR("1.250"), 1250)
  assert.equal(parseNumberTR("₺ 90 TL"), 90)
  assert.equal(parseNumberTR("10 %"), 10)
  assert.ok(Number.isNaN(parseNumberTR("abc")))
})

test("alış listesi yapıştırma: sekme ve noktalı virgül, iskonto, hatalı satırlar", () => {
  const rows = parsePurchaseList("Ekran Koruyucu A24; 10; 45,50; 5\nKılıf iPhone 13\t3\t120\n\nBozuk satır\nKablo; 0; 10\nŞarj; 2; x")
  assert.equal(rows.length, 5)
  assert.deepEqual([rows[0].name, rows[0].quantity, rows[0].price, rows[0].discountPct, rows[0].error], ["Ekran Koruyucu A24", 10, 45.5, 5, undefined])
  assert.deepEqual([rows[1].name, rows[1].quantity, rows[1].price, rows[1].error], ["Kılıf iPhone 13", 3, 120, undefined])
  assert.ok(rows[2].error?.includes("Biçim"))
  assert.equal(rows[3].error, "Adet geçersiz")
  assert.equal(rows[4].error, "Birim fiyat geçersiz")
  assert.equal(rows[2].lineNo, 4)
})

import { normKey } from "../lib/purchaseList.ts"

test("ad eşleştirme anahtarı: Türkçe harfler ve büyük/küçük harf yok sayılır", () => {
  assert.equal(normKey("TEST TEDARİKÇİ"), normKey("test tedarikci"))
  assert.equal(normKey("TEST TEDARİKÇİ"), normKey("Test  Tedarikçi "))
  assert.equal(normKey("ŞARJ ALETİ ÇIKIŞ"), normKey("sarj aleti cikis"))
  assert.notEqual(normKey("Kılıf"), normKey("Kılıf 2"))
})

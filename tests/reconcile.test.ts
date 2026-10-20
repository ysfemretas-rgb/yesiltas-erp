import test from "node:test"
import assert from "node:assert/strict"
import { reconcile } from "../lib/reconcile.ts"
import { diffFields, formatChanges } from "../lib/diff.ts"

const base = { sales: [], repairs: [], transactions: [], purchases: [], inventory: [] }

test("tutarlı satış: sorun çıkmaz", () => {
  const issues = reconcile({
    ...base,
    sales: [{ id: "s1", saleCode: "YTS-1", customerName: "A", paymentMethod: "cash", paid: 500, remaining: 0, items: [{ purchasePrice: 300, quantity: 1 }] }],
    transactions: [{ type: "income", amount: 500, source: "sale", sourceId: "s1", description: "x" }],
  })
  assert.equal(issues.length, 0)
})

test("kasada karşılığı olmayan satış yakalanır ve düzeltme değeri doğrudur", () => {
  const issues = reconcile({
    ...base,
    sales: [{ id: "s1", saleCode: "YTS-1", customerName: "A", paymentMethod: "cash", paid: 500, remaining: 0, items: [] }],
  })
  assert.equal(issues.length, 1)
  assert.equal(issues[0].kind, "sale-finance")
  assert.equal(issues[0].fix?.desiredNet, 500)
})

test("takaslı satışta takas değeri kasadan beklenmez", () => {
  const issues = reconcile({
    ...base,
    sales: [{ id: "s1", customerName: "A", paymentMethod: "cash", paid: 1000, remaining: 0, items: [], tradeIn: { value: 400 } }],
    transactions: [{ type: "income", amount: 600, source: "sale", sourceId: "s1", description: "x" }],
  })
  assert.equal(issues.length, 0)
})

test("iptal edilmiş satışın kasa etkisi sıfır olmalı (ters kayıt ile sıfırlanmışsa sorun yok)", () => {
  const ok = reconcile({
    ...base,
    sales: [{ id: "s1", customerName: "A", status: "cancelled", paymentMethod: "cash", paid: 500, remaining: 0, items: [] }],
    transactions: [
      { type: "income", amount: 500, source: "sale", sourceId: "s1", description: "x" },
      { type: "expense", amount: 500, source: "sale", sourceId: "s1", description: "iptal" },
    ],
  })
  assert.equal(ok.length, 0)
  const bad = reconcile({
    ...base,
    sales: [{ id: "s1", customerName: "A", status: "cancelled", paymentMethod: "cash", paid: 500, remaining: 0, items: [] }],
    transactions: [{ type: "income", amount: 500, source: "sale", sourceId: "s1", description: "x" }],
  })
  assert.equal(bad.length, 1)
  assert.equal(bad[0].fix?.desiredNet, 0)
})

test("eşantiyon satışta beklenen kasa etkisi alış maliyetinin eksisidir", () => {
  const issues = reconcile({
    ...base,
    sales: [{ id: "s1", customerName: "A", paymentMethod: "gift", paid: 0, remaining: 0, items: [{ purchasePrice: 80, quantity: 2 }] }],
    transactions: [{ type: "expense", amount: 160, source: "sale", sourceId: "s1", description: "g" }],
  })
  assert.equal(issues.length, 0)
})

test("tamirde çift gelir yakalanır", () => {
  const issues = reconcile({
    ...base,
    repairs: [{ id: "r1", repairCode: "YTT-1", customerName: "B", paymentType: "cash", paid: 300 }],
    transactions: [
      { type: "income", amount: 300, source: "repair", sourceId: "r1", description: "a" },
      { type: "income", amount: 300, source: "repair", sourceId: "r1", description: "b" },
    ],
  })
  assert.equal(issues.length, 1)
  assert.equal(issues[0].fix?.desiredNet, 300)
})

test("alım belgesinin kasa gideri yoksa uyarı verir", () => {
  const issues = reconcile({ ...base, purchases: [{ id: "p1", docCode: "YTA-1", price: 5000, deviceName: "iPhone" }] })
  assert.equal(issues[0].kind, "purchase-finance")
  const ok = reconcile({
    ...base,
    purchases: [{ id: "p1", docCode: "YTA-1", price: 5000, deviceName: "iPhone" }],
    transactions: [{ type: "expense", amount: 5000, source: "manual", description: "📱 İkinci el alım: iPhone (YTA-1)" }],
  })
  assert.equal(ok.length, 0)
})

test("aynı IMEI iki aktif stokta ise yakalanır; satılmış (0 adet) kayıt sayılmaz", () => {
  const issues = reconcile({
    ...base,
    inventory: [
      { id: "1", name: "A", quantity: 1, imei: "111" },
      { id: "2", name: "B", quantity: 1, imei: "111" },
      { id: "3", name: "C", quantity: 0, imei: "111" },
    ],
  })
  assert.equal(issues.filter((i) => i.kind === "imei").length, 1)
})

test("taksit planı kalan borçla uyuşmazsa uyarı verir", () => {
  const issues = reconcile({
    ...base,
    sales: [{ id: "s1", customerName: "A", paymentMethod: "installment", paid: 0, remaining: 300, items: [], installments: [{ amount: 100, paidAmount: 0 }, { amount: 100, paidAmount: 0 }] }],
    transactions: [],
  })
  assert.ok(issues.some((i) => i.kind === "installment"))
})

test("değişiklik farkı eski → yeni olarak yazılır", () => {
  const ch = diffFields({ price: 100, name: "A" }, { price: 90, name: "A" }, [{ key: "price", label: "Fiyat" }, { key: "name", label: "Ad" }])
  assert.equal(ch.length, 1)
  assert.equal(formatChanges(ch), "Fiyat: 100 → 90")
})

test("Alışlar sayfası: ödenen alışın kasa gideri yoksa uyarı, varsa sorun yok", () => {
  const bad = reconcile({ ...base, alislar: [{ id: "a1", code: "ALS-1", partyName: "Toptancı", paid: 3000 }] })
  assert.equal(bad.length, 1)
  const ok = reconcile({
    ...base,
    alislar: [{ id: "a1", code: "ALS-1", partyName: "Toptancı", paid: 3000 }],
    transactions: [{ type: "expense", amount: 3000, source: "manual", description: "📦 Alış ALS-1: Toptancı — ürün" }],
  })
  assert.equal(ok.length, 0)
  const unpaid = reconcile({ ...base, alislar: [{ id: "a2", code: "ALS-2", partyName: "T", paid: 0 }] })
  assert.equal(unpaid.length, 0)
})

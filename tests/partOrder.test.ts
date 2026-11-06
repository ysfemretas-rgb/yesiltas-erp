import test from "node:test"
import assert from "node:assert/strict"
import { partOrderNote, lastPartOrder, appendNote, daysBetween, partOrderMessage, pickupReminderMessage } from "../lib/partOrder.ts"

test("parça siparişi notu yazılır ve en sonuncusu okunur", () => {
  const n1 = partOrderNote({ part: "Galaxy A11 ekran", qty: 1, supplier: "A-CEPGO TEKNİK SERVİS", date: "2026-11-05" })
  assert.equal(n1, "📦 Parça siparişi: Galaxy A11 ekran x1 — A-CEPGO TEKNİK SERVİS — 2026-11-05")
  const notes = appendNote(appendNote("Müşteri acele ediyor", n1), partOrderNote({ part: "A11 batarya", qty: 2, supplier: "Fenk aksesuar", date: "2026-11-07" }))
  assert.deepEqual(lastPartOrder(notes), { part: "A11 batarya", qty: 2, supplier: "Fenk aksesuar", date: "2026-11-07" })
  assert.equal(lastPartOrder("sipariş yok"), null)
  assert.equal(appendNote("", "x"), "x")
})

test("gün farkı ve mesajlar", () => {
  assert.equal(daysBetween("2026-11-01", "2026-11-08"), 7)
  const m = partOrderMessage({ contact: "Ahmet Bey", part: "A11 ekran", qty: 1, device: "Samsung Galaxy A11" })
  assert.match(m, /Merhaba Ahmet Bey/)
  assert.match(m, /\*A11 ekran\* — \*1 adet\* lazım/)
  assert.doesNotMatch(m, /\n\n\n/)
  const p = pickupReminderMessage("Ali", "iPhone 11", 5, 1250)
  assert.match(p, /5 gün önce tamamlandı/)
  assert.match(p, /Kalan ücret: \*1\.250,00 TL\*/)
  assert.doesNotMatch(pickupReminderMessage("Ali", "iPhone 11", 5, 0), /Kalan ücret/)
})

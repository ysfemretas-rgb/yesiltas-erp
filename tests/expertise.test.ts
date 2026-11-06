import test from "node:test"
import assert from "node:assert/strict"
import { EMPTY_EXPERTISE, formatExpertise, expertiseWarnings, extractExpertise, isExpertiseEmpty } from "../lib/expertise.ts"

test("ekspertiz özeti", () => {
  assert.equal(isExpertiseEmpty(EMPTY_EXPERTISE), true)
  assert.equal(formatExpertise(EMPTY_EXPERTISE), "")
  const e = { ...EMPTY_EXPERTISE, battery: "87", biometric: "ok" as const, screen: "original" as const, accountLock: "clean" as const, imeiChecked: true, tests: { ...EMPTY_EXPERTISE.tests, camera: true, charge: true }, cosmetic: "Kasa hafif çizik" }
  assert.equal(formatExpertise(e), "🔎 Ekspertiz: Pil %87 • Face/Touch ID: Çalışıyor • Ekran: Orijinal • Hesap kilidi: Yok • IMEI sorgulandı • Test edildi: Kamera, Şarj • Kozmetik: Kasa hafif çizik")
  assert.deepEqual(expertiseWarnings(e), [])
})

test("ekspertiz uyarıları ve nottan ayıklama", () => {
  const w = expertiseWarnings({ ...EMPTY_EXPERTISE, accountLock: "locked", battery: "72", biometric: "fail" })
  assert.equal(w.length, 4) // kilit, IMEI sorgulanmadı, düşük pil, Face ID
  assert.match(w[0], /hesap kilidi VAR/)
  assert.equal(extractExpertise("Ekranda çizik | 🔎 Ekspertiz: Pil %90 • Ekran: Orijinal"), "🔎 Ekspertiz: Pil %90 • Ekran: Orijinal")
  assert.equal(extractExpertise("sadece not"), "")
})

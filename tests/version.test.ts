import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { APP_VERSION } from "../lib/version.ts"
import { backupAgeDays } from "../lib/backupAge.ts"

test("public/version.json uygulama sürümüyle aynı (yeni sürüm uyarısı buna bakar)", () => {
  const j = JSON.parse(readFileSync(new URL("../public/version.json", import.meta.url), "utf8"))
  assert.equal(j.version, APP_VERSION)
})

test("son yedeğin yaşı (gün)", () => {
  const now = new Date("2026-11-10T12:00:00Z").getTime()
  assert.equal(backupAgeDays(null, now), null)
  assert.equal(backupAgeDays("2026-11-10T08:00:00Z", now), 0)
  assert.equal(backupAgeDays("2026-11-02T12:00:00Z", now), 8)
  assert.equal(backupAgeDays("bozuk", now), null)
})

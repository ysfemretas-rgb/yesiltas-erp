import test from "node:test"
import assert from "node:assert/strict"
import { stageOf, statusForStage, reconcileStage, nextStage, qcProgress, QC_ITEMS, deliveryState, REPAIR_STAGES } from "../lib/repairWorkflow.ts"

test("aşama yoksa eski kayıtlarda durumdan türetilir", () => {
  assert.equal(stageOf({ status: "waiting" }), "received")
  assert.equal(stageOf({ status: "in_progress" }), "in_repair")
  assert.equal(stageOf({ status: "completed" }), "delivered")
  assert.equal(stageOf({ stage: "geçersiz", status: "waiting" }), "received")
  assert.equal(stageOf({ stage: "qc", status: "waiting" }), "qc")
})

test("her aşama üç durumdan birine eşlenir ve sıra tutarlıdır", () => {
  assert.equal(statusForStage("awaiting_parts"), "waiting")
  assert.equal(statusForStage("qc"), "in_progress")
  assert.equal(statusForStage("ready"), "completed")
  let s: any = "received"
  let n = 0
  while (s) { n++; s = nextStage(s) }
  assert.equal(n, REPAIR_STAGES.length)
})

test("durum eski yöntemle değişince aşama tutarlı kalır", () => {
  assert.equal(reconcileStage("qc", "in_progress"), "qc") // uyumlu: korunur
  assert.equal(reconcileStage("qc", "completed"), "delivered") // uyumsuz: varsayılan
  assert.equal(reconcileStage(undefined, "waiting"), "received")
  assert.equal(reconcileStage("ready", "completed"), "ready")
})

test("kalite kontrol ilerlemesi", () => {
  assert.deepEqual(qcProgress(undefined), { done: 0, total: QC_ITEMS.length, complete: false })
  const all = Object.fromEntries(QC_ITEMS.map((i) => [i.key, true]))
  assert.equal(qcProgress({ checks: all }).complete, true)
  assert.equal(qcProgress({ checks: { screen: true } }).done, 1)
})

test("tahmini teslim: geç, yakın, normal, bitmiş", () => {
  assert.equal(deliveryState("2026-10-01", "waiting", "2026-10-20"), "late")
  assert.equal(deliveryState("2026-10-20", "in_progress", "2026-10-20"), "soon")
  assert.equal(deliveryState("2026-10-21", "in_progress", "2026-10-20"), "soon")
  assert.equal(deliveryState("2026-10-25", "waiting", "2026-10-20"), "ok")
  assert.equal(deliveryState("2026-10-01", "completed", "2026-10-20"), "none")
  assert.equal(deliveryState(undefined, "waiting", "2026-10-20"), "none")
})

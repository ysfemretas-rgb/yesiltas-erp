"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { REPAIR_STAGES, RepairStage, nextStage, stageOf, deliveryState } from "@/lib/repairWorkflow"
import { localDateStr } from "@/lib/dates"

interface BoardRepair {
  id: string
  repairCode?: string
  customerName: string
  brand: string
  model: string
  status: string
  stage?: string
  estimatedDelivery?: string
  createdAt: string
  completedAt?: string
  technician?: string
}

// Servis iş akışı panosu: aşamalara göre sütunlar. Karta dokununca tamir kaydı açılır,
// "→" ile bir sonraki aşamaya geçirilir. Yatay kaydırılabilir (telefonda da kullanılır).
export function RepairBoardDialog({
  open,
  onOpenChange,
  repairs,
  onOpenRepair,
  onMove,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  repairs: BoardRepair[]
  onOpenRepair: (id: string) => void
  onMove: (id: string, stage: RepairStage) => void
}) {
  const today = localDateStr()
  const limit = localDateStr(new Date(Date.now() - 14 * 86400000))
  // Teslim edilenlerden sadece son 14 günü göster (pano şişmesin)
  const visible = repairs.filter((r) => stageOf(r) !== "delivered" || (r.completedAt || r.createdAt) >= limit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">📋 Servis İş Akışı Panosu</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-500">Karta dokununca tamir kaydı açılır; → ile bir sonraki aşamaya geçirilir. Teslim edilenlerden son 14 gün gösterilir.</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {REPAIR_STAGES.map((stage) => {
            const items = visible.filter((r) => stageOf(r) === stage.key)
            const next = nextStage(stage.key)
            return (
              <div key={stage.key} className="w-60 shrink-0 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="px-3 py-2 border-b border-slate-700 text-sm font-medium flex items-center justify-between">
                  <span>{stage.icon} {stage.label}</span>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[60px]">
                  {items.length === 0 && <p className="text-xs text-slate-600 px-1">—</p>}
                  {items.map((r) => {
                    const d = deliveryState(r.estimatedDelivery, r.status, today)
                    const age = Math.max(0, Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${r.createdAt}T12:00:00`).getTime()) / 86400000))
                    return (
                      <div key={r.id} className={`rounded-lg border p-2 ${d === "late" ? "border-red-700 bg-red-900/10" : "border-slate-700 bg-slate-800"}`}>
                        <button type="button" onClick={() => onOpenRepair(r.id)} className="w-full text-left">
                          <div className="text-xs font-mono text-amber-400">{r.repairCode || r.id.slice(0, 8)}</div>
                          <div className="text-sm text-white truncate">{r.customerName}</div>
                          <div className="text-xs text-slate-400 truncate">{[r.brand, r.model].filter(Boolean).join(" ")}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{age} gündür{r.technician ? ` • ${r.technician}` : ""}</div>
                          {r.estimatedDelivery && (
                            <div className={`text-[11px] mt-0.5 ${d === "late" ? "text-red-400" : d === "soon" ? "text-amber-400" : "text-slate-400"}`}>
                              ⏰ Teslim: {r.estimatedDelivery}{d === "late" ? " (geçti)" : ""}
                            </div>
                          )}
                        </button>
                        {next && (
                          <Button size="sm" variant="outline" onClick={() => onMove(r.id, next)} className="mt-1.5 h-7 w-full border-slate-600 text-slate-300 text-xs">
                            {REPAIR_STAGES.find((x) => x.key === next)?.label} <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

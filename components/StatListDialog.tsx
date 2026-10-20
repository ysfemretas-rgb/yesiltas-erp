"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export interface StatRow {
  id: string
  title: string
  subtitle?: string
  right?: string
  rightClass?: string
  tag?: string
  onClick?: () => void
}

const MAX_ROWS = 200

// Sayaç kutularına basınca açılan ortak liste penceresi: kutudaki sayının hangi kayıtlardan
// oluştuğunu gösterir; arama kutusu vardır; satıra basınca ilgili kayıt açılır.
export function StatListDialog({
  open,
  onOpenChange,
  title,
  rows,
  summary,
  emptyText = "Kayıt yok.",
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  rows: StatRow[]
  summary?: string
  emptyText?: string
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => `${r.title} ${r.subtitle || ""} ${r.right || ""} ${r.tag || ""}`.toLowerCase().includes(q))
  }, [rows, query])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setQuery(""); onOpenChange(o) }}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title} ({rows.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {summary && <p className="text-sm text-slate-300">{summary}</p>}
          {rows.length > 8 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bu listede ara..." className="pl-9 bg-slate-800 border-slate-600 text-white" />
            </div>
          )}
          {filtered.length === 0 && <p className="text-sm text-slate-500">{emptyText}</p>}
          {filtered.slice(0, MAX_ROWS).map((r) => {
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">{r.title}</span>
                  {r.tag && <span className="text-[11px] font-mono text-amber-400 shrink-0">{r.tag}</span>}
                </div>
                {(r.subtitle || r.right) && (
                  <div className="text-xs mt-0.5 flex justify-between gap-2">
                    <span className="text-slate-400 truncate">{r.subtitle}</span>
                    {r.right && <span className={`shrink-0 ${r.rightClass || "text-slate-300"}`}>{r.right}</span>}
                  </div>
                )}
              </>
            )
            return r.onClick ? (
              <button key={r.id} type="button" onClick={r.onClick} className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                {body}
              </button>
            ) : (
              <div key={r.id} className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700">{body}</div>
            )
          })}
          {filtered.length > MAX_ROWS && <p className="text-xs text-slate-500">İlk {MAX_ROWS} kayıt gösteriliyor ({filtered.length} kayıt). Daraltmak için yukarıdaki kutuda arayın.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

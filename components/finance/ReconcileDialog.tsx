"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2, RefreshCw, Wrench } from "lucide-react"
import { fetchSales } from "@/lib/sales"
import { fetchRepairs } from "@/lib/repairs"
import { fetchTransactions, syncTransactionsToNet } from "@/lib/finance"
import { fetchInventory } from "@/lib/inventory"
import { fetchDevicePurchases } from "@/lib/devicePurchases"
import { fetchPurchases, Purchase } from "@/lib/purchases"
import { reconcile, Issue } from "@/lib/reconcile"
import { logActivity } from "@/lib/activityLog"
import { localDateStr } from "@/lib/dates"
import { exportToExcel } from "@/lib/exportExcel"

const SEVERITY_STYLE: Record<Issue["severity"], string> = {
  high: "bg-red-900/40 text-red-300 border-red-700",
  medium: "bg-amber-900/40 text-amber-300 border-amber-700",
  low: "bg-slate-700 text-slate-300 border-slate-600",
}
const SEVERITY_LABEL: Record<Issue["severity"], string> = { high: "Yüksek", medium: "Orta", low: "Düşük" }

// Mutabakat merkezi: satış/tamir/alım/stok/taksit kayıtlarını kasa ve borç kayıtlarıyla karşılaştırıp
// uyuşmayanları listeler. "Düzelt" eski kayıtları SİLMEZ; fark kadar bir düzeltme kaydı ekler.
export function ReconcileDialog({
  open,
  onOpenChange,
  onChanged,
  notify,
  canFix = true,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onChanged?: () => void
  notify: (message: string, type: "success" | "error") => void
  canFix?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [checkedAt, setCheckedAt] = useState("")
  const [fixing, setFixing] = useState("")
  const [loadError, setLoadError] = useState("")

  const run = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const [sales, repairs, transactions, inventory, purchases, alislar] = await Promise.all([
        fetchSales(),
        fetchRepairs(),
        fetchTransactions(),
        fetchInventory(),
        fetchDevicePurchases().catch(() => []),
        fetchPurchases().catch((): Purchase[] => []),
      ])
      const found = reconcile({
        sales: sales as any,
        repairs: repairs as any,
        transactions: transactions as any,
        purchases,
        inventory: inventory as any,
        alislar: alislar.map((a) => ({ id: a.id, code: a.code, partyName: a.partyName, paid: a.paid })),
      })
      setIssues(found)
      setCheckedAt(new Date().toLocaleTimeString("tr-TR"))
    } catch (e) {
      console.error(e)
      setLoadError("Veriler yüklenemedi; kontrol yapılamadı. Bağlantınızı kontrol edip tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) run()
  }, [open])

  const fix = async (issue: Issue) => {
    if (!issue.fix) return
    if (!confirm(`${issue.title}\n\nKasada net etki ${issue.fix.desiredNet.toLocaleString("tr-TR")} TL olacak şekilde bir düzeltme kaydı eklenecek. Eski kayıtlar silinmez.\n\nDevam edilsin mi?`)) return
    setFixing(issue.id)
    try {
      const diff = await syncTransactionsToNet(issue.fix.source, issue.fix.id, issue.fix.desiredNet, {
        label: issue.fix.label,
        customer: issue.fix.customer,
        date: localDateStr(),
      })
      logActivity("Finans", "updated", `Mutabakat düzeltmesi: ${issue.title} (${diff > 0 ? "+" : ""}${diff.toLocaleString("tr-TR")} TL)`)
      notify("Düzeltme kaydı eklendi.", "success")
      onChanged?.()
      await run()
    } catch (e) {
      console.error(e)
      notify("Düzeltme kaydı eklenemedi.", "error")
    } finally {
      setFixing("")
    }
  }

  const exportIssues = () =>
    exportToExcel("mutabakat", "Mutabakat", issues.map((i) => ({ Önem: SEVERITY_LABEL[i.severity], Başlık: i.title, Ayrıntı: i.detail })))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">🔎 Mutabakat Merkezi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Satış, tamir, ikinci el alım, stok ve taksit kayıtları kasa kayıtlarıyla karşılaştırılır. Eski sürümlerde oluşmuş kayıtlarda fark çıkabilir; "Düzelt" kasaya fark kadar düzeltme kaydı ekler, hiçbir eski kayıt silinmez.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={run} disabled={loading} className="border-slate-600 text-slate-300">
              {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}Yeniden Kontrol Et
            </Button>
            {issues.length > 0 && (
              <Button size="sm" variant="outline" onClick={exportIssues} className="border-slate-600 text-slate-300">
                <Download className="h-3 w-3 mr-1" />Excel
              </Button>
            )}
            {checkedAt && <span className="text-xs text-slate-500">Son kontrol: {checkedAt}</span>}
          </div>

          {loadError && <p className="text-sm text-red-400">{loadError}</p>}
          {loading && issues.length === 0 && <p className="text-sm text-slate-400">Kontrol ediliyor...</p>}
          {!loading && !loadError && checkedAt && issues.length === 0 && (
            <div className="p-4 rounded-lg border border-emerald-700/50 bg-emerald-900/10 text-emerald-300 text-sm">✅ Hiçbir tutarsızlık bulunamadı.</div>
          )}
          {issues.length > 0 && (
            <p className="text-sm text-amber-300">{issues.length} tutarsızlık bulundu ({issues.filter((i) => i.severity === "high").length} yüksek önemli).</p>
          )}

          <div className="space-y-2">
            {issues.map((i) => (
              <div key={i.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-white">{i.title}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${SEVERITY_STYLE[i.severity]}`}>{SEVERITY_LABEL[i.severity]}</span>
                </div>
                <div className="text-xs text-slate-400">{i.detail}</div>
                {i.fix && canFix && (
                  <Button size="sm" variant="outline" disabled={fixing === i.id} onClick={() => fix(i)} className="border-emerald-600 text-emerald-400 mt-1">
                    {fixing === i.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wrench className="h-3 w-3 mr-1" />}Düzelt (düzeltme kaydı ekle)
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

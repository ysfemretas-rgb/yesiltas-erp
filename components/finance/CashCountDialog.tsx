"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { CashCount, fetchCashCounts, createCashCount } from "@/lib/cashCounts"
import { fetchSales } from "@/lib/sales"
import { localDateStr } from "@/lib/dates"
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

interface Tx { type: "income" | "expense"; amount: number; date: string }

const r2 = (n: number) => Math.round(n * 100) / 100

// Kasa açılış / kapanış sayımı.
// Beklenen nakit = açılış nakdi + bugünün net kasa hareketi - bugün kart/havale ile alınanlar.
// (Kart/havale tutarı bugünkü satışlardan otomatik hesaplanır; gerekirse elle düzeltilebilir.)
export function CashCountDialog({
  open,
  onOpenChange,
  transactions,
  notify,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  transactions: Tx[]
  notify: (message: string, type: "success" | "error") => void
}) {
  const today = localDateStr()
  const [kind, setKind] = useState<"open" | "close">("close")
  const [history, setHistory] = useState<CashCount[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [opening, setOpening] = useState("")
  const [autoNonCash, setAutoNonCash] = useState(0)
  const [nonCash, setNonCash] = useState("")
  const [counted, setCounted] = useState("")
  const [note, setNote] = useState("")

  const todayNet = useMemo(
    () => r2(transactions.filter((t) => t.date === today).reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0)),
    [transactions, today]
  )

  const load = async () => {
    setLoading(true)
    try {
      const [counts, sales] = await Promise.all([fetchCashCounts(30).catch(() => [] as CashCount[]), fetchSales().catch(() => [])])
      setHistory(counts)
      // Bugünkü satışlarda kart/havale ile alınan tutar (takas değeri nakit değildir; ayrıca düşülmez çünkü kasaya girmemiştir)
      let nc = 0
      for (const s of sales) {
        if (s.status === "cancelled" || s.date !== today) continue
        if (s.paymentMethod === "card" || s.paymentMethod === "transfer") nc += Math.max(0, s.paid - (s.tradeIn?.value || 0))
        else if (s.paymentMethod === "split") nc += (s.payments || []).filter((p) => p.method !== "cash").reduce((sum, p) => sum + p.amount, 0)
      }
      setAutoNonCash(r2(nc))
      setNonCash(String(r2(nc)))
      const todayOpen = counts.find((c) => c.kind === "open" && c.date === today)
      const lastClose = counts.find((c) => c.kind === "close" && c.date < today)
      setOpening(String(todayOpen ? todayOpen.countedCash : lastClose ? lastClose.countedCash : 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setCounted("")
      setNote("")
      load()
    }
  }, [open])

  const openingNum = Number(opening) || 0
  const nonCashNum = Number(nonCash) || 0
  const countedNum = Number(counted)
  const expected = r2(openingNum + todayNet - nonCashNum)
  const diff = counted === "" ? null : r2(countedNum - expected)

  const save = async () => {
    if (counted === "" || Number.isNaN(countedNum) || countedNum < 0) {
      notify("Sayılan nakit tutarını girin.", "error")
      return
    }
    if (kind === "close" && diff !== null && Math.abs(diff) >= 0.5 && !note.trim()) {
      notify("Kasa farkı var; lütfen bir açıklama yazın.", "error")
      return
    }
    setSaving(true)
    try {
      await createCashCount({
        date: today,
        kind,
        countedCash: countedNum,
        expectedCash: kind === "close" ? expected : undefined,
        nonCash: kind === "close" ? nonCashNum : 0,
        note: note.trim(),
      })
      notify(kind === "open" ? "Kasa açılış sayımı kaydedildi." : "Kasa kapanış sayımı kaydedildi.", "success")
      setCounted("")
      setNote("")
      await load()
    } catch (e) {
      console.error(e)
      notify("Sayım kaydedilemedi (v7 SQL çalıştırıldı mı?).", "error")
    } finally {
      setSaving(false)
    }
  }

  const printCount = (c: CashCount) => {
    const company = readCompany()
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Kasa Sayım Tutanağı</title>
<style>@page { size: A5; margin: 12mm; } ${docStyles()}</style></head><body>
${toolbarHtml()}${letterheadHtml(company)}
<div class="doc-title">Kasa ${c.kind === "open" ? "Açılış" : "Kapanış"} Sayım Tutanağı</div>
<div class="meta"><span>Tarih: <strong>${esc(c.date)}</strong></span><span>Sayımı yapan: <strong>${esc(c.userName || "-")}</strong></span></div>
<table class="grid kv">
<tr><td class="l">Sayılan nakit</td><td class="v">${money(c.countedCash)}</td></tr>
${c.expectedCash !== null ? `<tr><td class="l">Beklenen nakit</td><td class="v">${money(c.expectedCash)}</td></tr>` : ""}
${c.kind === "close" ? `<tr><td class="l">Kart/havale (nakit dışı)</td><td class="v">${money(c.nonCash)}</td></tr>` : ""}
${c.difference !== null ? `<tr><td class="l">Fark</td><td class="v">${c.difference > 0 ? "+" : ""}${money(c.difference)}</td></tr>` : ""}
<tr><td class="l">Açıklama</td><td class="v">${esc(c.note || "-")}</td></tr>
</table>
<div class="sigs"><div class="sig"><div class="line"></div>Sayımı Yapan</div><div class="sig"><div class="line"></div>Onaylayan (Yönetici)</div></div>
${footerHtml("Dahili kullanım içindir.", company)}</body></html>`
    openPrintWindow(html)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">💵 Kasa Sayımı</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["open", "close"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 py-2 rounded-lg border text-sm ${kind === k ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}
              >
                {k === "open" ? "Açılış sayımı" : "Kapanış sayımı"}
              </button>
            ))}
          </div>

          {kind === "close" && (
            <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Açılış nakdi</span>
                <Input type="number" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} className="w-32 h-8 bg-slate-900 border-slate-600 text-white text-right" />
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Bugünkü net kasa hareketi</span><span className="text-white">{money(todayNet)}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Kart/havale ile alınan (nakit değil)</span>
                <Input type="number" inputMode="decimal" value={nonCash} onChange={(e) => setNonCash(e.target.value)} className="w-32 h-8 bg-slate-900 border-slate-600 text-white text-right" />
              </div>
              <p className="text-[11px] text-slate-500">Otomatik hesaplanan: {money(autoNonCash)} (bugünkü kart/havale satışlarından). Başka kart/havale tahsilat varsa elle düzeltin.</p>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-medium"><span className="text-slate-300">Beklenen nakit</span><span className="text-emerald-400">{money(expected)}</span></div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Sayılan nakit (TL)</label>
            <Input type="number" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="Çekmecedeki nakit" className="bg-slate-800 border-slate-600 text-white" />
          </div>
          {kind === "close" && diff !== null && (
            <div className={`text-sm font-medium ${Math.abs(diff) < 0.5 ? "text-emerald-400" : diff > 0 ? "text-cyan-400" : "text-red-400"}`}>
              {Math.abs(diff) < 0.5 ? "✅ Kasa tutuyor." : diff > 0 ? `Kasada ${money(diff)} FAZLA var.` : `Kasada ${money(-diff)} EKSİK var.`}
            </div>
          )}
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "close" ? "Açıklama (fark varsa zorunlu)" : "Not (opsiyonel)"} className="bg-slate-800 border-slate-600 text-white" />
          <Button onClick={save} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Sayımı Kaydet
          </Button>

          <div className="pt-2 border-t border-slate-700 space-y-1">
            <div className="text-sm text-slate-300 font-medium">Son sayımlar</div>
            {loading && <p className="text-xs text-slate-500">Yükleniyor...</p>}
            {!loading && history.length === 0 && <p className="text-xs text-slate-500">Henüz sayım yok.</p>}
            {history.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-800 rounded border border-slate-700">
                <div>
                  <div className="text-slate-300">{c.date} • {c.kind === "open" ? "Açılış" : "Kapanış"} • {money(c.countedCash)}</div>
                  {c.difference !== null && Math.abs(c.difference) >= 0.5 && (
                    <div className={c.difference > 0 ? "text-cyan-400" : "text-red-400"}>Fark: {c.difference > 0 ? "+" : ""}{money(c.difference)}{c.note ? ` — ${c.note}` : ""}</div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="h-7 px-2 border-slate-600 text-slate-300" onClick={() => printCount(c)}>Yazdır</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

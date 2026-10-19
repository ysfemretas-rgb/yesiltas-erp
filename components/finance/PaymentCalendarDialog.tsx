"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, Check } from "lucide-react"
import { ScheduledPayment, PAYMENT_CATEGORIES, fetchScheduledPayments, createScheduledPayment, deleteScheduledPayment, markPaymentPaid } from "@/lib/scheduledPayments"
import { fetchSales } from "@/lib/sales"
import { localDateStr } from "@/lib/dates"

const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString("tr-TR")} TL`
const daysTo = (d: string) => Math.round((new Date(`${d}T12:00:00`).getTime() - new Date(`${localDateStr()}T12:00:00`).getTime()) / 86400000)

interface Receivable { key: string; customer: string; no: number; dueDate: string; left: number }

// Ödeme takvimi: gelecek ödemeler (kira, fatura, vergi, tedarikçi...) ve beklenen taksit tahsilatları.
export function PaymentCalendarDialog({
  open,
  onOpenChange,
  isManager,
  notify,
  onChanged,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  isManager: boolean
  notify: (message: string, type: "success" | "error") => void
  onChanged?: () => void
}) {
  const [payments, setPayments] = useState<ScheduledPayment[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState("")
  const [form, setForm] = useState({ title: "", category: "Kira", amount: "", dueDate: localDateStr(), repeat: false, note: "" })

  const load = async () => {
    setLoading(true)
    try {
      const [list, sales] = await Promise.all([fetchScheduledPayments(), fetchSales().catch(() => [])])
      setPayments(list)
      const rec: Receivable[] = []
      for (const s of sales) {
        if (s.status === "cancelled") continue
        for (const inst of s.installments || []) {
          const left = Math.round((inst.amount - inst.paidAmount) * 100) / 100
          if (left > 0.01) rec.push({ key: `${s.id}-${inst.no}`, customer: s.customerName, no: inst.no, dueDate: inst.dueDate, left })
        }
      }
      rec.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
      setReceivables(rec)
    } catch (e) {
      console.error(e)
      notify("Ödeme takvimi yüklenemedi (v7 SQL çalıştırıldı mı?).", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const pending = payments.filter((p) => p.status === "pending")
  const overdue = pending.filter((p) => daysTo(p.dueDate) < 0)
  const soon = pending.filter((p) => daysTo(p.dueDate) >= 0 && daysTo(p.dueDate) <= 7)
  const next30Out = pending.filter((p) => daysTo(p.dueDate) <= 30).reduce((s, p) => s + p.amount, 0)
  const next30In = receivables.filter((r) => daysTo(r.dueDate) <= 30).reduce((s, r) => s + r.left, 0)

  const add = async () => {
    const amount = Number(form.amount)
    if (!form.title.trim() || !(amount > 0) || !form.dueDate) {
      notify("Başlık, tutar ve vade tarihi zorunludur.", "error")
      return
    }
    setBusy("add")
    try {
      await createScheduledPayment({ title: form.title.trim(), category: form.category, amount, dueDate: form.dueDate, repeat: form.repeat ? "monthly" : "none", note: form.note.trim() })
      setForm({ ...form, title: "", amount: "", note: "" })
      notify("Ödeme takvime eklendi.", "success")
      await load()
    } catch (e) {
      console.error(e)
      notify("Ödeme eklenemedi.", "error")
    } finally {
      setBusy("")
    }
  }

  const pay = async (p: ScheduledPayment) => {
    if (!confirm(`"${p.title}" ödendi olarak işaretlensin mi?\n\n${money(p.amount)} kasaya gider olarak yazılacak.${p.repeat === "monthly" ? "\nBir sonraki ayın ödemesi otomatik eklenecek." : ""}`)) return
    setBusy(p.id)
    try {
      await markPaymentPaid(p)
      notify("Ödeme kaydedildi ve kasaya gider yazıldı.", "success")
      onChanged?.()
      await load()
    } catch (e) {
      console.error(e)
      notify("Ödeme kaydedilemedi; kasaya yazılamadı.", "error")
    } finally {
      setBusy("")
    }
  }

  const remove = async (p: ScheduledPayment) => {
    if (!confirm(`"${p.title}" takvimden silinsin mi?`)) return
    setBusy(p.id)
    try {
      await deleteScheduledPayment(p.id)
      await load()
    } catch (e: any) {
      notify(e?.message || "Silinemedi.", "error")
    } finally {
      setBusy("")
    }
  }

  const dueLabel = (d: string) => {
    const n = daysTo(d)
    return n < 0 ? `${-n} gün gecikti` : n === 0 ? "bugün" : `${n} gün sonra`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">📅 Ödeme Takvimi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-red-900/20 border border-red-800"><div className="text-[11px] text-slate-400">Geciken</div><div className="text-sm font-bold text-red-400">{overdue.length} • {money(overdue.reduce((s, p) => s + p.amount, 0))}</div></div>
            <div className="p-2 rounded-lg bg-amber-900/20 border border-amber-800"><div className="text-[11px] text-slate-400">7 gün içinde</div><div className="text-sm font-bold text-amber-400">{soon.length} • {money(soon.reduce((s, p) => s + p.amount, 0))}</div></div>
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700"><div className="text-[11px] text-slate-400">30 gün: çıkış / giriş</div><div className="text-sm font-bold text-white">{money(next30Out)} / {money(next30In)}</div></div>
          </div>

          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 space-y-2">
            <div className="text-sm font-medium text-slate-300">➕ Yeni ödeme</div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Başlık (ör. Dükkân kirası)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-slate-900 border-slate-600 text-white col-span-2" />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {PAYMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" inputMode="decimal" placeholder="Tutar (TL)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-slate-900 border-slate-600 text-white" />
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-slate-900 border-slate-600 text-white" />
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.checked })} />Her ay tekrarla</label>
              <Input placeholder="Not (opsiyonel)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="bg-slate-900 border-slate-600 text-white col-span-2" />
            </div>
            <Button onClick={add} disabled={busy === "add"} className="w-full bg-emerald-600 hover:bg-emerald-700">{busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Takvime Ekle"}</Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Ödenecekler</div>
            {loading && <p className="text-xs text-slate-500">Yükleniyor...</p>}
            {!loading && pending.length === 0 && <p className="text-xs text-slate-500">Bekleyen ödeme yok.</p>}
            {pending.map((p) => {
              const n = daysTo(p.dueDate)
              return (
                <div key={p.id} className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${n < 0 ? "border-red-700 bg-red-900/10" : n <= 7 ? "border-amber-700 bg-amber-900/10" : "border-slate-700 bg-slate-800"}`}>
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{p.title} <span className="text-[10px] text-slate-500">{p.category}{p.repeat === "monthly" ? " • aylık" : ""}</span></div>
                    <div className="text-xs text-slate-400">{p.dueDate} • {dueLabel(p.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-amber-300">{money(p.amount)}</span>
                    <Button size="sm" disabled={busy === p.id} onClick={() => pay(p)} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700" title="Ödendi, kasaya yaz"><Check className="h-3 w-3" /></Button>
                    {isManager && <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => remove(p)} className="h-7 px-2 border-red-700 text-red-400"><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Beklenen tahsilatlar (taksitler)</div>
            {!loading && receivables.length === 0 && <p className="text-xs text-slate-500">Bekleyen taksit yok.</p>}
            {receivables.slice(0, 20).map((r) => (
              <div key={r.key} className="p-2 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{r.customer} — {r.no}. taksit</div>
                  <div className={`text-xs ${daysTo(r.dueDate) < 0 ? "text-red-400" : "text-slate-400"}`}>{r.dueDate} • {dueLabel(r.dueDate)}</div>
                </div>
                <span className="text-sm font-medium text-emerald-400 shrink-0">{money(r.left)}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Customer, fetchCustomers } from "@/lib/customers"
import { Supplier, fetchSuppliers, fetchSupplierPayments } from "@/lib/suppliers"
import { InventoryItem, fetchInventory } from "@/lib/inventory"
import { Purchase, fetchPurchases } from "@/lib/purchases"
import { supplierDebtInfo } from "@/lib/supplierDebt"
import { settleCustomerDebts, settleSupplierDebt, loadCustomerOpenItems, CustomerOpenItem } from "@/lib/settlement"
import { discountAmount, r2 } from "@/lib/settlementMath"
import { useExchangeRates } from "@/hooks/useExchangeRates"

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)
const toNum = (s: string) => Number(String(s).replace(",", ".")) || 0

// "İndirimle kapat": borçtan ÖDENEN (kasaya yazılır) ve İNDİRİM (kasaya yazılmaz) ayrı girilir.
// Örn. 350 borç → 300 öde + 50 indirim → borç kapanır, kasaya yalnızca 300 gelir yazılır.
export function SettleDialog({
  open,
  kind,
  presetCustomerId,
  presetSupplierName,
  onClose,
  onDone,
}: {
  open: boolean
  kind: "customer" | "supplier"
  presetCustomerId?: string
  presetSupplierName?: string
  onClose: () => void
  onDone: (message: string) => void
}) {
  const { rates } = useExchangeRates()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<{ supplierName: string; amount: number }[]>([])
  const [openItems, setOpenItems] = useState<Map<string, CustomerOpenItem[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [partyKey, setPartyKey] = useState("")
  const [payStr, setPayStr] = useState("")
  const [discStr, setDiscStr] = useState("")
  const [discType, setDiscType] = useState<"amt" | "pct">("amt")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setPayStr(""); setDiscStr(""); setDiscType("amt"); setNote(""); setError("")
    setPartyKey(kind === "customer" ? presetCustomerId || "" : presetSupplierName || "")
    setLoading(true)
    const load = kind === "customer"
      ? fetchCustomers().then(async (c) => { setCustomers(c); setOpenItems(await loadCustomerOpenItems(c)) })
      : Promise.all([fetchSuppliers(), fetchInventory(), fetchPurchases(), fetchSupplierPayments()]).then(([s, i, p, pay]) => {
          setSuppliers(s); setInventory(i); setPurchases(p); setPayments(pay)
        })
    load.catch((e) => setError(e?.message || "Veriler yüklenemedi.")).finally(() => setLoading(false))
  }, [open, kind, presetCustomerId, presetSupplierName])

  const customer = kind === "customer" ? customers.find((c) => c.id === partyKey) : undefined
  const supplier = kind === "supplier" ? suppliers.find((s) => s.name === partyKey) : undefined
  const debt = useMemo(() => {
    if (kind === "customer") return r2((openItems.get(customer?.id || "") || []).reduce((s, i) => s + i.remaining, 0))
    if (!supplier) return 0
    return r2(supplierDebtInfo(supplier.name, inventory, purchases, payments, rates).debt)
  }, [kind, customer, supplier, inventory, purchases, payments, rates, openItems])

  const pay = r2(Math.max(0, toNum(payStr)))
  const discount = discType === "pct" ? discountAmount("pct", toNum(discStr), debt) : r2(Math.max(0, toNum(discStr)))
  const remainingAfter = r2(debt - pay - discount)
  const over = pay + discount > debt + 0.004
  const canSave = !!partyKey && debt > 0 && pay + discount > 0 && !over && !saving

  // Borçlu taraflar önce
  const debtOfCustomer = (id: string) => r2((openItems.get(id) || []).reduce((s, i) => s + i.remaining, 0))
  const customerOptions = useMemo(() => [...customers].sort((a, b) => (debtOfCustomer(b.id) > 0 ? 1 : 0) - (debtOfCustomer(a.id) > 0 ? 1 : 0) || a.name.localeCompare(b.name, "tr")), [customers, openItems])
  const supplierOptions = useMemo(() => {
    const withDebt = suppliers.map((s) => ({ s, debt: supplierDebtInfo(s.name, inventory, purchases, payments, rates).debt }))
    return withDebt.sort((a, b) => (b.debt > 0 ? 1 : 0) - (a.debt > 0 ? 1 : 0) || a.s.name.localeCompare(b.s.name, "tr"))
  }, [suppliers, inventory, purchases, payments, rates])

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    setError("")
    try {
      const noteText = note.trim()
      const res = kind === "customer"
        ? await settleCustomerDebts(customer!, customers, pay, discount, noteText)
        : await settleSupplierDebt(supplier!.name, debt, pay, discount, noteText)
      const who = kind === "customer" ? customer!.name : supplier!.name
      const left = res.plan.remainingAfter
      onDone(
        `${who}: ${pay > 0 ? `${money(pay)} ${kind === "customer" ? "tahsil edildi" : "ödendi (kasaya yazıldı)"}` : ""}${pay > 0 && discount > 0 ? ", " : ""}${discount > 0 ? `${money(discount)} indirim yapıldı` : ""}. ${left > 0.004 ? `Kalan borç ${money(left)}.` : "Borç kapandı."}${res.warning ? " " + res.warning : ""}`
      )
      onClose()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "İşlem tamamlanamadı. Kontrol edip tekrar deneyin (bir kısmı işlenmiş olabilir).")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{kind === "customer" ? "💰 Müşteriden Tahsilat / İndirimle Kapat" : "🏭 Tedarikçiye Ödeme / İndirimle Kapat"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {loading && <p className="text-slate-400">Yükleniyor...</p>}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">{kind === "customer" ? "Müşteri" : "Tedarikçi"}</label>
            <select
              value={partyKey}
              onChange={(e) => { setPartyKey(e.target.value); setPayStr(""); setDiscStr(""); setError("") }}
              disabled={kind === "customer" ? !!presetCustomerId : !!presetSupplierName}
              className="w-full rounded-md bg-slate-800 border border-slate-600 text-white p-2"
            >
              <option value="">— Seçin —</option>
              {kind === "customer"
                ? customerOptions.map((c) => <option key={c.id} value={c.id}>{c.name}{debtOfCustomer(c.id) > 0 ? ` — borç ${money(debtOfCustomer(c.id))}` : ""}</option>)
                : supplierOptions.map(({ s, debt: d }) => <option key={s.id} value={s.name}>{s.name}{d > 0 ? ` — borcumuz ${money(d)}` : ""}</option>)}
            </select>
          </div>

          {partyKey && (
            <>
              <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 flex justify-between">
                <span className="text-slate-400">{kind === "customer" ? "Müşterinin borcu" : "Bizim borcumuz"}</span>
                <span className="font-bold text-amber-300">{money(debt)}</span>
              </div>
              {debt <= 0 ? (
                <p className="text-slate-400">Bu kayıtta kapatılacak borç yok.</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">{kind === "customer" ? "Alınan para (kasaya GELİR yazılır)" : "Ödenen para (kasaya GİDER yazılır)"}</label>
                    <Input inputMode="decimal" value={payStr} onChange={(e) => setPayStr(e.target.value)} placeholder="0" className="bg-slate-800 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">İndirim (kasaya yazılmaz)</label>
                    <div className="flex gap-2">
                      <Input inputMode="decimal" value={discStr} onChange={(e) => setDiscStr(e.target.value)} placeholder="0" className="bg-slate-800 border-slate-600 text-white" />
                      <div className="flex rounded-md overflow-hidden border border-slate-600 shrink-0">
                        {(["amt", "pct"] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setDiscType(t)} className={`px-3 text-sm ${discType === t ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}>{t === "amt" ? "₺" : "%"}</button>
                        ))}
                      </div>
                    </div>
                    {discType === "pct" && toNum(discStr) > 0 && <p className="text-[11px] text-slate-500">Borcun %{toNum(discStr)}'i = {money(discount)}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setPayStr(String(debt)); setDiscStr(""); setDiscType("amt") }}>Tamamını {kind === "customer" ? "tahsil et" : "öde"}</Button>
                    <Button type="button" size="sm" variant="outline" className="border-emerald-700 text-emerald-300" onClick={() => { setDiscType("amt"); setDiscStr(String(Math.max(0, r2(debt - pay)))) }}>Kalanı indirim yap</Button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Not (isteğe bağlı)</label>
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn: nakit ödeme indirimi" className="bg-slate-800 border-slate-600 text-white" />
                  </div>

                  <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-400">Borç</span><span>{money(debt)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Ödenen</span><span className="text-emerald-300">− {money(pay)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">İndirim</span><span className="text-emerald-300">− {money(discount)}</span></div>
                    <div className="flex justify-between border-t border-slate-700 pt-1 font-semibold">
                      <span>{over ? "⚠️ Borçtan fazla" : remainingAfter <= 0.004 ? "✅ Borç kapanır" : "Kalan borç"}</span>
                      <span className={over ? "text-red-400" : remainingAfter <= 0.004 ? "text-emerald-300" : "text-amber-300"}>{over ? money(-remainingAfter) : money(Math.max(0, remainingAfter))}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {error && <p className="text-red-400 text-xs whitespace-pre-wrap">{error}</p>}
          <Button disabled={!canSave} onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

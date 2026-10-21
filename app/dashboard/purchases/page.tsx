"use client"

import { useEffect, useMemo, useState } from "react"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Truck, Smartphone, Printer, Banknote, Download } from "lucide-react"
import { NewPurchaseDialog } from "@/components/purchases/NewPurchaseDialog"
import { StatListDialog, StatRow } from "@/components/StatListDialog"
import { Pagination } from "@/components/Pagination"
import { Purchase, fetchPurchases, payPurchase, correctPurchasePrices } from "@/lib/purchases"
import { InventoryItem, fetchInventory } from "@/lib/inventory"
import { Supplier, fetchSuppliers } from "@/lib/suppliers"
import { fetchCustomers } from "@/lib/customers"
import { paymentStatusOf } from "@/lib/purchaseMath"
import { printPurchaseSlip } from "@/lib/purchaseDoc"
import { printPurchaseDocument } from "@/lib/devicePurchases"
import { exportToExcel } from "@/lib/exportExcel"
import { localDateStr } from "@/lib/dates"

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0)
const PAGE_SIZE = 20

export default function PurchasesPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Envanter")
  const isManager = useIsManager()
  const { rates, isFallback } = useExchangeRates()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<"all" | "supplier" | "customer">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all")
  const [page, setPage] = useState(1)
  const [newKind, setNewKind] = useState<null | "supplier" | "customer">(null)
  const [detail, setDetail] = useState<Purchase | null>(null)
  const [statKey, setStatKey] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  // Yanlış girilen alış fiyatı / para birimi düzeltme
  const [fix, setFix] = useState<{ index: number } | null>(null)
  const [fixPrice, setFixPrice] = useState("")
  const [fixCur, setFixCur] = useState<"TRY" | "USD" | "EUR">("TRY")
  const [fixSaving, setFixSaving] = useState(false)

  const reload = async () => {
    const [p, inv] = await Promise.all([fetchPurchases(), fetchInventory()])
    setPurchases(p)
    setInventory(inv)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPurchases().catch((e) => { console.error(e); if (!cancelled) showToast("Alışlar yüklenemedi (SQL v9 çalıştırıldı mı?).", "error"); return [] as Purchase[] }), fetchInventory(), fetchSuppliers(), fetchCustomers()])
      .then(([p, inv, sup, cus]) => {
        if (cancelled) return
        setPurchases(p)
        setInventory(inv)
        setSuppliers(sup)
        setCustomers(cus)
        // ?yeni=musteri veya ?yeni=tedarikci ile doğrudan açılır
        const q = new URLSearchParams(window.location.search).get("yeni")
        if (q === "musteri") setNewKind("customer")
        else if (q === "tedarikci") setNewKind("supplier")
        if (q) window.history.replaceState(null, "", window.location.pathname)
      })
      .catch((e) => { console.error(e); if (!cancelled) showToast("Veriler yüklenirken bir sorun oluştu.", "error") })
      .finally(() => { if (!cancelled) setIsLoaded(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { setPage(1) }, [search, kindFilter, statusFilter])

  const remainingOf = (p: Purchase) => Math.round((p.total - p.paid) * 100) / 100
  const statusOf = (p: Purchase) => paymentStatusOf(p.total, p.paid)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return purchases.filter((p) => {
      if (kindFilter !== "all" && p.kind !== kindFilter) return false
      if (statusFilter !== "all" && statusOf(p) !== statusFilter) return false
      if (!q) return true
      return `${p.code} ${p.partyName} ${p.invoiceNo} ${p.items.map((i) => `${i.name} ${i.imei || ""} ${i.productCode || ""}`).join(" ")}`.toLowerCase().includes(q)
    })
  }, [purchases, search, kindFilter, statusFilter])

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-slate-400">Yükleniyor...</div></div>
  }
  if (!authorized) return null

  const month = localDateStr().slice(0, 7)
  const openDebt = purchases.filter((p) => p.kind === "supplier" && remainingOf(p) > 0.009)
  const thisMonth = purchases.filter((p) => p.date.startsWith(month))
  const customerBuys = purchases.filter((p) => p.kind === "customer")

  const rowOf = (p: Purchase, right: string, rightClass: string): StatRow => ({
    id: p.id,
    title: p.partyName,
    tag: p.code,
    subtitle: `${p.date} • ${p.items.map((i) => i.name).join(", ")}`,
    right,
    rightClass,
    onClick: () => { setStatKey(null); setDetail(p) },
  })
  const defs: Record<string, { title: string; rows: StatRow[]; summary?: string }> = {
    all: { title: "Tüm Alışlar", rows: purchases.map((p) => rowOf(p, money(p.total), "text-white")) },
    debt: { title: "Ödenmemiş Tedarikçi Alışları", summary: `Toplam borç: ${money(openDebt.reduce((s, p) => s + remainingOf(p), 0))}`, rows: openDebt.map((p) => rowOf(p, `Kalan ${money(remainingOf(p))}`, "text-amber-400")) },
    month: { title: "Bu Ayki Alışlar", summary: `Toplam: ${money(thisMonth.reduce((s, p) => s + p.total, 0))}`, rows: thisMonth.map((p) => rowOf(p, money(p.total), "text-emerald-400")) },
    customer: { title: "Müşteriden Alınan Cihazlar", rows: customerBuys.map((p) => rowOf(p, money(p.total), "text-sky-400")) },
  }
  const def = statKey ? defs[statKey] : null

  const handleCreated = async (p: Purchase, extra: { sellerIdNo: string }) => {
    await reload().catch((e) => console.error(e))
    if (p.kind === "customer") {
      printPurchaseDocument({
        id: p.id,
        docCode: p.code,
        sellerName: p.partyName,
        sellerPhone: p.partyPhone,
        sellerIdNo: extra.sellerIdNo,
        deviceName: p.items.map((i) => i.name).join(", "),
        imei: p.items.find((i) => i.imei)?.imei || "",
        conditionNote: p.items.map((i) => i.conditionNote).filter(Boolean).join("; "),
        price: p.total,
        date: p.date,
      })
    }
  }

  // Yanlış girilen alış fiyatı / para birimi düzeltme (kancalar erken return'dan ÖNCE olmalı)
  const openFix = (idx: number) => {
    if (!detail) return
    setFix({ index: idx })
    setFixPrice(String(detail.items[idx].unitPrice))
    setFixCur(detail.items[idx].currency as "TRY" | "USD" | "EUR")
  }
  const saveFix = async () => {
    if (!detail || !fix) return
    const price = Number(String(fixPrice).replace(",", "."))
    if (!(price >= 0) || fixPrice.trim() === "") return showToast("Geçerli bir fiyat girin.", "error")
    const line = detail.items[fix.index]
    if (price === line.unitPrice && fixCur === line.currency) { setFix(null); return }
    if (!confirm(`${line.name}\nEski: ${line.unitPrice.toLocaleString("tr-TR")} ${line.currency}  →  Yeni: ${price.toLocaleString("tr-TR")} ${fixCur}\n\nAlış toplamı ve tedarikçi borcu buna göre güncellenir. Devam edilsin mi?`)) return
    setFixSaving(true)
    try {
      const r = await correctPurchasePrices(detail, [{ index: fix.index, unitPrice: price, currency: fixCur }], rates, isFallback)
      const fresh = await fetchPurchases()
      setPurchases(fresh)
      setDetail(fresh.find((x) => x.id === detail.id) || null)
      setFix(null)
      showToast(`Fiyat düzeltildi. Yeni alış toplamı: ${money(r.newTotal)}${r.refund > 0.009 ? ` • ${money(r.refund)} fazla ödeme kasaya iade geliri yazıldı` : ""}.`, "success")
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Fiyat düzeltilemedi.", "error")
    } finally {
      setFixSaving(false)
    }
  }

  const doPay = async (p: Purchase) => {
    const rem = remainingOf(p)
    const input = window.prompt(`${p.partyName} — ${p.code}\nKalan borç: ${money(rem)}\n\nÖdenen tutar (TL):`, String(rem))
    if (input === null) return
    const amount = Number(String(input).replace(",", "."))
    if (!(amount > 0)) return showToast("Geçerli bir tutar girin.", "error")
    setPaying(true)
    try {
      await payPurchase(p, amount)
      await reload()
      setDetail(null)
      showToast("Ödeme kaydedildi ve kasaya gider yazıldı.", "success")
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Ödeme kaydedilemedi.", "error")
    } finally {
      setPaying(false)
    }
  }

  const exportAll = () =>
    exportToExcel("alislar", "Alışlar", purchases.flatMap((p) => p.items.map((i) => ({
      "Alış No": p.code, Tarih: p.date, Tür: p.kind === "supplier" ? "Tedarikçi" : "Müşteriden", "Taraf": p.partyName, "Fatura No": p.invoiceNo,
      Ürün: i.name, Kod: i.productCode || "", IMEI: i.imei || "", Adet: i.quantity, "Birim Alış": i.unitPrice, "Para Birimi": i.currency, "Birim Maliyet (TL)": i.unitCostTRY,
      "Alış Toplamı (TL)": p.total, "Ödenen (TL)": p.paid, "Kalan (TL)": remainingOf(p),
    }))))

  const stat = (key: string, label: string, value: string, cls: string) => (
    <Card onClick={() => setStatKey(key)} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">{label}</CardTitle></CardHeader>
      <CardContent><div className={`text-3xl font-bold ${cls}`}>{value}</div></CardContent>
    </Card>
  )

  const statusBadge = (p: Purchase) => {
    const st = statusOf(p)
    return st === "paid" ? <Badge className="bg-emerald-600/20 text-emerald-400">✅ Ödendi</Badge>
      : st === "partial" ? <Badge className="bg-amber-600/20 text-amber-400">◐ Kalan {money(remainingOf(p))}</Badge>
      : <Badge className="bg-red-600/20 text-red-400">⏳ Ödenmedi {money(remainingOf(p))}</Badge>
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">📥 Alışlar</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportAll} className="border-slate-600 text-slate-300"><Download className="h-4 w-4 mr-2" />Excel</Button>
          <Button onClick={() => setNewKind("customer")} variant="outline" className="border-sky-600 text-sky-400"><Smartphone className="h-4 w-4 mr-2" />Müşteriden Alış</Button>
          <Button onClick={() => setNewKind("supplier")} className="bg-emerald-600 hover:bg-emerald-700"><Truck className="h-4 w-4 mr-2" />Tedarikçiden Alış</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stat("all", "Toplam Alış", String(purchases.length), "text-white")}
        {stat("debt", "Ödenmemiş Borç", money(openDebt.reduce((s, p) => s + remainingOf(p), 0)), "text-amber-400")}
        {stat("month", "Bu Ay Alış", money(thisMonth.reduce((s, p) => s + p.total, 0)), "text-emerald-400")}
        {stat("customer", "Müşteriden Alınan", String(customerBuys.length), "text-sky-400")}
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Alış no, tedarikçi/satıcı, ürün, IMEI, fatura no..." className="pl-10 bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="flex gap-2 flex-wrap text-xs">
            {([["all", "Hepsi"], ["supplier", "🚚 Tedarikçi"], ["customer", "📱 Müşteriden"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setKindFilter(k)} className={`px-3 py-1.5 rounded-md border ${kindFilter === k ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>{l}</button>
            ))}
            <span className="w-px bg-slate-700 mx-1" />
            {([["all", "Tüm ödemeler"], ["unpaid", "Ödenmedi"], ["partial", "Kısmi"], ["paid", "Ödendi"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 rounded-md border ${statusFilter === k ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>{l}</button>
            ))}
          </div>

          {!isLoaded ? (
            <p className="text-sm text-slate-500">Yükleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Alış kaydı yok. Tedarikçiden ya da müşteriden alış yaparak başlayın; alınan ürünler otomatik envantere eklenir.</p>
          ) : (
            <div className="space-y-2">
              {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                <button key={p.id} type="button" onClick={() => setDetail(p)} className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{p.kind === "supplier" ? "🚚" : "📱"} {p.partyName}</span>
                    <span className="text-xs font-mono text-amber-400 shrink-0">{p.code}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{p.date} • {p.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    {statusBadge(p)}
                    <span className="text-sm font-semibold text-white">{money(p.total)}</span>
                  </div>
                </button>
              ))}
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
                goToPage={(n) => setPage(Math.max(1, Math.min(n, Math.ceil(filtered.length / PAGE_SIZE))))}
                goToNext={() => setPage((n) => Math.min(n + 1, Math.ceil(filtered.length / PAGE_SIZE)))}
                goToPrev={() => setPage((n) => Math.max(n - 1, 1))}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <NewPurchaseDialog
        kind={newKind || "supplier"}
        open={newKind !== null}
        onOpenChange={(o) => { if (!o) setNewKind(null) }}
        inventory={inventory}
        suppliers={suppliers}
        customers={customers}
        rates={rates}
        isFallback={isFallback}
        onCreated={handleCreated}
        onSupplierAdded={(s) => setSuppliers((prev) => [s, ...prev])}
        notify={showToast}
      />

      <StatListDialog open={!!def} onOpenChange={(o) => { if (!o) setStatKey(null) }} title={def?.title || ""} rows={def?.rows || []} summary={def?.summary} />

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="text-white">{detail.kind === "supplier" ? "🚚" : "📱"} Alış {detail.code}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between flex-wrap gap-1"><span className="text-white font-medium">{detail.partyName}{detail.partyPhone ? ` • ${detail.partyPhone}` : ""}</span><span className="text-xs text-slate-400">{detail.date}{detail.invoiceNo ? ` • Fatura ${detail.invoiceNo}` : ""}</span></div>
                <div className="space-y-1">
                  {detail.items.map((i, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-800 border border-slate-700">
                      <div className="flex justify-between gap-2"><span>{i.name} <span className="text-slate-500">x{i.quantity}</span>{detail.kind === "supplier" && <button type="button" onClick={() => openFix(idx)} className="ml-2 text-[11px] text-sky-400 underline" title="Yanlış girilen fiyatı / para birimini düzelt">✏️ Fiyatı düzelt</button>}</span><span className="text-amber-300 shrink-0">{money(i.quantity * i.unitCostTRY)}</span></div>
                      <div className="text-xs text-slate-400">{i.unitPrice.toLocaleString("tr-TR")} {i.currency}{i.currency !== "TRY" ? ` (kur ${i.rate})` : ""}{i.productCode ? ` • ${i.productCode}` : ""}{i.imei ? ` • IMEI ${i.imei}` : ""}{i.salePrice > 0 ? ` • satış ${money(i.salePrice)}` : ""}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 border-t border-slate-700 pt-2">
                  <div className="flex justify-between font-bold"><span>Toplam</span><span>{money(detail.total)}</span></div>
                  <div className="flex justify-between text-emerald-400"><span>Ödenen</span><span>{money(detail.paid)}</span></div>
                  {remainingOf(detail) > 0.009 && <div className="flex justify-between text-amber-400"><span>Kalan borç</span><span>{money(remainingOf(detail))}</span></div>}
                </div>
                {detail.note && <p className="text-xs text-slate-400">Not: {detail.note}</p>}
                <div className="flex gap-2 flex-wrap pt-1">
                  {detail.kind === "supplier" && remainingOf(detail) > 0.009 && (
                    <Button size="sm" disabled={paying} onClick={() => doPay(detail)} className="bg-emerald-600 hover:bg-emerald-700"><Banknote className="h-3 w-3 mr-1" />Ödeme Yap</Button>
                  )}
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => printPurchaseSlip(detail)}><Printer className="h-3 w-3 mr-1" />Alış Fişi</Button>
                  {detail.kind === "customer" && (
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => printPurchaseDocument({ id: detail.id, docCode: detail.code, sellerName: detail.partyName, sellerPhone: detail.partyPhone, sellerIdNo: "", deviceName: detail.items.map((i) => i.name).join(", "), imei: detail.items.find((i) => i.imei)?.imei || "", conditionNote: detail.items.map((i) => i.conditionNote).filter(Boolean).join("; "), price: detail.total, date: detail.date })}><Printer className="h-3 w-3 mr-1" />Alım Belgesi</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!fix} onOpenChange={(o) => { if (!o) setFix(null) }}>
        <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle className="text-white">✏️ Alış Fiyatını Düzelt</DialogTitle></DialogHeader>
          {detail && fix && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-300">{detail.items[fix.index].name} <span className="text-slate-500">x{detail.items[fix.index].quantity}</span></p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Birim alış fiyatı</label>
                  <Input type="number" inputMode="decimal" value={fixPrice} onChange={(e) => setFixPrice(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Para birimi</label>
                  <select value={fixCur} onChange={(e) => setFixCur(e.target.value as "TRY" | "USD" | "EUR")} className="w-full h-10 rounded-md bg-slate-800 border border-slate-600 text-white px-2">
                    <option value="TRY">₺ TL</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-400">Yeni satır toplamı: {money((detail.items[fix.index].quantity || 0) * (Math.round((Number(String(fixPrice).replace(",", ".")) || 0) * (fixCur === "TRY" ? 1 : fixCur === detail.items[fix.index].currency && detail.items[fix.index].rate > 0 ? detail.items[fix.index].rate : fixCur === "USD" ? rates.USD : rates.EUR) * 100) / 100))}. Alış toplamı ve tedarikçi borcu buna göre değişir; ödenen tutar yeni toplamdan fazlaysa fazlası kasaya iade geliri olarak yazılır.</p>
              <Button disabled={fixSaving} onClick={saveFix} className="w-full bg-sky-600 hover:bg-sky-700">{fixSaving ? "Kaydediliyor..." : "Düzelt"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

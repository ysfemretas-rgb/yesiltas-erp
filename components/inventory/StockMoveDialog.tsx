"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { InventoryItem, adjustInventoryQuantity, InsufficientStockError } from "@/lib/inventory"
import { Supplier } from "@/lib/suppliers"
import { createPurchase, reduceStockPurchase } from "@/lib/purchases"
import { Currency, rateFor, unitCostTRY, purchaseTotal } from "@/lib/purchaseMath"

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0)

// Envanterdeki + / − düğmeleri:
//  + : "Tedarikçiden satın alındı" -> Alışlar'a kaydedilir (borç yazılır / kasaya gider), ya da "sayım düzeltmesi".
//  − : "Hatalı alışı düzelt / iade" -> alış ve tedarikçi borcu da düşer (ödenmişse fark kasaya gelir yazılır),
//      ya da "satış dışı çıkış" (kayıp, hasar, sayım farkı) -> borç aynı kalır.
export function StockMoveDialog({
  item,
  mode,
  onClose,
  suppliers,
  rates,
  isFallback,
  onDone,
  notify,
}: {
  item: InventoryItem | null
  mode: "in" | "out"
  onClose: () => void
  suppliers: Supplier[]
  rates: { USD: number; EUR: number }
  isFallback: boolean
  onDone: () => void
  notify: (m: string, t: "success" | "error") => void
}) {
  const [qty, setQty] = useState("1")
  const [kind, setKind] = useState<"purchase" | "adjust">("purchase")
  const [supplier, setSupplier] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [currency, setCurrency] = useState<Currency>("TRY")
  const [payMode, setPayMode] = useState<"paid" | "partial" | "unpaid">("unpaid")
  const [paidInput, setPaidInput] = useState("")
  const [outKind, setOutKind] = useState<"fix" | "loss">("fix")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!item) return
    setQty("1")
    setKind(item.supplier || suppliers.length > 0 ? "purchase" : "adjust")
    setSupplier(item.supplier || "")
    setUnitPrice(String(item.purchasePrice || ""))
    setCurrency(item.purchaseCurrency)
    setPayMode(item.paymentStatus === "paid" ? "paid" : "unpaid")
    setPaidInput("")
    setOutKind(item.supplier ? "fix" : "loss")
  }, [item?.id, mode])

  if (!item) return null
  const quantity = Math.floor(Number(qty)) || 0
  const price = Number(unitPrice) || 0
  const total = purchaseTotal([{ quantity, unitCostTRY: unitCostTRY(price, currency, rates) }])
  const paid = payMode === "paid" ? total : payMode === "unpaid" ? 0 : Math.min(total, Number(paidInput) || 0)

  const run = async () => {
    if (saving) return
    if (!(quantity > 0)) return notify("Adet girin.", "error")
    setSaving(true)
    try {
      if (mode === "in") {
        if (kind === "adjust") {
          await adjustInventoryQuantity(item.id, quantity, "Sayım düzeltmesi (+)", item.name)
          notify(`Stok ${quantity} adet artırıldı (sayım düzeltmesi; alış/borç oluşmadı).`, "success")
        } else {
          if (!supplier) throw new Error("Tedarikçi seçin.")
          if (currency !== "TRY" && isFallback) throw new Error("Güncel döviz kuru alınamadı; dövizli alış şu an kaydedilemez.")
          const rate = rateFor(currency, rates)
          const { purchase, warnings } = await createPurchase({
            kind: "supplier",
            partyName: supplier,
            partyPhone: suppliers.find((s) => s.name === supplier)?.phone,
            lines: [{
              isNew: false, inventoryId: item.id, name: item.name, category: item.category, quantity, unitPrice: price, currency, rate,
              unitCostTRY: unitCostTRY(price, currency, rates), salePrice: 0, profitMargin: item.profitMargin, minQuantity: item.minQuantity, productCode: item.productCode,
            }],
            paid,
            note: "Envanterden stok girişi (+)",
          })
          warnings.forEach((w) => notify(w, "error"))
          notify(`Alış kaydedildi (${purchase.code}): ${item.name} +${quantity}${total - paid > 0.009 ? ` • ${supplier} borcu ${money(total - paid)} eklendi` : ""}.`, "success")
        }
      } else {
        if (quantity > item.quantity) throw new Error(`Stokta sadece ${item.quantity} adet var.`)
        if (outKind === "fix") {
          const r = await reduceStockPurchase(item.id, quantity)
          const refund = r.reverted.reduce((s, x) => s + x.refund, 0)
          notify(`Alış düzeltildi: stok -${quantity}, ${item.supplier || "tedarikçi"} borcu da düştü${refund > 0.009 ? ` • ${money(refund)} tedarikçi iadesi kasaya gelir yazıldı` : ""}.`, "success")
        } else {
          await adjustInventoryQuantity(item.id, -quantity, "Satış dışı çıkış (kayıp/hasar/sayım) (-)", item.name, true)
          notify(`Stok ${quantity} adet azaltıldı (borç aynı kaldı).`, "success")
        }
      }
      onDone()
      onClose()
    } catch (e: any) {
      console.error(e)
      notify(e instanceof InsufficientStockError ? e.message : e?.message || "İşlem yapılamadı.", "error")
    } finally {
      setSaving(false)
    }
  }

  const choice = (active: boolean) => `w-full text-left p-3 rounded-lg border text-sm ${active ? "border-emerald-600 bg-emerald-600/15 text-emerald-200" : "border-slate-600 text-slate-300"}`

  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{mode === "in" ? "➕ Stok Girişi" : "➖ Stok Çıkışı"} — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-slate-400">Mevcut stok: {item.quantity} adet{item.supplier ? ` • Tedarikçi: ${item.supplier}` : ""}</div>
          <Input type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Adet" className="bg-slate-800 border-slate-600 text-white" />

          {mode === "in" ? (
            <>
              <button type="button" className={choice(kind === "purchase")} onClick={() => setKind("purchase")}>
                🛒 <b>Tedarikçiden satın alındı</b><br /><span className="text-xs opacity-80">Alışlar'a kaydedilir; ödenmeyen kısım tedarikçi borcu olur, ödenen kasaya gider yazılır.</span>
              </button>
              <button type="button" className={choice(kind === "adjust")} onClick={() => setKind("adjust")}>
                🔧 <b>Sadece sayım düzeltmesi</b><br /><span className="text-xs opacity-80">Alış kaydı ve borç oluşmaz; sadece stok artar.</span>
              </button>
              {kind === "purchase" && (
                <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                  <Select value={supplier} onValueChange={setSupplier}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Tedarikçi seçin" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Birim alış" className="bg-slate-800 border-slate-600 text-white" />
                    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="TRY" className="text-white">₺ TL</SelectItem>
                        <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                        <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    {([["paid", "✅ Ödendi"], ["partial", "◐ Kısmi"], ["unpaid", "⏳ Ödenmedi"]] as const).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => setPayMode(k)} className={`flex-1 py-1.5 rounded-md border text-xs ${payMode === k ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>{l}</button>
                    ))}
                  </div>
                  {payMode === "partial" && <Input type="number" inputMode="decimal" value={paidInput} onChange={(e) => setPaidInput(e.target.value)} placeholder="Şimdi ödenen (TL)" className="bg-slate-800 border-slate-600 text-white" />}
                  <p className="text-xs text-slate-400">Toplam {money(total)} • ödenen {money(paid)}{total - paid > 0.009 ? ` • borç ${money(total - paid)}` : ""}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <button type="button" className={choice(outKind === "fix")} onClick={() => setOutKind("fix")}>
                ↩️ <b>Hatalı alış girişini düzelt / tedarikçiye iade</b><br /><span className="text-xs opacity-80">Alış kaydı ve tedarikçi borcu da düşer (ödenmişse fark kasaya "Tedarikçi İadesi" geliri yazılır).</span>
              </button>
              <button type="button" className={choice(outKind === "loss")} onClick={() => setOutKind("loss")}>
                📉 <b>Satış dışı çıkış: kayıp, hasar, sayım farkı</b><br /><span className="text-xs opacity-80">Stok azalır, tedarikçi borcu aynı kalır.</span>
              </button>
              <p className="text-xs text-slate-500">Satış yaptığınızda stok zaten otomatik düşer; satış için bu ekranı kullanmayın.</p>
            </>
          )}

          <Button onClick={run} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{mode === "in" ? (kind === "purchase" ? "Alışı Kaydet" : "Stoğu Artır") : "Stoğu Azalt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

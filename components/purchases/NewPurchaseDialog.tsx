"use client"

import { getDefaultMinStock } from "@/lib/stockLevel"
import { PhoneInput } from "@/components/PhoneInput"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react"
import { SearchPicker } from "@/components/SearchPicker"
import { CustomerPicker, PickerCustomer } from "@/components/CustomerPicker"
import { InventoryItem } from "@/lib/inventory"
import { Supplier, createSupplier } from "@/lib/suppliers"
import { Purchase, PurchaseLine, createPurchase } from "@/lib/purchases"
import { PRODUCT_TYPE_GROUPS, PHONE_CATALOG, PHONE_BRANDS, findProductType, buildProductName } from "@/lib/productCatalog"
import { Currency, rateFor, unitCostTRY, suggestedSalePrice, purchaseTotal, paymentStatusOf } from "@/lib/purchaseMath"
import { localDateStr } from "@/lib/dates"
import { lineNetUnitPrice, discountAmount, generalFactor, effectivePct } from "@/lib/settlementMath"
import { parsePurchaseList, normKey } from "@/lib/purchaseList"
import { makePurchaseLine } from "@/lib/purchaseLines"

const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0)

// Satır ekleme formu: mevcut ürüne stok ekle YA DA yeni ürün tanımla
function LineEditor({
  kind,
  inventory,
  rates,
  isFallback,
  onAdd,
  notify,
}: {
  kind: "supplier" | "customer"
  inventory: InventoryItem[]
  rates: { USD: number; EUR: number }
  isFallback: boolean
  onAdd: (line: PurchaseLine) => void
  notify: (m: string, t: "success" | "error") => void
}) {
  const [mode, setMode] = useState<"existing" | "new">(kind === "customer" ? "new" : "existing")
  const [existingLabel, setExistingLabel] = useState("")
  const [typeLabel, setTypeLabel] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [variant, setVariant] = useState("")
  const [name, setName] = useState("")
  const [qty, setQty] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")
  const [currency, setCurrency] = useState<Currency>("TRY")
  const [margin, setMargin] = useState("20")
  const [salePrice, setSalePrice] = useState("")
  const [minQty, setMinQty] = useState(kind === "supplier" ? String(getDefaultMinStock()) : "0")
  const [imei, setImei] = useState("")
  const [condition, setCondition] = useState("")
  const [discType, setDiscType] = useState<"pct" | "amt">("pct")
  const [discValue, setDiscValue] = useState("")

  const labelOf = (i: InventoryItem) => `${i.name} — ${i.productCode || "kodsuz"} (stok ${i.quantity})`
  const existingMap = useMemo(() => new Map<string, InventoryItem>(inventory.map((i): [string, InventoryItem] => [labelOf(i), i])), [inventory])
  const existing = existingMap.get(existingLabel)
  const type = findProductType(typeLabel)

  // Yeni ürün adı: tür/marka/model/varyanttan otomatik
  useEffect(() => {
    if (mode === "new" && typeLabel) setName(buildProductName(type, brand, model, variant))
  }, [mode, typeLabel, brand, model, variant])

  // Mevcut ürün seçilince son alış fiyatı ve para birimi önerilir
  useEffect(() => {
    if (existing) {
      // Para birimi TL ile başlar; önceki alış dövizliyse fiyat boş kalır (dövizli fiyat TL gibi dolmasın)
      setCurrency("TRY")
      setUnitPrice(existing.purchaseCurrency === "TRY" && existing.purchasePrice ? String(existing.purchasePrice) : "")
    }
  }, [existingLabel])

  const price = Number(unitPrice) || 0
  // Satır iskontosu (yalnızca tedarikçiden alışta): yüzde = liste fiyatın %'si, ₺ = bu satırın toplamından düşülen tutar
  const netPrice = kind === "supplier" ? lineNetUnitPrice(price, Math.floor(Number(qty)) || 0, discType, Number(discValue) || 0) : price
  const hasDisc = kind === "supplier" && netPrice < price - 0.00001
  const auto = suggestedSalePrice(netPrice, currency, Number(margin) || 0, rates)

  const reset = () => {
    setExistingLabel(""); setVariant(""); setName(""); setQty("1"); setUnitPrice(""); setSalePrice(""); setImei(""); setCondition(""); setDiscValue("")
  }

  const add = () => {
    const quantity = Math.floor(Number(qty))
    if (!(quantity > 0)) return notify("Adet girin.", "error")
    if (!(price >= 0) || unitPrice === "") return notify("Birim alış fiyatını girin.", "error")
    if (currency !== "TRY" && isFallback) return notify("Güncel döviz kuru alınamadı; dövizli alış şu an kaydedilemez.", "error")
    const rate = rateFor(currency, rates)
    const cost = unitCostTRY(netPrice, currency, rates)
    const discInfo = hasDisc ? { listPrice: price, lineDiscount: { type: discType, value: Number(discValue) || 0 } } : {}
    if (mode === "existing") {
      if (!existing) return notify("Listeden mevcut bir ürün seçin ya da 'Yeni ürün'ü seçin.", "error")
      onAdd({
        isNew: false, inventoryId: existing.id, name: existing.name, category: existing.category, quantity, unitPrice: netPrice, currency, rate, ...discInfo,
        unitCostTRY: cost, salePrice: Number(salePrice) || 0, profitMargin: existing.profitMargin, minQuantity: existing.minQuantity, productCode: existing.productCode,
      })
    } else {
      if (!name.trim()) return notify("Ürün adını girin (veya tür/marka/model seçin).", "error")
      if (imei.trim() && quantity !== 1) return notify("IMEI girilen ürün 1 adet olmalı.", "error")
      onAdd({
        isNew: true, name: name.trim(), category: typeLabel || "Diğer", quantity, unitPrice: netPrice, currency, rate, ...discInfo, unitCostTRY: cost,
        salePrice: Number(salePrice) || auto, profitMargin: Number(margin) || 0, minQuantity: Number(minQty) || 0,
        imei: imei.trim() || undefined, conditionNote: condition.trim() || undefined,
      })
    }
    reset()
  }

  return (
    <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
      <div className="flex gap-2">
        {kind === "supplier" && (
          <button type="button" onClick={() => setMode("existing")} className={`flex-1 py-1.5 rounded-md border text-sm ${mode === "existing" ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>Mevcut ürüne stok ekle</button>
        )}
        <button type="button" onClick={() => setMode("new")} className={`flex-1 py-1.5 rounded-md border text-sm ${mode === "new" ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>Yeni ürün</button>
      </div>

      {mode === "existing" ? (
        <SearchPicker options={Array.from(existingMap.keys())} value={existingLabel} onChange={setExistingLabel} placeholder="Ürün ara (ad, kod)..." allowCustom={false} />
      ) : (
        <>
          <Select value={typeLabel} onValueChange={(v) => { setTypeLabel(v); setBrand(""); setModel("") }}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Ürün türü (kategori) seçin" /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {PRODUCT_TYPE_GROUPS.map((g) => (
                <SelectGroup key={g.name}>
                  <SelectLabel className="text-slate-500">{g.name}</SelectLabel>
                  {g.types.map((t) => <SelectItem key={t.label} value={t.label} className="text-white">{t.label}</SelectItem>)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {type?.modelBased && (
            <>
              <SearchPicker options={PHONE_BRANDS} value={brand} onChange={(v) => { setBrand(v); setModel("") }} placeholder="Marka (listeden seç veya yaz)" />
              <SearchPicker options={PHONE_CATALOG[brand] || []} value={model} onChange={setModel} placeholder={brand ? `${brand} modeli` : "Önce marka seçin"} disabled={!brand} />
            </>
          )}
          <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder={type?.modelBased ? "Varyant: renk, depolama, kalite..." : "Açıklama (ör. 20W Type-C)"} className="bg-slate-800 border-slate-600 text-white" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ürün adı *" className="bg-slate-800 border-slate-600 text-white" />
        </>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Input type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Adet" className="bg-slate-800 border-slate-600 text-white" />
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

      {kind === "supplier" && (
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            <Input type="number" inputMode="decimal" value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder="Bu üründe iskonto (ops.)" className="bg-slate-800 border-slate-600 text-white" />
            <div className="flex rounded-md overflow-hidden border border-slate-600 shrink-0">
              {(["pct", "amt"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setDiscType(t)} className={`px-3 py-2 text-sm ${discType === t ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}>{t === "pct" ? "%" : "₺"}</button>
              ))}
            </div>
          </div>
          {hasDisc && (
            <p className="text-xs text-emerald-400">Liste {price.toLocaleString("tr-TR")} {currency} → net {netPrice.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} {currency}/adet (−%{effectivePct(price * (Math.floor(Number(qty)) || 1), netPrice * (Math.floor(Number(qty)) || 1))}){discType === "amt" ? " • ₺ iskonto bu satırın TOPLAMINDAN düşülür" : ""}</p>
          )}
        </div>
      )}

      {mode === "new" ? (
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="Kâr %" className="bg-slate-800 border-slate-600 text-white" />
          <Input type="number" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder={`Satış: ${auto || "—"}`} className="bg-slate-800 border-slate-600 text-white" />
          <Input type="number" inputMode="numeric" value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="Min. stok" className="bg-slate-800 border-slate-600 text-white" />
        </div>
      ) : (
        existing && (
          <div className="grid grid-cols-2 gap-2 items-center">
            <Input type="number" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder={`Yeni satış fiyatı (boş = ${money(existing.salePrice)} kalsın)`} className="bg-slate-800 border-slate-600 text-white col-span-2" />
          </div>
        )
      )}

      {mode === "new" && type?.isPhone && (
        <div className="grid grid-cols-1 gap-2">
          <Input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="IMEI / Seri No (aynı IMEI iki kez stoğa girilemez)" className="bg-slate-800 border-slate-600 text-white" />
          <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Cihaz durumu (çizik, pil sağlığı, aksesuar...)" className="bg-slate-800 border-slate-600 text-white" />
        </div>
      )}
      <p className="text-xs text-slate-500">
        Satır toplamı: {money((Number(qty) || 0) * unitCostTRY(netPrice, currency, rates))}
        {currency !== "TRY" ? ` (kur: ${rateFor(currency, rates)})` : ""} • Eklenen ürün kayıttan sonra Envanter ve Satışlar'da görünür.
      </p>
      <Button type="button" onClick={add} variant="outline" className="w-full border-emerald-600 text-emerald-400"><Plus className="h-4 w-4 mr-1" />Listeye Ekle</Button>
    </div>
  )
}

export function NewPurchaseDialog({
  kind,
  open,
  onOpenChange,
  inventory,
  suppliers,
  customers,
  rates,
  isFallback,
  onCreated,
  onSupplierAdded,
  notify,
  initialPartyName,
}: {
  initialPartyName?: string
  kind: "supplier" | "customer"
  open: boolean
  onOpenChange: (o: boolean) => void
  inventory: InventoryItem[]
  suppliers: Supplier[]
  customers: PickerCustomer[]
  rates: { USD: number; EUR: number }
  isFallback: boolean
  onCreated: (purchase: Purchase, extra: { sellerIdNo: string }) => void
  onSupplierAdded: (s: Supplier) => void
  notify: (m: string, t: "success" | "error") => void
}) {
  const [partyName, setPartyName] = useState("")
  const [partyPhone, setPartyPhone] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [sellerIdNo, setSellerIdNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [date, setDate] = useState(localDateStr())
  const [note, setNote] = useState("")
  const [lines, setLines] = useState<PurchaseLine[]>([])
  const [payMode, setPayMode] = useState<"paid" | "partial" | "unpaid">("paid")
  const [paidInput, setPaidInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [quickSupplier, setQuickSupplier] = useState(false)
  const [qsName, setQsName] = useState("")
  const [qsPhone, setQsPhone] = useState("")
  const [genType, setGenType] = useState<"pct" | "amt">("pct")
  const [genValue, setGenValue] = useState("")
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [pasteCurrency, setPasteCurrency] = useState<Currency>("TRY")
  const [pasteCategory, setPasteCategory] = useState("Diğer")

  useEffect(() => {
    if (open) {
      setGenValue(""); setGenType("pct"); setPasteOpen(false); setPasteText(""); setPasteCurrency("TRY"); setPasteCategory("Diğer")
      setPartyName(initialPartyName || ""); setPartyPhone(initialPartyName ? (suppliers.find((s) => s.name === initialPartyName)?.phone || "") : ""); setCustomerId(""); setSellerIdNo(""); setInvoiceNo(""); setDate(localDateStr()); setNote("")
      setLines([]); setPayMode("paid"); setPaidInput(""); setQuickSupplier(false)
    }
  }, [open, kind])

  // Genel iskonto (alışın tamamına, yalnızca tedarikçiden alışta): satırların net fiyatlarına orantılı dağıtılır,
  // böylece stok maliyeti de iskontolu net fiyattan oluşur.
  const subtotal = purchaseTotal(lines)
  const genDisc = kind === "supplier" ? discountAmount(genType, Number(genValue) || 0, subtotal) : 0
  const finalLines = useMemo<PurchaseLine[]>(() => {
    if (!(genDisc > 0)) return lines
    const f = generalFactor(subtotal, genDisc)
    const r4 = (n: number) => Math.round(n * 10000) / 10000
    return lines.map((l) => ({ ...l, listPrice: l.listPrice ?? l.unitPrice, unitPrice: r4(l.unitPrice * f), unitCostTRY: r4(l.unitCostTRY * f) }))
  }, [lines, genDisc, subtotal])
  const total = purchaseTotal(finalLines)
  const paid = kind === "customer" ? total : payMode === "paid" ? total : payMode === "unpaid" ? 0 : Math.min(total, Number(paidInput) || 0)
  const status = paymentStatusOf(total, paid)

  const addQuickSupplier = async () => {
    const name = qsName.trim()
    if (!name) return notify("Tedarikçi adını girin.", "error")
    if (suppliers.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) return notify("Bu isimde bir tedarikçi zaten var; listeden seçin.", "error")
    try {
      const created = await createSupplier({ name, contactPerson: "", phone: qsPhone.trim(), email: "", address: "", category: "Diğer", rating: 5, status: "active", totalOrders: 0, lastOrderDate: localDateStr(), balance: 0 })
      onSupplierAdded(created)
      setPartyName(created.name)
      setPartyPhone(created.phone)
      setQuickSupplier(false); setQsName(""); setQsPhone("")
      notify("Tedarikçi eklendi.", "success")
    } catch (e) {
      console.error(e)
      notify("Tedarikçi eklenemedi.", "error")
    }
  }

  // Yapıştırılan listeyi satırlara çevirir: aynı adlı ürün varsa stok eklenir, yoksa yeni ürün açılır
  const addPasted = () => {
    const rows = parsePurchaseList(pasteText)
    if (rows.length === 0) return notify("Önce listeyi yapıştırın.", "error")
    if (pasteCurrency !== "TRY" && isFallback) return notify("Güncel döviz kuru alınamadı; dövizli alış şu an kaydedilemez.", "error")
    const byName = new Map(inventory.map((i): [string, InventoryItem] => [normKey(i.name), i]))
    const ok: PurchaseLine[] = []
    const bad: { text: string; error: string }[] = []
    const rawLines = pasteText.split(/\r?\n/)
    rows.forEach((r) => {
      if (r.error) { bad.push({ text: rawLines[r.lineNo - 1], error: `Satır ${r.lineNo}: ${r.error}` }); return }
      ok.push(makePurchaseLine(r, { inventory, currency: pasteCurrency, category: pasteCategory, rates, defaultMinQuantity: kind === "supplier" ? getDefaultMinStock() : 0 }, byName))
    })
    if (ok.length > 0) setLines((prev) => [...prev, ...ok])
    setPasteText(bad.map((b) => b.text).join("\n"))
    const existingCount = ok.filter((l) => !l.isNew).length
    if (ok.length > 0) notify(`${ok.length} satır eklendi (${existingCount} mevcut ürüne stok, ${ok.length - existingCount} yeni ürün).${bad.length ? ` ${bad.length} satır okunamadı: ${bad.map((b) => b.error).join(" • ")}` : ""}`, bad.length ? "error" : "success")
    else notify(bad.map((b) => b.error).join(" • ") || "Eklenecek satır yok.", "error")
    if (ok.length > 0 && bad.length === 0) setPasteOpen(false)
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const { purchase, warnings } = await createPurchase({ kind, partyName, partyPhone, invoiceNo, date, lines: finalLines, paid, note: `${note}${genDisc > 0 ? `${note ? " | " : ""}Genel iskonto ${money(genDisc)}` : ""}` })
      warnings.forEach((w) => notify(w, "error"))
      notify(`Alış kaydedildi (${purchase.code}). Ürünler envantere eklendi, Satışlar'da satılabilir.`, "success")
      onCreated(purchase, { sellerIdNo })
      onOpenChange(false)
    } catch (e: any) {
      console.error(e)
      notify(e?.message || "Alış kaydedilemedi.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-white max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{kind === "supplier" ? "🚚 Tedarikçiden Alış" : "📱 Müşteriden Alış (İkinci El)"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {kind === "supplier" ? (
            <div className="space-y-2">
              <Label className="text-slate-300">Tedarikçi *</Label>
              <Select value={partyName} onValueChange={(v) => { setPartyName(v); setPartyPhone(suppliers.find((s) => s.name === v)?.phone || "") }}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Tedarikçi seçin" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickSupplier((v) => !v)} className="border-slate-600 text-slate-300">
                <UserPlus className="h-3 w-3 mr-1" />{quickSupplier ? "İptal" : "➕ Yeni Tedarikçi"}
              </Button>
              {quickSupplier && (
                <div className="space-y-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <Input placeholder="Tedarikçi / Toptancı adı *" value={qsName} onChange={(e) => setQsName(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <PhoneInput placeholder="Telefon (opsiyonel)" value={qsPhone} onChange={(e) => setQsPhone(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Button type="button" size="sm" onClick={addQuickSupplier} className="bg-emerald-600 hover:bg-emerald-700">✅ Ekle</Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Fatura / İrsaliye no (ops.)" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-slate-300">Satıcı (cihazı bize satan) *</Label>
              <CustomerPicker
                customers={customers}
                value={customerId}
                onChange={(id, c) => { setCustomerId(id); setPartyName(c.name); setPartyPhone(c.phone || c.phone1 || "") }}
                placeholder="Kayıtlı müşteriden seç (veya aşağıya elle yaz)..."
              />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Ad Soyad *" value={partyName} onChange={(e) => { setPartyName(e.target.value); setCustomerId("") }} className="bg-slate-800 border-slate-600 text-white" />
                <PhoneInput placeholder="Telefon" value={partyPhone} onChange={(e) => setPartyPhone(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <Input placeholder="T.C. Kimlik No (belgeye basılır, kaydedilmez)" value={sellerIdNo} onChange={(e) => setSellerIdNo(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
            </div>
          )}

          <LineEditor kind={kind} inventory={inventory} rates={rates} isFallback={isFallback} onAdd={(l) => setLines((prev) => [...prev, l])} notify={notify} />
          {kind === "supplier" && (
            <div className="space-y-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen((v) => !v)} className="border-slate-600 text-slate-300">📋 {pasteOpen ? "Listeyi gizle" : "Çok ürün: listeyi yapıştır"}</Button>
              {pasteOpen && (
                <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                  <p className="text-xs text-slate-400">Her satıra bir ürün: <b>ürün adı; adet; birim fiyat; iskonto %</b> (iskonto isteğe bağlı). Notlar ya da Excel'den kopyalayıp yapıştırabilirsiniz. Envanterde aynı adlı ürün varsa stoğuna eklenir, yoksa yeni ürün açılır.</p>
                  <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder={"Ekran Koruyucu A24; 10; 45,50; 5\nKılıf iPhone 13; 3; 120"} className="w-full rounded-md bg-slate-900 border border-slate-600 text-white text-sm p-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={pasteCurrency} onValueChange={(v) => setPasteCurrency(v as Currency)}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="TRY" className="text-white">₺ TL</SelectItem>
                        <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                        <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pasteCategory} onValueChange={setPasteCategory}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Yeni ürün kategorisi" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                        {PRODUCT_TYPE_GROUPS.flatMap((g) => g.types).map((t) => <SelectItem key={t.label} value={t.label} className="text-white">{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={addPasted} className="w-full bg-emerald-600 hover:bg-emerald-700">Satırları Listeye Ekle</Button>
                </div>
              )}
            </div>
          )}


          {lines.length > 0 && (
            <div className="space-y-1">
              <Label className="text-slate-300">Alınan ürünler ({lines.length})</Label>
              {lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">
                  <div className="min-w-0">
                    <div className="text-white truncate">{l.name}{l.isNew ? <span className="ml-1 text-[10px] text-emerald-400">YENİ</span> : <span className="ml-1 text-[10px] text-sky-400">STOK+</span>}</div>
                    <div className="text-xs text-slate-400">{l.quantity} adet × {l.unitPrice.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} {l.currency}{l.listPrice && l.listPrice > l.unitPrice + 0.00001 ? ` (liste ${l.listPrice.toLocaleString("tr-TR")})` : ""}{l.imei ? ` • IMEI ${l.imei}` : ""}{l.salePrice > 0 ? ` • satış ${money(l.salePrice)}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-amber-300">{money(l.quantity * l.unitCostTRY)}</span>
                    <Button type="button" size="icon" variant="outline" className="h-7 w-7 border-red-700 text-red-400" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
            {kind === "supplier" && lines.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-2 items-center">
                  <Input type="number" inputMode="decimal" value={genValue} onChange={(e) => setGenValue(e.target.value)} placeholder="Genel iskonto (alışın tamamına, ops.)" className="bg-slate-900 border-slate-600 text-white" />
                  <div className="flex rounded-md overflow-hidden border border-slate-600 shrink-0">
                    {(["pct", "amt"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setGenType(t)} className={`px-3 py-2 text-sm ${genType === t ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}>{t === "pct" ? "%" : "₺"}</button>
                    ))}
                  </div>
                </div>
                {genDisc > 0 && <div className="flex justify-between text-xs"><span className="text-slate-400">Ara toplam {money(subtotal)}</span><span className="text-emerald-400">Genel iskonto −{money(genDisc)}</span></div>}
              </div>
            )}
            <div className="flex justify-between text-sm"><span className="text-slate-400">Toplam (TL)</span><span className="text-white font-bold">{money(total)}</span></div>
            {kind === "supplier" ? (
              <>
                <div className="flex gap-2">
                  {([["paid", "✅ Ödendi"], ["partial", "◐ Kısmi"], ["unpaid", "⏳ Ödenmedi (borç)"]] as const).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => setPayMode(k)} className={`flex-1 py-1.5 rounded-md border text-xs ${payMode === k ? "border-emerald-600 bg-emerald-600/20 text-emerald-300" : "border-slate-600 text-slate-400"}`}>{label}</button>
                  ))}
                </div>
                {payMode === "partial" && <Input type="number" inputMode="decimal" value={paidInput} onChange={(e) => setPaidInput(e.target.value)} placeholder="Şimdi ödenen tutar (TL)" className="bg-slate-900 border-slate-600 text-white" />}
                <p className="text-xs text-slate-500">
                  Ödenen: {money(paid)}{total - paid > 0.009 ? ` • Kalan borç: ${money(total - paid)} (Tedarikçiler sayfasında borç olarak görünür)` : ""}. Ödenen tutar kasaya gider olarak yazılır.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">Cihaz bedeli ({money(total)}) peşin ödenir ve kasaya gider olarak yazılır. Kaydedince alım belgesi yazdırılır.</p>
            )}
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not (opsiyonel)" className="bg-slate-900 border-slate-600 text-white" />
          </div>

          <Button onClick={save} disabled={saving || lines.length === 0 || !partyName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {saving ? "Kaydediliyor..." : kind === "supplier" ? "Alışı Kaydet (envantere ekle)" : "Kaydet ve Belgeyi Yazdır"}
          </Button>
          <p className="text-xs text-slate-500 text-center">Durum: {status === "paid" ? "ödenmiş" : status === "partial" ? "kısmi ödenmiş" : "ödenmemiş"}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

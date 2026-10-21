"use client"

import { StatListDialog, StatRow } from "@/components/StatListDialog"
import { openWhatsApp } from "@/lib/whatsapp"
import { localDateStr } from "@/lib/dates"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { InventoryItem, fetchInventory, findActiveImeiConflict, createInventoryItem, createInventoryItemsBulk, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity } from "@/lib/inventory"
import { createTransaction } from "@/lib/finance"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Plus, Package, Search, AlertTriangle, Barcode, Minus, Plus as PlusIcon, Pencil, Trash2, Save, TrendingUp, DollarSign, Upload, UserPlus, MessageCircle, Download, ClipboardList, RefreshCw, History as HistoryIcon, Copy, Smartphone } from "lucide-react"
import { ExcelImportDialog, ImportField } from "@/components/ExcelImportDialog"
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog"
import { ImageUploadField } from "@/components/ImageUploadField"
import { fetchSuppliers, createSupplier, Supplier } from "@/lib/suppliers"
import { exportToExcel } from "@/lib/exportExcel"
import { createDevicePurchase, printPurchaseDocument } from "@/lib/devicePurchases"
import { StockMoveDialog } from "@/components/inventory/StockMoveDialog"
import { recordStockPurchase, fetchPurchases, Purchase, findPurchaseLinesAtPrice, correctPurchasePrices } from "@/lib/purchases"
import { diffFields } from "@/lib/diff"
import { logChange } from "@/lib/activityLog"
import { Pagination } from "@/components/Pagination"
import { StockMovement, fetchStockMovements, logStockMovement } from "@/lib/stockMovements"
import { printBarcodeLabels } from "@/lib/barcodeLabel"
import { SearchPicker } from "@/components/SearchPicker"
import { PRODUCT_TYPE_GROUPS, PHONE_CATALOG, PHONE_BRANDS, findProductType, extraCategories, buildProductName } from "@/lib/productCatalog"

const INVENTORY_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Ürün Adı", required: true, type: "text" },
  { key: "sku", label: "SKU", type: "text" },
  { key: "category", label: "Kategori", type: "text", defaultValue: "Diğer" },
  { key: "quantity", label: "Stok", type: "number" },
  { key: "minQuantity", label: "Min. Stok", type: "number", defaultValue: 5 },
  { key: "purchasePrice", label: "Alış Fiyatı", required: true, type: "number" },
  { key: "purchaseCurrency", label: "Para Birimi", type: "text", defaultValue: "TRY" },
  { key: "profitMargin", label: "Kâr Marjı (%)", type: "number", defaultValue: 30 },
  { key: "supplier", label: "Tedarikçi", type: "text" },
  { key: "location", label: "Konum", type: "text" },
]
import { useExchangeRates } from "@/hooks/useExchangeRates"

interface ExchangeRates {
  USD: number
  EUR: number
  lastUpdated: string
}

function calculateSalePrice(purchasePrice: number, purchaseCurrency: "TRY" | "USD" | "EUR", profitMargin: number, rates: ExchangeRates): number {
  let priceInTRY = purchasePrice
  if (purchaseCurrency === "USD") {
    priceInTRY = purchasePrice * rates.USD
  } else if (purchaseCurrency === "EUR") {
    priceInTRY = purchasePrice * rates.EUR
  }
  const salePrice = priceInTRY * (1 + profitMargin / 100)
  return Math.round(salePrice)
}

export default function InventoryPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Envanter")
  const isManager = useIsManager()

  const [statKey, setStatKey] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSupplierBarcodeScannerOpen, setIsSupplierBarcodeScannerOpen] = useState(false)
  const [isNewSupplierBarcodeScannerOpen, setIsNewSupplierBarcodeScannerOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([])
  const [listPage, setListPage] = useState(1)
  const PAGE_SIZE = 20
  const [orderOpen, setOrderOpen] = useState(false)
  const [stockMove, setStockMove] = useState<{ item: InventoryItem; mode: "in" | "out" } | null>(null)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({ sellerName: "", sellerPhone: "", sellerIdNo: "", deviceName: "", imei: "", conditionNote: "", price: "", salePrice: "", addToStock: true })
  const [countOpen, setCountOpen] = useState(false)
  const [countScanOpen, setCountScanOpen] = useState(false)
  const [countInput, setCountInput] = useState("")
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [quickSupplierFor, setQuickSupplierFor] = useState<"new" | "edit" | null>(null)
  const [quickSupplierName, setQuickSupplierName] = useState("")
  const [quickSupplierPhone, setQuickSupplierPhone] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [customCategory, setCustomCategory] = useState("")
  // Hızlı ürün seçimi: Tür -> Marka -> Model -> Varyant (ürün adı ve kategori otomatik oluşur)
  const [qpType, setQpType] = useState("")
  const [qpBrand, setQpBrand] = useState("")
  const [qpModel, setQpModel] = useState("")
  const [qpVariant, setQpVariant] = useState("")
  const [editCustomCategory, setEditCustomCategory] = useState("")
  const { rates, isFallback } = useExchangeRates()
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: "Telefon (Sıfır)",
    quantity: 0,
    minQuantity: 5,
    purchasePrice: 0,
    purchaseCurrency: "TRY",
    profitMargin: 30,
    salePrice: 0,
    paymentStatus: "unpaid",
    paidAmount: 0,
  })
  useEffect(() => {
    if (!qpType) return
    const type = findProductType(qpType)
    const name = buildProductName(type, qpBrand, qpModel, qpVariant)
    setNewItem((prev) => ({ ...prev, name, category: qpType }))
  }, [qpType, qpBrand, qpModel, qpVariant])

  useEffect(() => {
    let cancelled = false
    fetchInventory()
      .then((data) => {
        if (!cancelled) setInventory(data)
      })
      .catch((e) => {
        console.error("Load error:", e)
        if (!cancelled) showToast("Envanter yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    fetchPurchases().then((p) => setSupplierPurchases(p.filter((x) => x.kind === "supplier"))).catch((e) => console.error("Alışlar yüklenemedi:", e))
    fetchSuppliers()
      .then((data) => { if (!cancelled) setSuppliers(data) })
      .catch((e) => console.error("Tedarikçiler yüklenemedi:", e))
    return () => { cancelled = true }
  }, [])

  // Karekod / arama ile gelindiğinde (?open=ID) ürünü listede göster
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    const openId = new URLSearchParams(window.location.search).get("open")
    if (!openId) return
    const found = inventory.find(i => i.id === openId)
    if (found) setSearchTerm(found.productCode || found.name)
    window.history.replaceState(null, "", window.location.pathname)
  }, [isLoaded])

  useEffect(() => { setListPage(1) }, [searchTerm, filterCategory])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetki kontrol ediliyor...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetkisiz erişim. Yönlendiriliyor...</div>
      </div>
    )
  }



  // Load from localStorage

  // Save to localStorage


  // Kur bilgisi artık merkezi useExchangeRates() hook'undan geliyor (yukarıda).

  const categories = Array.from(new Set(inventory.map(i => i.category)))

  const inventoryWithPrices = inventory.map(item => ({
    ...item,
    salePrice: item.salePrice > 0 ? item.salePrice : calculateSalePrice(item.purchasePrice, item.purchaseCurrency, item.profitMargin, rates),
  }))

  const filteredItems = inventoryWithPrices.filter((item) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(search) ||
      (item.productCode || "").toLowerCase().includes(search) ||
      (item.supplierBarcode || "").toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search)
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Min. stok 0 = uyarı yok (ör. ikinci el cihazlar); 0 stoğa düşmek kritik sayılmaz
  const lowStockItems = inventoryWithPrices.filter(item => item.minQuantity > 0 && item.quantity <= item.minQuantity)
  const totalPurchaseValue = inventoryWithPrices.reduce((sum, item) => {
    let priceInTRY = item.purchasePrice
    if (item.purchaseCurrency === "USD") priceInTRY = item.purchasePrice * rates.USD
    else if (item.purchaseCurrency === "EUR") priceInTRY = item.purchasePrice * rates.EUR
    return sum + (priceInTRY * item.quantity)
  }, 0)
  const totalSaleValue = inventoryWithPrices.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
  const totalProfit = totalSaleValue - totalPurchaseValue

  const updateQuantity = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id)
    if (!item) return
    const newQuantity = Math.max(0, item.quantity + delta)
    if (newQuantity === item.quantity) return
    const previous = inventory
    setInventory(inventory.map(i => i.id === id ? { ...i, quantity: newQuantity } : i))
    try {
      // Stok atomik değiştirilir (aynı anda satış yapılıyorsa ezilmez)
      await adjustInventoryQuantity(id, newQuantity - item.quantity, newQuantity > item.quantity ? "Elle artış (+)" : "Elle azalış (-)", item.name)
      // Elle stok değişimi "alış düzeltmesi" sayılır; tedarikçi borcu alınan toplam adetten hesaplanır:
      //  • artış  -> alınan adet artar (borç artar)
      //  • azalış -> alınan adet de aynı kadar azalır (yanlış girilen alış geri alınır, borç düşer)
      // (Satışlar stoğu otomatik düşürür ve borcu ETKİLEMEZ; bu düzeltme sadece envanterdeki +/- ile yapılır.)
      const diff = newQuantity - item.quantity
      const purchased = Math.max(0, (item.purchasedQuantity ?? item.quantity) + diff)
      await updateInventoryItem(id, { purchasedQuantity: purchased })
      setInventory(prev => prev.map(i => i.id === id ? { ...i, purchasedQuantity: purchased } : i))
      if (diff < 0 && item.supplier && item.paymentStatus !== "paid") {
        showToast(`Stok azaltıldı; ${item.supplier} borcundan da ${-diff} adet düşüldü (alış düzeltmesi).`, "success")
      }
    } catch (e) {
      console.error(e)
      setInventory(previous)
      showToast("Stok güncellenirken bir sorun oluştu.", "error")
    }
  }

  // Yeni tedarikçiyi ürün formundan çıkmadan ekler (sadece ad yeterli).
  const handleQuickSupplier = async () => {
    const name = quickSupplierName.trim()
    if (!name) {
      showToast("Tedarikçi adı girin.", "error")
      return
    }
    if (suppliers.some(s => s.name.trim().toLowerCase() === name.toLowerCase())) {
      showToast("Bu isimde bir tedarikçi zaten var, listeden seçin.", "error")
      return
    }
    try {
      const created = await createSupplier({
        name,
        contactPerson: "",
        phone: quickSupplierPhone.trim(),
        email: "",
        address: "",
        category: "Diğer",
        rating: 5,
        status: "active",
        totalOrders: 0,
        lastOrderDate: localDateStr(),
        balance: 0,
      })
      setSuppliers([created, ...suppliers])
      if (quickSupplierFor === "edit" && editingItem) setEditingItem({ ...editingItem, supplier: created.name })
      else setNewItem({ ...newItem, supplier: created.name })
      setQuickSupplierFor(null)
      setQuickSupplierName("")
      setQuickSupplierPhone("")
      showToast("Tedarikçi eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Tedarikçi eklenirken bir sorun oluştu.", "error")
    }
  }

  const renderQuickSupplier = (target: "new" | "edit") => (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setQuickSupplierFor(quickSupplierFor === target ? null : target)}
        className="border-slate-600 text-slate-300 hover:bg-slate-800"
      >
        <UserPlus className="w-3 h-3 mr-1" />{quickSupplierFor === target ? "❌ İptal" : "➕ Yeni Tedarikçi"}
      </Button>
      {quickSupplierFor === target && (
        <div className="space-y-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <Input placeholder="Tedarikçi / Toptancı Adı *" value={quickSupplierName} onChange={(e) => setQuickSupplierName(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
          <Input placeholder="Telefon (opsiyonel)" value={quickSupplierPhone} onChange={(e) => setQuickSupplierPhone(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
          <Button type="button" size="sm" onClick={handleQuickSupplier} className="bg-emerald-600 hover:bg-emerald-700">✅ Ekle</Button>
        </div>
      )}
    </div>
  )

  // Kritik stoktaki ürün için tedarikçiye hazır sipariş mesajı açar.
  const orderViaWhatsApp = (item: InventoryItem) => {
    const supplier = suppliers.find(s => s.name === item.supplier)
    const phone = (supplier?.phone || "").replace(/\D/g, "").replace(/^0/, "").replace(/^90/, "")
    if (phone.length < 10) {
      showToast("Bu tedarikçinin telefon numarası kayıtlı değil.", "error")
      return
    }
    const lines = [
      `Merhaba ${supplier?.contactPerson || supplier?.name},`,
      "",
      "*Yeşiltaş Teknoloji*'den yazıyoruz.",
      "",
      `📦 *Ürün:* ${item.name}`,
      item.category ? `🏷️ *Tür/Kategori:* ${item.category}` : "",
      item.productCode ? `🔖 *Ürün kodumuz:* ${item.productCode}` : "",
      item.supplierBarcode ? `🔢 *Sizdeki kod/barkod:* ${item.supplierBarcode}` : "",
      `📉 *Mevcut stoğumuz:* ${item.quantity} adet (en az ${item.minQuantity} olmalı)`,
      `🛒 *İstenen miktar:* yaklaşık ${Math.max(1, (item.minQuantity || 0) * 2 - item.quantity)} adet`,
      "",
      "Lütfen şunları bildirir misiniz?",
      "1️⃣ Bu ürün elinizde var mı?",
      "2️⃣ Birim fiyatı nedir?",
    ].filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i !== arr.length - 1))
    const message = lines.join("\n")
    openWhatsApp("90" + phone, message)
  }

  const handleDevicePurchase = async () => {
    const price = Number(purchaseForm.price) || 0
    if (!purchaseForm.sellerName.trim() || !purchaseForm.deviceName.trim() || price <= 0) {
      showToast("Satıcı adı, cihaz adı ve ödenen tutar zorunludur.", "error")
      return
    }
    try {
      const { purchase, item } = await createDevicePurchase({
        sellerName: purchaseForm.sellerName.trim(),
        sellerPhone: purchaseForm.sellerPhone.trim(),
        sellerIdNo: purchaseForm.sellerIdNo.trim(),
        deviceName: purchaseForm.deviceName.trim(),
        imei: purchaseForm.imei.trim(),
        conditionNote: purchaseForm.conditionNote.trim(),
        price,
        addToStock: purchaseForm.addToStock,
        salePrice: Number(purchaseForm.salePrice) || undefined,
      })
      if (item) setInventory([item, ...inventory])
      setPurchaseOpen(false)
      setPurchaseForm({ sellerName: "", sellerPhone: "", sellerIdNo: "", deviceName: "", imei: "", conditionNote: "", price: "", salePrice: "", addToStock: true })
      showToast("Cihaz alımı kaydedildi, kasaya gider yazıldı.", "success")
      printPurchaseDocument(purchase)
    } catch (e) {
      console.error(e)
      showToast("Cihaz alımı kaydedilemedi (v5 SQL çalıştırıldı mı?).", "error")
    }
  }

  const exportInventory = () => {
    exportToExcel("envanter", "Envanter", inventoryWithPrices.map(i => ({
      "Ürün Kodu": i.productCode,
      "Ürün Adı": i.name,
      "Kategori": i.category,
      "Stok": i.quantity,
      "Min. Stok": i.minQuantity,
      "Alış Fiyatı": i.purchasePrice,
      "Para Birimi": i.purchaseCurrency,
      "Kâr Marjı (%)": i.profitMargin,
      "Satış Fiyatı (TL)": i.salePrice,
      "Tedarikçi": i.supplier,
      "Satıcı Barkodu": i.supplierBarcode || "",
      "Konum": i.location,
    })))
  }

  // Dolar/euro ile alınan ürünlerin satış fiyatını güncel kura göre yeniden hesaplar
  const refreshPricesByRate = async () => {
    if (isFallback) {
      showToast("Güncel döviz kuru alınamadı; fiyatlar güncellenemez.", "error")
      return
    }
    const targets = inventory.filter(i => i.purchaseCurrency !== "TRY" && i.purchasePrice > 0)
    if (targets.length === 0) {
      showToast("Dövizle alınmış ürün yok.", "error")
      return
    }
    if (!confirm(`${targets.length} dövizli ürünün satış fiyatı güncel kura göre (USD ${rates.USD}, EUR ${rates.EUR}) yeniden hesaplanacak.\n\nDevam edilsin mi?`)) return
    let changed = 0
    const updatedList = [...inventory]
    for (const item of targets) {
      const newPrice = calculateSalePrice(item.purchasePrice, item.purchaseCurrency, item.profitMargin, rates)
      if (newPrice === item.salePrice) continue
      try {
        await updateInventoryItem(item.id, { salePrice: newPrice })
        const idx = updatedList.findIndex(i => i.id === item.id)
        if (idx >= 0) updatedList[idx] = { ...updatedList[idx], salePrice: newPrice }
        changed++
      } catch (e) {
        console.error(e)
      }
    }
    setInventory(updatedList)
    showToast(changed > 0 ? `${changed} ürünün fiyatı güncellendi.` : "Fiyatlar zaten güncel.", "success")
  }

  // Kritik stoktaki ürünleri tedarikçiye göre gruplar (sipariş listesi)
  const orderGroups = () => {
    const low = inventory.filter(i => i.minQuantity > 0 && i.quantity <= i.minQuantity)
    const map = new Map<string, InventoryItem[]>()
    low.forEach(i => {
      const key = i.supplier || "Tedarikçi seçilmemiş"
      map.set(key, [...(map.get(key) || []), i])
    })
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      supplier: suppliers.find(s => s.name === name),
      items: items.map(i => ({ item: i, suggest: Math.max(1, (i.minQuantity || 0) * 2 - i.quantity) })),
    }))
  }

  const orderText = (group: ReturnType<typeof orderGroups>[number]) =>
    `Merhaba ${group.supplier?.contactPerson || group.name},\n\n*Yeşiltaş Teknoloji*'den sipariş listemiz:\n\n` +
    group.items.map(g => `📦 ${g.item.name} (${g.item.category}${g.item.productCode ? `, kod: ${g.item.productCode}` : ""}${g.item.supplierBarcode ? `, sizdeki kod: ${g.item.supplierBarcode}` : ""}) — ${g.suggest} adet`).join("\n") +
    `\n\nLütfen şunları bildirir misiniz?\n1️⃣ Bu ürünler elinizde var mı?\n2️⃣ Birim fiyatları nedir?`

  const sendOrderWhatsApp = (group: ReturnType<typeof orderGroups>[number]) => {
    const phone = (group.supplier?.phone || "").replace(/\D/g, "").replace(/^0/, "").replace(/^90/, "")
    if (phone.length < 10) {
      showToast("Bu tedarikçinin telefon numarası kayıtlı değil.", "error")
      return
    }
    openWhatsApp("90" + phone, orderText(group))
  }

  const copyOrder = async (group: ReturnType<typeof orderGroups>[number]) => {
    try {
      await navigator.clipboard.writeText(orderText(group))
      showToast("Sipariş metni kopyalandı.", "success")
    } catch {
      showToast("Kopyalanamadı.", "error")
    }
  }

  // Stok sayımı: kod okutulur / yazılır, her okutuş sayımı 1 artırır
  const addCount = (raw: string) => {
    const code = raw.trim()
    if (!code) return
    const lower = code.toLowerCase()
    const found = inventory.find(i =>
      (i.productCode || "").toLowerCase() === lower ||
      (i.supplierBarcode || "").toLowerCase() === lower ||
      (i.sku || "").toLowerCase() === lower
    )
    if (!found) {
      showToast(`"${code}" için ürün bulunamadı.`, "error")
      return
    }
    setCounts(prev => ({ ...prev, [found.id]: (prev[found.id] || 0) + 1 }))
    setCountInput("")
  }

  const applyCounts = async () => {
    const diffs = (Object.entries(counts) as [string, number][])
      .map(([id, counted]) => ({ item: inventory.find(i => i.id === id), counted }))
      .filter(x => x.item && x.counted !== x.item.quantity) as { item: InventoryItem; counted: number }[]
    if (diffs.length === 0) {
      showToast("Fark yok, değişiklik yapılmadı.", "success")
      return
    }
    if (!confirm(`${diffs.length} ürünün stoğu sayım sonucuna göre düzeltilecek. Devam edilsin mi?`)) return
    try {
      for (const d of diffs) {
        await adjustInventoryQuantity(d.item.id, d.counted - d.item.quantity, "Sayım düzeltmesi", d.item.name)
      }
      const updated = await fetchInventory()
      setInventory(updated)
      setCounts({})
      setCountOpen(false)
      showToast("Sayım sonucu uygulandı.", "success")
    } catch (e) {
      console.error(e)
      showToast("Sayım uygulanırken bir sorun oluştu.", "error")
    }
  }

  const openHistory = async (item: InventoryItem) => {
    setHistoryItem(item)
    setMovements([])
    setMovementsLoading(true)
    try {
      setMovements(await fetchStockMovements(item.id))
    } catch (e) {
      console.error(e)
      showToast("Hareket geçmişi yüklenemedi (v4 SQL çalıştırıldı mı?).", "error")
    } finally {
      setMovementsLoading(false)
    }
  }

  const handleExcelImport = async (rows: Record<string, any>[]) => {
    const validCurrency = (c: any): "TRY" | "USD" | "EUR" => ["TRY", "USD", "EUR"].includes(String(c).toUpperCase()) ? String(c).toUpperCase() as any : "TRY"
    const inputs = rows.map(r => {
      const purchasePrice = Number(r.purchasePrice) || 0
      const purchaseCurrency = validCurrency(r.purchaseCurrency)
      const profitMargin = Number(r.profitMargin) || 30
      const salePrice = calculateSalePrice(purchasePrice, purchaseCurrency, profitMargin, rates)
      return {
        name: String(r.name || "").trim(),
        sku: String(r.sku || ""),
        category: String(r.category || "Diğer"),
        quantity: Number(r.quantity) || 0,
        minQuantity: r.minQuantity === undefined || r.minQuantity === null || r.minQuantity === "" ? 5 : (Number(r.minQuantity) || 0),
        purchasePrice,
        purchaseCurrency,
        profitMargin,
        salePrice,
        supplier: String(r.supplier || ""),
        location: String(r.location || ""),
        paymentStatus: "unpaid" as const,
        paidAmount: 0,
      }
    }).filter(r => r.name)
    const created = await createInventoryItemsBulk(inputs)
    setInventory([...created, ...inventory])
  }

  const handleAddItem = async () => {
    if (isFallback && (newItem.purchaseCurrency === "USD" || newItem.purchaseCurrency === "EUR")) {
      showToast("Güncel döviz kuru alınamadı; dövizli ürün şu an kaydedilemez. Bağlantıyı kontrol edip tekrar deneyin.", "error")
      return
    }
    if (!newItem.name) {
      showToast("Lütfen ürün adını girin!", "error")
      return
    }
    if (newItem.imei && (Number(newItem.quantity) || 0) > 0) {
      const conflict = await findActiveImeiConflict(newItem.imei)
      if (conflict) {
        showToast(`Bu IMEI zaten stokta kayıtlı: ${conflict.name}${conflict.productCode ? ` (${conflict.productCode})` : ""}.`, "error")
        return
      }
    }
    const salePrice = calculateSalePrice(
      Number(newItem.purchasePrice) || 0,
      newItem.purchaseCurrency || "TRY",
      Number(newItem.profitMargin) || 0,
      rates
    )
    try {
      const item = await createInventoryItem({
        name: newItem.name,
        sku: "",
        category: newItem.category === "__new__" ? (customCategory.trim() || "Diğer") : (newItem.category || "Diğer"),
        quantity: Number(newItem.quantity) || 0,
        minQuantity: newItem.minQuantity === undefined || newItem.minQuantity === null ? 5 : (Number(newItem.minQuantity) || 0),
        purchasePrice: Number(newItem.purchasePrice) || 0,
        purchaseCurrency: newItem.purchaseCurrency || "TRY",
        profitMargin: Number(newItem.profitMargin) || 0,
        salePrice: salePrice,
        supplier: newItem.supplier || "",
        location: newItem.location || "",
        imageUrl: newItem.imageUrl || "",
        supplierBarcode: newItem.supplierBarcode || "",
        imei: newItem.imei || "",
        paymentStatus: newItem.paymentStatus || "unpaid",
        paidAmount: newItem.paymentStatus === "partial" ? (Number(newItem.paidAmount) || 0) : 0,
      })
      setInventory([item, ...inventory])
      if (item.quantity > 0) logStockMovement(item.id, item.name, item.quantity, "Yeni ürün — ilk stok")
      // Tedarikçili ürün: alış "Alışlar"a kaydedilir (borç/ödeme oradan izlenir). Başarısız olursa eski yönteme düşülür.
      let recorded = false
      if (item.supplier && item.quantity > 0) {
        try {
          const rateNow = item.purchaseCurrency === "USD" ? rates.USD : item.purchaseCurrency === "EUR" ? rates.EUR : 1
          const totalNow = item.purchasePrice * rateNow * item.quantity
          const paidNow = item.paymentStatus === "paid" ? totalNow : item.paymentStatus === "partial" ? Math.min(item.paidAmount || 0, totalNow) : 0
          await recordStockPurchase(item, { quantity: item.quantity, paid: paidNow, rates })
          // Borç artık alış kaydından izlenir; ürün kaydı "ödendi" işaretlenir (çift sayım olmasın)
          await updateInventoryItem(item.id, { paymentStatus: "paid", paidAmount: 0 })
          setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, paymentStatus: "paid", paidAmount: 0 } : i)))
          recorded = true
        } catch (e) {
          console.error("Alış kaydı oluşturulamadı (SQL v9 çalıştırıldı mı?); eski borç takibi kullanılıyor:", e)
        }
      }
      if (!recorded && item.supplier && item.paymentStatus !== "unpaid") {
        const rate = item.purchaseCurrency === "USD" ? rates.USD : item.purchaseCurrency === "EUR" ? rates.EUR : 1
        const totalTRY = item.purchasePrice * rate * item.quantity
        const paidTRY = item.paymentStatus === "paid" ? totalTRY : Math.min(item.paidAmount || 0, totalTRY || item.paidAmount || 0)
        if (paidTRY > 0) {
          createTransaction({
            type: "expense",
            category: "Stok Alımı",
            amount: Math.round(paidTRY * 100) / 100,
            description: `📦 Stok alımı: ${item.name} x${item.quantity} (${item.supplier})`,
            date: localDateStr(),
            customer: item.supplier,
            source: "manual",
          }).catch((e) => console.error("Stok alımı kasaya yazılamadı:", e))
        }
      }
      setNewItem({ category: "Telefon (Sıfır)", quantity: 0, minQuantity: 5, purchasePrice: 0, purchaseCurrency: "TRY", profitMargin: 30, salePrice: 0, paymentStatus: "unpaid", paidAmount: 0 })
      setCustomCategory("")
      setQpType(""); setQpBrand(""); setQpModel(""); setQpVariant("")
      setIsDialogOpen(false)
      showToast("Ürün eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Ürün eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    if (isFallback && (editingItem.purchaseCurrency === "USD" || editingItem.purchaseCurrency === "EUR")) {
      showToast("Güncel döviz kuru alınamadı; dövizli ürün şu an güncellenemez. Bağlantıyı kontrol edip tekrar deneyin.", "error")
      return
    }
    if (!editingItem.name) {
      showToast("Lütfen ürün adını girin!", "error")
      return
    }
    if (editingItem.imei && editingItem.quantity > 0) {
      const conflict = await findActiveImeiConflict(editingItem.imei, editingItem.id)
      if (conflict) {
        showToast(`Bu IMEI başka bir stok kaydında zaten var: ${conflict.name}${conflict.productCode ? ` (${conflict.productCode})` : ""}.`, "error")
        return
      }
    }
    const resolvedCategory = editingItem.category === "__new__" ? (editCustomCategory.trim() || "Diğer") : editingItem.category
    const salePrice = calculateSalePrice(
      editingItem.purchasePrice,
      editingItem.purchaseCurrency,
      editingItem.profitMargin,
      rates
    )
    try {
      const original = inventory.find(i => i.id === editingItem.id)
      // Düzenleme ekranında stok değiştirilirse alınan toplam adet de aynı kadar değişir (artış: borç artar, azalış: borç düşer)
      const stockChange = original ? editingItem.quantity - original.quantity : 0
      const purchasedQuantity = Math.max(0, (original?.purchasedQuantity ?? original?.quantity ?? editingItem.quantity) + stockChange)
      const updated = await updateInventoryItem(editingItem.id, { ...editingItem, category: resolvedCategory, salePrice, purchasedQuantity })
      if (original) {
        logChange("Envanter", "updated", `Ürün düzenlendi: ${original.name}${original.productCode ? ` (${original.productCode})` : ""}`, diffFields(
          original as any,
          updated as any,
          [{ key: "name", label: "Ad" }, { key: "salePrice", label: "Satış fiyatı" }, { key: "purchasePrice", label: "Alış fiyatı" }, { key: "purchaseCurrency", label: "Para birimi" }, { key: "profitMargin", label: "Kâr marjı %" }, { key: "quantity", label: "Stok" }, { key: "minQuantity", label: "Min. stok" }, { key: "supplier", label: "Tedarikçi" }, { key: "imei", label: "IMEI" }]
        ))
      }
      if (original && editingItem.quantity !== original.quantity) {
        logStockMovement(editingItem.id, editingItem.name, editingItem.quantity - original.quantity, "Ürün düzenleme")
      }
      setInventory(inventory.map(item => item.id === updated.id ? updated : item))
      setIsEditOpen(false)
      setEditingItem(null)
      setEditCustomCategory("")
      let doneMsg = "Ürün güncellendi."
      // Alış fiyatı/para birimi düzeltildiyse: tedarikçi borcu Alışlar kayıtlarından hesaplanır, o kayıtlar da düzeltilsin
      if (original && (Number(original.purchasePrice) !== Number(updated.purchasePrice) || original.purchaseCurrency !== updated.purchaseCurrency)) {
        try {
          const groups = await findPurchaseLinesAtPrice(updated.id, original.purchasePrice, original.purchaseCurrency)
          if (groups.length > 0) {
            const codes = groups.map((g) => g.purchase.code).join(", ")
            const oldTxt = `${original.purchasePrice} ${original.purchaseCurrency}`
            const newTxt = `${updated.purchasePrice} ${updated.purchaseCurrency}`
            if (confirm(`Bu ürünün alış kaydı eski fiyatla kayıtlı (${oldTxt}): ${codes}\n\nTedarikçi borcu bu kayıtlardan hesaplanır. Alış kaydı ve borç da yeni fiyata (${newTxt}) göre düzeltilsin mi?`)) {
              let refundTotal = 0
              for (const g of groups) {
                const r = await correctPurchasePrices(g.purchase, g.indexes.map((index) => ({ index, unitPrice: updated.purchasePrice, currency: updated.purchaseCurrency })), rates, isFallback)
                refundTotal += r.refund
              }
              doneMsg = `Ürün güncellendi; alış kaydı (${codes}) ve tedarikçi borcu da düzeltildi.${refundTotal > 0.009 ? ` ${formatCurrency(refundTotal)} fazla ödeme kasaya iade geliri yazıldı.` : ""}`
            } else {
              doneMsg = "Ürün güncellendi (alış kaydı eski fiyatla kaldı; gerekirse Alışlar > Detay > ✏️ Fiyatı düzelt)."
            }
          }
        } catch (e: any) {
          console.error(e)
          doneMsg = `Ürün güncellendi ancak alış kaydı düzeltilemedi: ${e?.message || "Alışlar sayfasından ✏️ Fiyatı düzelt ile düzeltin."}`
        }
      }
      showToast(doneMsg, "success")
    } catch (e) {
      console.error(e)
      showToast("Ürün güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteItem = async (id: string) => {
    const item = inventory.find(i => i.id === id)
    if (!item) return
    if (!confirm(`\u{26A0} *${item.name}* ürününü silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    try {
      await deleteInventoryItem(id)
      setInventory(inventory.filter(item => item.id !== id))
      showToast("Ürün silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Ürün silinirken bir sorun oluştu.", "error")
    }
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({ ...item })
    setIsEditOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">📦 Envanter</h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportInventory} variant="outline" className="border-slate-600 text-slate-300">
            <Download className="mr-2 h-4 w-4" />Excel'e Aktar
          </Button>
          <Button onClick={() => { window.location.href = "/dashboard/purchases" }} variant="outline" className="border-slate-600 text-slate-300">
            <Smartphone className="mr-2 h-4 w-4" />Alış Yap
          </Button>
          <Button onClick={() => setCountOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
            <ClipboardList className="mr-2 h-4 w-4" />Sayım
          </Button>
          <Button onClick={() => setOrderOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
            <MessageCircle className="mr-2 h-4 w-4" />Sipariş Listesi
          </Button>
          <Button onClick={refreshPricesByRate} variant="outline" className="border-slate-600 text-slate-300">
            <RefreshCw className="mr-2 h-4 w-4" />Kura Göre Fiyat
          </Button>
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
            <Upload className="mr-2 h-4 w-4" />Excel ile Yükle
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Stok Ürünü</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <label className="text-sm font-medium text-slate-300">⚡ Hızlı Ürün Seçimi (Tür → Marka → Model)</label>
                <Select value={qpType} onValueChange={(v) => { setQpType(v); setQpBrand(""); setQpModel("") }}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Ürün türü seçin (kategori)" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {PRODUCT_TYPE_GROUPS.map((g) => (
                      <SelectGroup key={g.name}>
                        <SelectLabel className="text-slate-500">{g.name}</SelectLabel>
                        {g.types.map((t) => <SelectItem key={t.label} value={t.label} className="text-white">{t.label}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {qpType && findProductType(qpType)?.modelBased && (
                  <>
                    <SearchPicker options={PHONE_BRANDS} value={qpBrand} onChange={(v) => { setQpBrand(v); setQpModel("") }} placeholder="Marka (listeden seç veya yaz)" />
                    <SearchPicker options={PHONE_CATALOG[qpBrand] || []} value={qpModel} onChange={setQpModel} placeholder={qpBrand ? `${qpBrand} modeli (listeden seç veya yaz)` : "Önce marka seçin"} disabled={!qpBrand} />
                  </>
                )}
                {qpType && (
                  <Input
                    value={qpVariant}
                    onChange={(e) => setQpVariant(e.target.value)}
                    placeholder={findProductType(qpType)?.modelBased ? "Varyant: renk, depolama, kalite... (ör. 128GB Siyah / Silikon Şeffaf)" : "Ürün açıklaması (ör. 20W Type-C Hızlı Şarj)"}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                )}
                <p className="text-xs text-slate-500">Seçtikçe aşağıdaki ürün adı ve kategori otomatik dolar; adı sonradan elle de düzeltebilirsiniz. Listede olmayan marka/model yazılarak eklenir.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ürün Adı <span className="text-red-400">*</span></label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Ürün adı"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newItem.category === "__new__" ? "__new__" : newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {PRODUCT_TYPE_GROUPS.map((g) => (
                        <SelectGroup key={g.name}>
                          <SelectLabel className="text-slate-500">{g.name}</SelectLabel>
                          {g.types.map((t) => (
                            <SelectItem key={t.label} value={t.label} className="text-white">{t.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                      {extraCategories(categories).length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-slate-500">📂 Mevcut diğer kategoriler</SelectLabel>
                          {extraCategories(categories).map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      <SelectItem value="__new__" className="text-emerald-400">+ Yeni Kategori Ekle</SelectItem>
                    </SelectContent>
                  </Select>
                  {newItem.category === "__new__" && (
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Yeni kategori adı"
                      className="bg-slate-800 border-slate-600 text-white mt-2"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Miktar</label>
                  <Input
                    type="number"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Min. Stok</label>
                  <Input
                    type="number"
                    value={newItem.minQuantity ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, minQuantity: e.target.value === "" ? undefined : Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Konum</label>
                  <Input
                    value={newItem.location || ""}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="Raf A-1"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">IMEI / Seri No (telefon vb. için, opsiyonel)</label>
                <Input
                  value={newItem.imei || ""}
                  onChange={(e) => setNewItem({ ...newItem, imei: e.target.value })}
                  placeholder="Aynı IMEI iki kez stoğa girilemez"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <p className="text-xs text-slate-500">🏷️ Ürün kodumuz (YTE-XXXX) kaydettikten sonra otomatik atanacak.</p>
                <label className="text-sm font-medium text-slate-300">Satıcının Barkodu (opsiyonel)</label>
                <div className="flex gap-2">
                  <Input
                    value={newItem.supplierBarcode || ""}
                    onChange={(e) => setNewItem({ ...newItem, supplierBarcode: e.target.value })}
                    placeholder="Örn: 8690504027508"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Kamerayla okut"
                    onClick={() => setIsNewSupplierBarcodeScannerOpen(true)}
                    className="border-slate-600 text-amber-400 shrink-0"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Kutunun üstündeki hazır barkod. Girerseniz o barkodu okutunca da bu ürün bulunur.</p>
                <div className="pt-2">
                  <ImageUploadField
                    value={newItem.imageUrl}
                    onChange={(url) => setNewItem({ ...newItem, imageUrl: url })}
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4" />
                  Fiyatlandırma
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Alış Fiyatı</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.purchasePrice || ""}
                      onChange={(e) => setNewItem({ ...newItem, purchasePrice: Number(e.target.value) })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Para Birimi</label>
                    <Select
                      value={newItem.purchaseCurrency}
                      onValueChange={(value: "TRY" | "USD" | "EUR") => setNewItem({ ...newItem, purchaseCurrency: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="TRY" className="text-white">₺ TRY</SelectItem>
                        <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                        <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Kar Marjı (%)</label>
                    <Input
                      type="number"
                      value={newItem.profitMargin || ""}
                      onChange={(e) => setNewItem({ ...newItem, profitMargin: Number(e.target.value) })}
                      placeholder="30"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-400">Tahmini Satış Fiyatı:</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(calculateSalePrice(
                        Number(newItem.purchasePrice) || 0,
                        newItem.purchaseCurrency || "TRY",
                        Number(newItem.profitMargin) || 0,
                        rates
                      ))}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Kur: $1 = {formatCurrency(rates.USD)} | €1 = {formatCurrency(rates.EUR)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tedarikçi</label>
                <Select value={newItem.supplier || "__none__"} onValueChange={(v) => setNewItem({ ...newItem, supplier: v === "__none__" ? "" : v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="__none__" className="text-slate-400">— Seçilmedi —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-slate-500">Kayıtlı tedarikçi yok — aşağıdan hemen ekleyebilirsiniz.</p>
                )}
                {renderQuickSupplier("new")}
              </div>
              {newItem.supplier && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tedarikçiye Ödeme Durumu</label>
                  <Select value={newItem.paymentStatus || "unpaid"} onValueChange={(v: "paid" | "unpaid" | "partial") => setNewItem({ ...newItem, paymentStatus: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="unpaid" className="text-white">Ödenmedi</SelectItem>
                      <SelectItem value="partial" className="text-white">Kısmi Ödendi</SelectItem>
                      <SelectItem value="paid" className="text-white">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
                  {newItem.paymentStatus === "partial" && (
                    <>
                      <Input
                        type="number"
                        value={newItem.paidAmount ?? ""}
                        onChange={(e) => setNewItem({ ...newItem, paidAmount: Number(e.target.value) })}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Ödenen tutar (TL)"
                      />
                      {(() => {
                        const priceInTRY = newItem.purchaseCurrency === "USD" ? (newItem.purchasePrice || 0) * rates.USD
                          : newItem.purchaseCurrency === "EUR" ? (newItem.purchasePrice || 0) * rates.EUR
                          : (newItem.purchasePrice || 0)
                        const total = priceInTRY * (newItem.quantity || 0)
                        const net = total - (Number(newItem.paidAmount) || 0)
                        if (!total) return null
                        return net >= 0
                          ? <p className="text-xs text-amber-400">⏳ Bu alıştan kalan borcumuz: {formatCurrency(net)}</p>
                          : <p className="text-xs text-cyan-400">💰 Fazla ödendi — tedarikçiden alacağımız: {formatCurrency(-net)}</p>
                      })()}
                    </>
                  )}
                </div>
              )}
              <Button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <BarcodeScannerDialog
        open={isNewSupplierBarcodeScannerOpen}
        onOpenChange={setIsNewSupplierBarcodeScannerOpen}
        title="Satıcı Barkodunu Okut"
        onScan={(code) => {
          setNewItem({ ...newItem, supplierBarcode: code })
          showToast(`Satıcı barkodu alındı: ${code}`, "success")
        }}
      />

      <BarcodeScannerDialog
        open={isSupplierBarcodeScannerOpen}
        onOpenChange={setIsSupplierBarcodeScannerOpen}
        title="Satıcı Barkodunu Okut"
        onScan={(code) => {
          if (editingItem) setEditingItem({ ...editingItem, supplierBarcode: code })
          showToast(`Satıcı barkodu alındı: ${code}`, "success")
        }}
      />

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        title="Ürün Barkodu Okut"
        onScan={(code) => {
          setSearchTerm(code)
          const lower = code.toLowerCase()
          const found = inventory.find(i =>
            (i.productCode || "").toLowerCase() === lower ||
            (i.supplierBarcode || "").toLowerCase() === lower ||
            (i.sku || "").toLowerCase() === lower
          )
          showToast(found ? `Bulundu: ${found.name}` : `"${code}" için ürün bulunamadı. Ürünü düzenleyip "Satıcının Barkodu" alanına bu kodu ekleyebilirsiniz.`, found ? "success" : "error")
        }}
      />

      <ExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Envanteri Excel ile Yükle"
        fields={INVENTORY_IMPORT_FIELDS}
        onImport={handleExcelImport}
        templateHint="Excel dosyanızda şu sütunlar olmalı: Ürün Adı, SKU, Kategori, Stok, Min. Stok, Alış Fiyatı, Para Birimi (TRY/USD/EUR), Kâr Marjı (%), Tedarikçi, Konum. Sütun sırası ve tam isim önemli değil, bir sonraki adımda eşleştirebilirsiniz."
      />

      <div className="grid gap-4 md:grid-cols-5">
        <Card onClick={() => setStatKey("all")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card onClick={() => setStatKey("low")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card onClick={() => setStatKey("cost")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Maliyet</CardTitle>
            <Barcode className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalPurchaseValue)}</div>
          </CardContent>
        </Card>
        <Card onClick={() => setStatKey("saleValue")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Satış Değeri</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSaleValue)}</div>
          </CardContent>
        </Card>
        <Card onClick={() => setStatKey("profit")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tahmini Kar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totalProfit)}</div>
            <div className="text-xs text-slate-500">
              %{totalPurchaseValue > 0 ? Math.round((totalProfit / totalPurchaseValue) * 100) : 0} marj
            </div>
          </CardContent>
        </Card>
      </div>

{(() => {
  const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)
  const defs: Record<string, { title: string; rows: StatRow[]; summary?: string }> = {}
  const costTRY = (i: typeof inventoryWithPrices[number]) => (i.purchaseCurrency === "USD" ? i.purchasePrice * rates.USD : i.purchaseCurrency === "EUR" ? i.purchasePrice * rates.EUR : i.purchasePrice)
  const rowOf = (i: typeof inventoryWithPrices[number], right: string, rightClass: string): StatRow => ({
    id: i.id,
    title: i.name,
    tag: i.productCode,
    subtitle: `${i.category} • Stok ${i.quantity}/${i.minQuantity}${i.supplier ? ` • ${i.supplier}` : ""}`,
    right,
    rightClass,
    onClick: () => { setStatKey(null); setSearchTerm(i.productCode || i.name) },
  })
  const inStock = inventoryWithPrices.filter(i => i.quantity > 0)
  defs.all = { title: "Tüm Ürünler", rows: inventoryWithPrices.map(i => rowOf(i, `${i.quantity} adet`, i.minQuantity > 0 && i.quantity <= i.minQuantity ? "text-red-400" : "text-white")) }
  defs.low = { title: "Kritik Stoktaki Ürünler", rows: lowStockItems.map(i => rowOf(i, `${i.quantity}/${i.minQuantity}`, "text-red-400")) }
  defs.cost = { title: "Stok Maliyeti (ürün bazında)", summary: `Toplam: ${money(totalPurchaseValue)}`, rows: inStock.map(i => rowOf(i, money(costTRY(i) * i.quantity), "text-amber-400")).sort((a, b) => 0) }
  defs.saleValue = { title: "Stok Satış Değeri (ürün bazında)", summary: `Toplam: ${money(totalSaleValue)}`, rows: inStock.map(i => rowOf(i, money(i.salePrice * i.quantity), "text-emerald-400")) }
  defs.profit = { title: "Tahmini Kâr (ürün bazında)", summary: `Toplam: ${money(totalProfit)}`, rows: inStock.map(i => rowOf(i, money((i.salePrice - costTRY(i)) * i.quantity), "text-green-400")) }
  const def = statKey ? defs[statKey] : null
  return <StatListDialog open={!!def} onOpenChange={(o) => { if (!o) setStatKey(null) }} title={def?.title || ""} rows={def?.rows || []} summary={def?.summary} />
})()}

      {lowStockItems.length > 0 && (
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kritik Stok Uyarısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{item.name} <span className="text-xs font-normal text-slate-500">({item.category})</span></span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600">Stok: {item.quantity} / Min: {item.minQuantity}</Badge>
                    {item.supplier && (
                      <Button size="sm" variant="outline" onClick={() => orderViaWhatsApp(item)} className="h-7 px-2 border-green-600 text-green-400 hover:text-green-300 hover:bg-green-500/10" title="Tedarikçiye WhatsApp ile sipariş">
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stok Listesi
            </span>
            <span className="text-sm text-slate-400">{filteredItems.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500 shrink-0" />
              <Input
                ref={searchInputRef}
                placeholder="Ürün adı, kod, SKU veya tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-0 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                size="icon"
                variant="outline"
                title="Kamerayla barkod okut"
                onClick={() => setIsScannerOpen(true)}
                className="border-slate-600 text-amber-400 shrink-0"
              >
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredItems.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ürün bulunamadı.</p>
              </div>
            )}
            {filteredItems.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE).map((item) => {
              const stockPercent = item.minQuantity > 0 ? Math.min(100, (item.quantity / item.minQuantity) * 100) : 100
              const isLowStock = item.minQuantity > 0 && item.quantity <= item.minQuantity
              const purchaseInTRY = item.purchaseCurrency === "USD"
                ? item.purchasePrice * rates.USD
                : item.purchaseCurrency === "EUR"
                  ? item.purchasePrice * rates.EUR
                  : item.purchasePrice

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-800 bg-red-900/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-slate-600 shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{item.name}</span>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{item.category}</Badge>
                        {isLowStock && <Badge className="bg-red-600 text-xs">Kritik Stok</Badge>}
                      </div>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        {item.productCode && (
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800">
                            {item.productCode}
                          </span>
                        )}
                        {item.supplier && (
                          <span className="flex items-center gap-1">
                            • {item.supplier}
                            {(() => {
                              // Alışlar sayfasından izlenen ürünlerde ödeme durumu alış kayıtlarından gösterilir
                              // (ürün kaydındaki eski "ödeme durumu" alanı çift borç olmasın diye "ödendi" tutulur)
                              const mine = supplierPurchases.filter((p) => p.items.some((l) => l.inventoryId === item.id))
                              const status = mine.length > 0
                                ? (mine.some((p) => p.total - p.paid > 0.009) ? (mine.some((p) => p.paid > 0.009 && p.total - p.paid > 0.009) ? "partial" : "unpaid") : "paid")
                                : item.paymentStatus
                              return (
                                <>
                                  {status === "paid" && <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700 text-[10px] px-1.5 py-0">Ödendi</Badge>}
                                  {status === "partial" && <Badge className="bg-amber-900/50 text-amber-300 border-amber-700 text-[10px] px-1.5 py-0">Kısmi Ödendi</Badge>}
                                  {status === "unpaid" && <Badge className="bg-red-900/50 text-red-300 border-red-700 text-[10px] px-1.5 py-0">Ödenmedi</Badge>}
                                </>
                              )
                            })()}
                          </span>
                        )}
                        {item.location && <span>• {item.location}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{formatCurrency(item.salePrice)}</div>
                      <div className="text-xs text-slate-400">Satış fiyatı</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-3">
                    <div>
                      <span className="text-slate-500">Alış:</span>{" "}
                      {item.purchaseCurrency === "USD" ? "$" : item.purchaseCurrency === "EUR" ? "€" : "₺"}
                      {item.purchasePrice} ({formatCurrency(purchaseInTRY)})
                    </div>
                    <div>
                      <span className="text-slate-500">Kar:</span>{" "}
                      <span className="text-emerald-400">%{item.profitMargin}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Birim Kar:</span>{" "}
                      <span className="text-green-400">{formatCurrency(item.salePrice - purchaseInTRY)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStockMove({ item, mode: "out" })}
                        disabled={item.quantity <= 0}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold w-8 text-center text-white">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStockMove({ item, mode: "in" })}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Progress value={stockPercent} className={isLowStock ? "bg-red-900/50" : "bg-slate-700"} />
                    </div>
                    <div className="text-sm text-slate-400 sm:w-24 sm:text-right">
                      Stok: {item.quantity}/{item.minQuantity}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printBarcodeLabels([{ name: item.name, productCode: item.productCode, salePrice: item.salePrice }])}
                        disabled={!item.productCode}
                        title={item.productCode ? "Barkod etiketi yazdır" : "Ürün kodu yok"}
                        className="border-amber-600 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                      >
                        <Barcode className="h-4 w-4 mr-1" />Etiket
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openHistory(item)}
                        className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-500/10"
                        title="Stok hareket geçmişi"
                      >
                        <HistoryIcon className="h-4 w-4 mr-1" />Hareket
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="border-blue-600 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Pencil className="h-4 w-4 mr-1" />Düzenle
                      </Button>
                      {isManager && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="border-red-600 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />Sil
                      </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination
            currentPage={listPage}
            totalPages={Math.ceil(filteredItems.length / PAGE_SIZE)}
            goToPage={(p) => setListPage(Math.max(1, Math.min(p, Math.ceil(filteredItems.length / PAGE_SIZE))))}
            goToNext={() => setListPage(p => Math.min(p + 1, Math.ceil(filteredItems.length / PAGE_SIZE)))}
            goToPrev={() => setListPage(p => Math.max(p - 1, 1))}
            totalItems={filteredItems.length}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>

      <StockMoveDialog
        item={stockMove?.item || null}
        mode={stockMove?.mode || "in"}
        onClose={() => setStockMove(null)}
        suppliers={suppliers}
        rates={rates}
        isFallback={isFallback}
        onDone={() => { fetchInventory().then(setInventory).catch((e) => console.error(e)) }}
        notify={showToast}
      />

      {/* İkinci El Cihaz Alımı */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">📱 İkinci El Cihaz Alımı</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Satıcı Ad Soyad *" value={purchaseForm.sellerName} onChange={(e) => setPurchaseForm({ ...purchaseForm, sellerName: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              <Input placeholder="Telefon" value={purchaseForm.sellerPhone} onChange={(e) => setPurchaseForm({ ...purchaseForm, sellerPhone: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <Input placeholder="T.C. Kimlik No (belgeye yazılır, kaydedilmez)" value={purchaseForm.sellerIdNo} onChange={(e) => setPurchaseForm({ ...purchaseForm, sellerIdNo: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            <Input placeholder="Cihaz (marka / model) *" value={purchaseForm.deviceName} onChange={(e) => setPurchaseForm({ ...purchaseForm, deviceName: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            <Input placeholder="IMEI / Seri No" value={purchaseForm.imei} onChange={(e) => setPurchaseForm({ ...purchaseForm, imei: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            <Input placeholder="Cihaz durumu (çizik, pil sağlığı, aksesuar...)" value={purchaseForm.conditionNote} onChange={(e) => setPurchaseForm({ ...purchaseForm, conditionNote: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" inputMode="decimal" placeholder="Ödenen tutar (TL) *" value={purchaseForm.price} onChange={(e) => setPurchaseForm({ ...purchaseForm, price: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              <Input type="number" inputMode="decimal" placeholder="Satış fiyatı (boşsa +%20)" value={purchaseForm.salePrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, salePrice: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={purchaseForm.addToStock} onChange={(e) => setPurchaseForm({ ...purchaseForm, addToStock: e.target.checked })} />
              Cihazı "İkinci El" olarak stoğa ekle
            </label>
            <p className="text-xs text-slate-500">Kaydedince alım belgesi yazdırılır ve ödenen tutar kasaya gider olarak yazılır. T.C. kimlik no veritabanına kaydedilmez, sadece belgeye basılır.</p>
            <Button onClick={handleDevicePurchase} className="w-full bg-emerald-600 hover:bg-emerald-700">Kaydet ve Belgeyi Yazdır</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sipariş Listesi */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">📋 Tedarikçi Sipariş Listesi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {orderGroups().length === 0 && <p className="text-sm text-slate-400">Kritik stokta ürün yok, sipariş gerekmiyor. 🎉</p>}
            {orderGroups().map((g) => (
              <div key={g.name} className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
                <div className="font-medium text-white">🚚 {g.name}</div>
                <div className="space-y-1">
                  {g.items.map(({ item, suggest }) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.name} <span className="text-slate-500">(stok {item.quantity}/{item.minQuantity})</span></span>
                      <span className="text-amber-400 font-medium">{suggest} adet</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-green-600 text-green-400" onClick={() => sendOrderWhatsApp(g)} disabled={!g.supplier}>
                    <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => copyOrder(g)}>
                    <Copy className="h-3 w-3 mr-1" />Kopyala
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">Önerilen adet: asgari stokun 2 katına tamamlamak için gereken miktar.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stok Sayımı */}
      <Dialog open={countOpen} onOpenChange={setCountOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">📋 Stok Sayımı</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Ürün kodunu okutun ya da yazıp Enter'a basın; her okutuş sayımı 1 artırır. Sonunda farklar stoğa işlenir.</p>
            <div className="flex gap-2">
              <Input
                autoFocus
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCount(countInput) }}
                placeholder="YTE-0001 veya barkod"
                className="bg-slate-800 border-slate-600 text-white"
              />
              <Button type="button" size="icon" variant="outline" className="border-slate-600 text-amber-400 shrink-0" onClick={() => setCountScanOpen(true)}>
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {Object.keys(counts).length === 0 && <p className="text-sm text-slate-500">Henüz ürün sayılmadı.</p>}
              {(Object.entries(counts) as [string, number][]).map(([id, counted]) => {
                const item = inventory.find(i => i.id === id)
                if (!item) return null
                const diff = counted - item.quantity
                return (
                  <div key={id} className="flex items-center justify-between gap-2 p-2 bg-slate-800 rounded border border-slate-700">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{item.name}</div>
                      <div className="text-xs text-slate-500">Sistemde: {item.quantity} • <span className={diff === 0 ? "text-emerald-400" : "text-amber-400"}>{diff === 0 ? "Tutuyor" : `Fark: ${diff > 0 ? "+" : ""}${diff}`}</span></div>
                    </div>
                    <Input
                      type="number"
                      value={counted}
                      onChange={(e) => setCounts(prev => ({ ...prev, [id]: Math.max(0, Number(e.target.value) || 0) }))}
                      className="w-20 h-8 bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button onClick={applyCounts} disabled={Object.keys(counts).length === 0} className="bg-emerald-600 hover:bg-emerald-700 flex-1">Sayımı Uygula</Button>
              <Button variant="outline" onClick={() => setCounts({})} className="border-slate-600 text-slate-300">Temizle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <BarcodeScannerDialog
        open={countScanOpen}
        onOpenChange={setCountScanOpen}
        title="Sayım — Barkod Okut"
        onScan={(code) => addCount(code)}
      />

      {/* Stok Hareket Geçmişi */}
      <Dialog open={!!historyItem} onOpenChange={(o) => { if (!o) setHistoryItem(null) }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">🕘 Stok Hareketleri — {historyItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {movementsLoading && <p className="text-sm text-slate-400">Yükleniyor...</p>}
            {!movementsLoading && movements.length === 0 && <p className="text-sm text-slate-500">Henüz kayıtlı hareket yok. (Hareketler bu sürümden sonra kaydedilir.)</p>}
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                <div>
                  <div className="text-white">{m.reason || "Stok değişimi"}</div>
                  <div className="text-xs text-slate-500">{m.date}{m.userName ? ` • ${m.userName}` : ""}</div>
                </div>
                <span className={m.delta > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Ürün Düzenle</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ürün Adı <span className="text-red-400">*</span></label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">IMEI / Seri No (opsiyonel)</label>
                <Input
                  value={editingItem.imei || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, imei: e.target.value })}
                  placeholder="Aynı IMEI iki kez stoğa girilemez"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <label className="text-sm font-medium text-slate-300">Ürün Kodumuz</label>
                <div className="font-mono text-amber-300 text-sm">{editingItem.productCode || "—"}</div>
                <label className="text-sm font-medium text-slate-300 pt-2 block">Satıcının Barkodu (opsiyonel)</label>
                <div className="flex gap-2">
                  <Input
                    value={editingItem.supplierBarcode || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, supplierBarcode: e.target.value })}
                    placeholder="Örn: 8690504027508"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Kamerayla okut"
                    onClick={() => setIsSupplierBarcodeScannerOpen(true)}
                    className="border-slate-600 text-amber-400 shrink-0"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Kutunun üstündeki hazır barkod. Girerseniz o barkodu okutunca da bu ürün bulunur.</p>
                <div className="pt-2">
                  <ImageUploadField
                    value={editingItem.imageUrl}
                    onChange={(url) => setEditingItem({ ...editingItem, imageUrl: url })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={editingItem.category === "__new__" ? "__new__" : editingItem.category}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {PRODUCT_TYPE_GROUPS.map((g) => (
                        <SelectGroup key={g.name}>
                          <SelectLabel className="text-slate-500">{g.name}</SelectLabel>
                          {g.types.map((t) => (
                            <SelectItem key={t.label} value={t.label} className="text-white">{t.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                      {extraCategories(categories).length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-slate-500">📂 Mevcut diğer kategoriler</SelectLabel>
                          {extraCategories(categories).map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      <SelectItem value="__new__" className="text-emerald-400">+ Yeni Kategori Ekle</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingItem.category === "__new__" && (
                    <Input
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      placeholder="Yeni kategori adı"
                      className="bg-slate-800 border-slate-600 text-white mt-2"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Miktar</label>
                  <Input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <p className="text-[11px] text-slate-500">Satın alma için listedeki ➕ düğmesini ya da Alışlar sayfasını kullanın; buradaki değişiklik alış kaydı oluşturmaz.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Min. Stok</label>
                  <Input
                    type="number"
                    value={editingItem.minQuantity}
                    onChange={(e) => setEditingItem({ ...editingItem, minQuantity: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Konum</label>
                  <Input
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4" />
                  Fiyatlandırma
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Alış Fiyatı</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.purchasePrice}
                      onChange={(e) => setEditingItem({ ...editingItem, purchasePrice: Number(e.target.value) })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Para Birimi</label>
                    <Select
                      value={editingItem.purchaseCurrency}
                      onValueChange={(value: "TRY" | "USD" | "EUR") => setEditingItem({ ...editingItem, purchaseCurrency: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="TRY" className="text-white">₺ TRY</SelectItem>
                        <SelectItem value="USD" className="text-white">$ USD</SelectItem>
                        <SelectItem value="EUR" className="text-white">€ EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Kar Marjı (%)</label>
                    <Input
                      type="number"
                      value={editingItem.profitMargin}
                      onChange={(e) => setEditingItem({ ...editingItem, profitMargin: Number(e.target.value) })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-400">Tahmini Satış Fiyatı:</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(calculateSalePrice(
                        editingItem.purchasePrice,
                        editingItem.purchaseCurrency,
                        editingItem.profitMargin,
                        rates
                      ))}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Kur: $1 = {formatCurrency(rates.USD)} | €1 = {formatCurrency(rates.EUR)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tedarikçi</label>
                <Select value={editingItem.supplier || "__none__"} onValueChange={(v) => setEditingItem({ ...editingItem, supplier: v === "__none__" ? "" : v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="__none__" className="text-slate-400">— Seçilmedi —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderQuickSupplier("edit")}
              </div>
              {editingItem.supplier && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tedarikçiye Ödeme Durumu</label>
                  <Select value={editingItem.paymentStatus || "unpaid"} onValueChange={(v: "paid" | "unpaid" | "partial") => setEditingItem({ ...editingItem, paymentStatus: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="unpaid" className="text-white">Ödenmedi</SelectItem>
                      <SelectItem value="partial" className="text-white">Kısmi Ödendi</SelectItem>
                      <SelectItem value="paid" className="text-white">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingItem.paymentStatus === "partial" && (
                    <>
                      <Input
                        type="number"
                        value={editingItem.paidAmount ?? ""}
                        onChange={(e) => setEditingItem({ ...editingItem, paidAmount: Number(e.target.value) })}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Ödenen tutar (TL)"
                      />
                      {(() => {
                        const priceInTRY = editingItem.purchaseCurrency === "USD" ? editingItem.purchasePrice * rates.USD
                          : editingItem.purchaseCurrency === "EUR" ? editingItem.purchasePrice * rates.EUR
                          : editingItem.purchasePrice
                        const total = priceInTRY * editingItem.quantity
                        const net = total - (Number(editingItem.paidAmount) || 0)
                        if (!total) return null
                        return net >= 0
                          ? <p className="text-xs text-amber-400">⏳ Bu alıştan kalan borcumuz: {formatCurrency(net)}</p>
                          : <p className="text-xs text-cyan-400">💰 Fazla ödendi — tedarikçiden alacağımız: {formatCurrency(-net)}</p>
                      })()}
                    </>
                  )}
                </div>
              )}
              <Button onClick={handleUpdateItem} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Güncelle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
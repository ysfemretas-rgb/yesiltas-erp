"use client"

import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useExchangeRates } from "@/hooks/useExchangeRates"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Package, AlertTriangle, Search, Minus, Plus as PlusIcon, Pencil, Trash2, Save, DollarSign, Upload } from "lucide-react"
import { Consumable, fetchConsumables, createConsumable, createConsumablesBulk, updateConsumable, deleteConsumable } from "@/lib/consumables"
import { ExcelImportDialog, ImportField } from "@/components/ExcelImportDialog"

const CONSUMABLES_IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Malzeme Adı", required: true, type: "text" },
  { key: "category", label: "Kategori", type: "text", defaultValue: "Diğer" },
  { key: "currentStock", label: "Mevcut Stok", type: "number" },
  { key: "minStock", label: "Min. Stok", type: "number", defaultValue: 10 },
  { key: "unit", label: "Birim", type: "text", defaultValue: "Adet" },
  { key: "purchasePrice", label: "Alış Fiyatı", type: "number" },
  { key: "purchaseCurrency", label: "Para Birimi", type: "text", defaultValue: "TRY" },
  { key: "supplier", label: "Tedarikçi", type: "text" },
]

interface ExchangeRates {
  USD: number
  EUR: number
  lastUpdated: string
}

function priceInTRY(price: number, currency: "TRY" | "USD" | "EUR", rates: ExchangeRates): number {
  if (currency === "USD") return price * rates.USD
  if (currency === "EUR") return price * rates.EUR
  return price
}

export default function ConsumablesPage() {
  const { toast, showToast, hideToast } = useToast()

  const { authorized, checking } = usePageAccess("Sarf Malzemeler")
  const isManager = useIsManager()

  const [consumables, setConsumables] = useState<Consumable[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Consumable | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [customCategory, setCustomCategory] = useState("")
  const [editCustomCategory, setEditCustomCategory] = useState("")
  const { rates, isLoadingRates, fetchRates } = useExchangeRates()

  const [newItem, setNewItem] = useState<Partial<Consumable>>({
    category: "Temizlik",
    unit: "Adet",
    currentStock: 0,
    minStock: 10,
    purchasePrice: 0,
    purchaseCurrency: "TRY",
  })

  // Supabase'den yükle (eski localStorage verisi varsa bir kere otomatik aktarılır)
  useEffect(() => {
    let cancelled = false
    fetchConsumables()
      .then((data) => {
        if (!cancelled) setConsumables(data)
      })
      .catch((e) => {
        console.error("Load error:", e)
        if (!cancelled) showToast("Sarf malzemeler yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // Kur bilgisi artık merkezi useExchangeRates() hook'undan geliyor (yukarıda).

  const categories = Array.from(new Set(consumables.map(c => c.category)))

  const filteredItems = consumables.filter((item) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search)
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = consumables.filter(item => item.currentStock <= item.minStock)
  const totalValue = consumables.reduce((sum, item) => {
    return sum + (priceInTRY(item.purchasePrice, item.purchaseCurrency, rates) * item.currentStock)
  }, 0)

  const updateStock = async (id: string, delta: number) => {
    const item = consumables.find(c => c.id === id)
    if (!item) return
    const newStock = Math.max(0, item.currentStock + delta)
    setConsumables(consumables.map(c => c.id === id ? { ...c, currentStock: newStock } : c))
    try {
      await updateConsumable(id, { currentStock: newStock })
    } catch (e) {
      console.error(e)
      setConsumables(consumables)
      showToast("Stok güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleExcelImport = async (rows: Record<string, any>[]) => {
    const validCurrency = (c: any): "TRY" | "USD" | "EUR" => ["TRY", "USD", "EUR"].includes(String(c).toUpperCase()) ? String(c).toUpperCase() as any : "TRY"
    const inputs = rows.map(r => ({
      name: String(r.name || "").trim(),
      category: String(r.category || "Diğer"),
      currentStock: Number(r.currentStock) || 0,
      minStock: Number(r.minStock) || 10,
      unit: String(r.unit || "Adet"),
      purchasePrice: Number(r.purchasePrice) || 0,
      purchaseCurrency: validCurrency(r.purchaseCurrency),
      supplier: String(r.supplier || ""),
      lastRestocked: new Date().toISOString().split("T")[0],
    })).filter(r => r.name)
    const created = await createConsumablesBulk(inputs)
    setConsumables([...created, ...consumables])
  }

  const handleAddItem = async () => {
    if (!newItem.name) {
      showToast("Lütfen malzeme adı girin!", "error")
      return
    }
    try {
      const item = await createConsumable({
        name: newItem.name,
        category: newItem.category === "__new__" ? (customCategory.trim() || "Diğer") : (newItem.category || "Diğer"),
        currentStock: Number(newItem.currentStock) || 0,
        minStock: Number(newItem.minStock) || 10,
        unit: newItem.unit || "Adet",
        purchasePrice: Number(newItem.purchasePrice) || 0,
        purchaseCurrency: newItem.purchaseCurrency || "TRY",
        supplier: newItem.supplier || "",
        lastRestocked: new Date().toISOString().split("T")[0],
      })
      setConsumables([item, ...consumables])
      setNewItem({ category: "Temizlik", unit: "Adet", currentStock: 0, minStock: 10, purchasePrice: 0, purchaseCurrency: "TRY" })
      setCustomCategory("")
      setIsDialogOpen(false)
      showToast("Malzeme eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Malzeme eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    if (!editingItem.name) {
      showToast("Lütfen malzeme adı girin!", "error")
      return
    }
    try {
      const resolvedCategory = editingItem.category === "__new__" ? (editCustomCategory.trim() || "Diğer") : editingItem.category
      const updated = await updateConsumable(editingItem.id, { ...editingItem, category: resolvedCategory })
      setConsumables(consumables.map(item => item.id === updated.id ? updated : item))
      setIsEditOpen(false)
      setEditingItem(null)
      setEditCustomCategory("")
      showToast("Malzeme güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Malzeme güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteItem = async (id: string) => {
    const item = consumables.find(c => c.id === id)
    if (!item) return
    if (!confirm(`\u{26A0} *${item.name}* malzemesini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    try {
      await deleteConsumable(id)
      setConsumables(consumables.filter(item => item.id !== id))
      showToast("Malzeme silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Malzeme silinirken bir sorun oluştu.", "error")
    }
  }

  const openEditDialog = (item: Consumable) => {
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

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null


  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">🧪 Sarf Malzeme Takibi</h1>
        <div className="flex gap-2">
        <Button onClick={() => setIsImportOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
          <Upload className="mr-2 h-4 w-4" />Excel ile Yükle
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Malzeme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Sarf Malzeme</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Malzeme Adı <span className="text-red-400">*</span></label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Malzeme adı"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Birim</label>
                  <Input
                    value={newItem.unit || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Adet, Set, Tüp..."
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Mevcut Stok</label>
                  <Input
                    type="number"
                    value={newItem.currentStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Min. Stok</label>
                  <Input
                    type="number"
                    value={newItem.minStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4" />
                  Maliyet
                </label>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-400">Birim Maliyet (TL):</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(priceInTRY(
                        Number(newItem.purchasePrice) || 0,
                        newItem.purchaseCurrency || "TRY",
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
                <Input
                  value={newItem.supplier || ""}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Tedarikçi adı"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <ExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Sarf Malzemeleri Excel ile Yükle"
        fields={CONSUMABLES_IMPORT_FIELDS}
        onImport={handleExcelImport}
        templateHint="Excel dosyanızda şu sütunlar olmalı: Malzeme Adı, Kategori, Mevcut Stok, Min. Stok, Birim, Alış Fiyatı, Para Birimi (TRY/USD/EUR), Tedarikçi. Sütun sırası ve tam isim önemli değil, bir sonraki adımda eşleştirebilirsiniz."
      />

      {/* Exchange Rates Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span className="text-white font-medium">Canlı Döviz Kurları</span>
              </div>
              <div className="flex gap-3 text-sm">
                <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">
                  $1 = {formatCurrency(rates.USD)}
                </Badge>
                <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">
                  €1 = {formatCurrency(rates.EUR)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {rates.lastUpdated && (
                <span className="text-xs text-slate-500">Güncelleme: {rates.lastUpdated}</span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={fetchRates}
                disabled={isLoadingRates}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {isLoadingRates ? "Yükleniyor..." : "Kur Güncelle"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Malzeme</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{consumables.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Değer</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Kategori Sayısı</CardTitle>
            <Package className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

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
                  <span className="font-medium text-white">{item.name}</span>
                  <Badge className="bg-red-600">Stok: {item.currentStock} {item.unit} / Min: {item.minStock}</Badge>
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
              Sarf Malzeme Listesi
            </span>
            <span className="text-sm text-slate-400">{filteredItems.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Malzeme ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
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

          <div className="space-y-3">
            {filteredItems.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Malzeme bulunamadı.</p>
              </div>
            )}
            {filteredItems.map((item) => {
              const stockPercent = Math.min(100, (item.currentStock / item.minStock) * 100)
              const isLowStock = item.currentStock <= item.minStock
              const unitCostTRY = priceInTRY(item.purchasePrice, item.purchaseCurrency, rates)
              const totalCost = unitCostTRY * item.currentStock

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-700 bg-red-900/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-lg text-white">{item.name}</span>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">{item.category}</Badge>
                        {isLowStock && <Badge className="bg-red-600">Kritik</Badge>}
                      </div>
                      <div className="text-sm text-slate-400">
                        Tedarikçi: {item.supplier} • Son Tedarik: {item.lastRestocked}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{item.currentStock} <span className="text-sm font-normal text-slate-400">{item.unit}</span></div>
                      <div className="text-sm text-emerald-400">
                        {item.purchaseCurrency === "USD" ? "$" : item.purchaseCurrency === "EUR" ? "€" : "₺"}
                        {item.purchasePrice} = {formatCurrency(unitCostTRY)} / {item.unit}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Stok Seviyesi</span>
                      <span className={isLowStock ? "text-red-400" : "text-slate-400"}>
                        Min: {item.minStock} {item.unit}
                      </span>
                    </div>
                    <Progress
                      value={stockPercent}
                      className={`h-2 ${isLowStock ? "bg-red-900/50" : "bg-slate-700"}`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      Toplam Değer: <span className="font-semibold text-white">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStock(item.id, -1)}
                        disabled={item.currentStock <= 0}
                        className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStock(item.id, 1)}
                        className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                        className="border-blue-600 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Pencil className="h-4 w-4 mr-1" />Düzenle
                      </Button>
                      {isManager && (
                      <Button
                        size="sm"
                        variant="outline"
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Malzeme Düzenle</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Malzeme Adı <span className="text-red-400">*</span></label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Birim</label>
                  <Input
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Mevcut Stok</label>
                  <Input
                    type="number"
                    value={editingItem.currentStock}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Min. Stok</label>
                  <Input
                    type="number"
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <label className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4" />
                  Maliyet
                </label>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-400">Birim Maliyet (TL):</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {formatCurrency(priceInTRY(
                        editingItem.purchasePrice,
                        editingItem.purchaseCurrency,
                        rates
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tedarikçi</label>
                <Input
                  value={editingItem.supplier}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
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
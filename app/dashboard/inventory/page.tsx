"use client"

import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { InventoryItem, fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/inventory"

import { useState, useEffect } from "react"
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
import { Plus, Package, Search, AlertTriangle, Barcode, Minus, Plus as PlusIcon, Pencil, Trash2, Save, TrendingUp, DollarSign } from "lucide-react"
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

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { rates, isLoadingRates, fetchRates } = useExchangeRates()
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: "Ekran",
    quantity: 0,
    minQuantity: 5,
    purchasePrice: 0,
    purchaseCurrency: "USD",
    profitMargin: 30,
    salePrice: 0,
  })
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
    return () => { cancelled = true }
  }, [])
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
      item.sku.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search)
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = inventoryWithPrices.filter(item => item.quantity <= item.minQuantity)
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
    setInventory(inventory.map(i => i.id === id ? { ...i, quantity: newQuantity } : i))
    try {
      await updateInventoryItem(id, { quantity: newQuantity })
    } catch (e) {
      console.error(e)
      setInventory(inventory)
      showToast("Stok güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.sku) {
      showToast("Lütfen ürün adı ve SKU kodu girin!", "error")
      return
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
        sku: newItem.sku,
        category: newItem.category || "Diğer",
        quantity: Number(newItem.quantity) || 0,
        minQuantity: Number(newItem.minQuantity) || 5,
        purchasePrice: Number(newItem.purchasePrice) || 0,
        purchaseCurrency: newItem.purchaseCurrency || "TRY",
        profitMargin: Number(newItem.profitMargin) || 0,
        salePrice: salePrice,
        supplier: newItem.supplier || "",
        location: newItem.location || "",
      })
      setInventory([item, ...inventory])
      setNewItem({ category: "Ekran", quantity: 0, minQuantity: 5, purchasePrice: 0, purchaseCurrency: "USD", profitMargin: 30, salePrice: 0 })
      setIsDialogOpen(false)
      showToast("Ürün eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Ürün eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    if (!editingItem.name || !editingItem.sku) {
      showToast("Lütfen ürün adı ve SKU kodu girin!", "error")
      return
    }
    const salePrice = calculateSalePrice(
      editingItem.purchasePrice,
      editingItem.purchaseCurrency,
      editingItem.profitMargin,
      rates
    )
    try {
      const updated = await updateInventoryItem(editingItem.id, { ...editingItem, salePrice })
      setInventory(inventory.map(item => item.id === updated.id ? updated : item))
      setIsEditOpen(false)
      setEditingItem(null)
      showToast("Ürün güncellendi.", "success")
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Stok Yönetimi</h1>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ürün Adı <span className="text-red-400">*</span></label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Ürün adı"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">SKU / Barkod <span className="text-red-400">*</span></label>
                  <Input
                    value={newItem.sku || ""}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="SKU kodu"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                      <SelectItem value="Diğer" className="text-white">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={newItem.minQuantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })}
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

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Maliyet</CardTitle>
            <Barcode className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalPurchaseValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Satış Değeri</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSaleValue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
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
                  <span className="font-medium text-white">{item.name} ({item.sku})</span>
                  <Badge className="bg-red-600">Stok: {item.quantity} / Min: {item.minQuantity}</Badge>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Ürün adı, SKU veya tedarikçi ara..."
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
                <p>Ürün bulunamadı.</p>
              </div>
            )}
            {filteredItems.map((item) => {
              const stockPercent = Math.min(100, (item.quantity / item.minQuantity) * 100)
              const isLowStock = item.quantity <= item.minQuantity
              const purchaseInTRY = item.purchaseCurrency === "USD"
                ? item.purchasePrice * rates.USD
                : item.purchaseCurrency === "EUR"
                  ? item.purchasePrice * rates.EUR
                  : item.purchasePrice

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-800 bg-red-900/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{item.name}</span>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{item.category}</Badge>
                        {isLowStock && <Badge className="bg-red-600 text-xs">Kritik Stok</Badge>}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        <Barcode className="inline h-3 w-3 mr-1" />
                        {item.sku} • {item.supplier} • {item.location}
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 0}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold w-8 text-center text-white">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Progress value={stockPercent} className={isLowStock ? "bg-red-900/50" : "bg-slate-700"} />
                    </div>
                    <div className="text-sm text-slate-400 w-24 text-right">
                      Stok: {item.quantity}/{item.minQuantity}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Pencil className="h-4 w-4 mr-1" />✏️ Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />🗑️ Sil
                      </Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">SKU / Barkod <span className="text-red-400">*</span></label>
                  <Input
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                      <SelectItem value="Diğer" className="text-white">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
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
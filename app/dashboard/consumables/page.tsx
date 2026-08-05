"use client"

import { Toast, useToast } from "@/components/toast"

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
import { Plus, Package, AlertTriangle, Search, Minus, Plus as PlusIcon, Pencil, Trash2, Save, DollarSign } from "lucide-react"

interface Consumable {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  purchasePrice: number
  purchaseCurrency: "TRY" | "USD" | "EUR"
  supplier: string
  lastRestocked: string
}

interface ExchangeRates {
  USD: number
  EUR: number
  lastUpdated: string
}

const initialConsumables: Consumable[] = [
  { id: 1, name: "Ekran Temizleyici", category: "Temizlik", currentStock: 45, minStock: 20, unit: "Adet", purchasePrice: 0.8, purchaseCurrency: "USD", supplier: "TemizlikTedarik", lastRestocked: "2024-01-10" },
  { id: 2, name: "Tornavida Seti", category: "Alet", currentStock: 8, minStock: 10, unit: "Set", purchasePrice: 4.5, purchaseCurrency: "USD", supplier: "AletTedarik", lastRestocked: "2024-01-05" },
  { id: 3, name: "Isıtıcı Tabanca", category: "Alet", currentStock: 3, minStock: 5, unit: "Adet", purchasePrice: 12, purchaseCurrency: "USD", supplier: "AletTedarik", lastRestocked: "2023-12-20" },
  { id: 4, name: "Ekran Yapıştırıcı", category: "Yapıştırıcı", currentStock: 12, minStock: 15, unit: "Tüp", purchasePrice: 2.5, purchaseCurrency: "USD", supplier: "KimyaTedarik", lastRestocked: "2024-01-08" },
  { id: 5, name: "Mikrofiber Bez", category: "Temizlik", currentStock: 100, minStock: 50, unit: "Adet", purchasePrice: 0.15, purchaseCurrency: "USD", supplier: "TemizlikTedarik", lastRestocked: "2024-01-12" },
]

function priceInTRY(price: number, currency: "TRY" | "USD" | "EUR", rates: ExchangeRates): number {
  if (currency === "USD") return price * rates.USD
  if (currency === "EUR") return price * rates.EUR
  return price
}

export default function ConsumablesPage() {

  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)


  const [consumables, setConsumables] = useState<Consumable[]>(initialConsumables)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Consumable | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { rates, isLoadingRates, fetchRates } = useExchangeRates()

  const [newItem, setNewItem] = useState<Partial<Consumable>>({
    category: "Temizlik",
    unit: "Adet",
    currentStock: 0,
    minStock: 10,
    purchasePrice: 0,
    purchaseCurrency: "TRY",
  })

  // Load from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (!userData) {
      if (typeof window !== "undefined") window.location.href = "/"
      setChecking(false)
      return
    }
    try {
      const user = JSON.parse(userData)
      if (user.role === "Yönetici" || (user.permissions || []).includes("Sarf Malzemeler")) {
        setAuthorized(true)
      } else {
        if (typeof window !== "undefined") window.location.href = "/dashboard"
      }
    } catch {
      if (typeof window !== "undefined") window.location.href = "/"
    }
    setChecking(false)
  }, [])


  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("yt_consumables")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConsumables(parsed)
        }
      }
      // Kur bilgisi artık useExchangeRates() hook'u tarafından okunuyor/önbelleğe alınıyor.
    } catch (e) {
      console.error("Load error:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_consumables", JSON.stringify(consumables))
  }, [consumables, isLoaded])

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

  const updateStock = (id: number, delta: number) => {
    setConsumables(consumables.map(item =>
      item.id === id ? { ...item, currentStock: Math.max(0, item.currentStock + delta) } : item
    ))
  }

  const handleAddItem = () => {
    if (!newItem.name) {
      showToast("Lütfen malzeme adı girin!", "error")
      return
    }
    const item: Consumable = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category || "Diğer",
      currentStock: Number(newItem.currentStock) || 0,
      minStock: Number(newItem.minStock) || 10,
      unit: newItem.unit || "Adet",
      purchasePrice: Number(newItem.purchasePrice) || 0,
      purchaseCurrency: newItem.purchaseCurrency || "TRY",
      supplier: newItem.supplier || "",
      lastRestocked: new Date().toISOString().split("T")[0],
    }
    setConsumables([item, ...consumables])
    setNewItem({ category: "Temizlik", unit: "Adet", currentStock: 0, minStock: 10, purchasePrice: 0, purchaseCurrency: "TRY" })
    setIsDialogOpen(false)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return
    if (!editingItem.name) {
      showToast("Lütfen malzeme adı girin!", "error")
      return
    }
    setConsumables(consumables.map(item =>
      item.id === editingItem.id ? editingItem : item
    ))
    setIsEditOpen(false)
    setEditingItem(null)
  }

  const handleDeleteItem = (id: number) => {
    const item = consumables.find(c => c.id === id)
    if (!item) return
    if (!confirm(`\u{26A0} *${item.name}* malzemesini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    setConsumables(consumables.filter(item => item.id !== id))
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


  const { toast, showToast, hideToast } = useToast()

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Sarf Malzeme Takibi</h1>
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
                        variant="ghost"
                        onClick={() => openEditDialog(item)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
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
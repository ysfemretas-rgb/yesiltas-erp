"use client"

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
import { Plus, Package, Search, AlertTriangle, Barcode, Minus, Plus as PlusIcon, Pencil, Trash2, Save } from "lucide-react"

interface InventoryItem {
  id: number
  name: string
  sku: string
  category: string
  quantity: number
  minQuantity: number
  unitPrice: number
  supplier: string
  location: string
}

const initialInventory: InventoryItem[] = [
  { id: 1, name: "iPhone 14 Pro Ekran", sku: "IP14P-SCR-001", category: "Ekran", quantity: 12, minQuantity: 5, unitPrice: 850, supplier: "EkranTedarik", location: "Raf A-1" },
  { id: 2, name: "Samsung S23 Batarya", sku: "SS23-BAT-001", category: "Batarya", quantity: 8, minQuantity: 10, unitPrice: 320, supplier: "SamsungParts", location: "Raf B-2" },
  { id: 3, name: "iPhone 13 Arka Kapak", sku: "IP13-BCK-001", category: "Kapak", quantity: 25, minQuantity: 10, unitPrice: 180, supplier: "AppleParts", location: "Raf A-3" },
  { id: 4, name: "USB-C Şarj Portu", sku: "USBC-PRT-001", category: "Port", quantity: 3, minQuantity: 15, unitPrice: 45, supplier: "GenelTedarik", location: "Raf C-1" },
  { id: 5, name: "iPad Air 5 Ekran", sku: "IPA5-SCR-001", category: "Ekran", quantity: 6, minQuantity: 3, unitPrice: 1200, supplier: "EkranTedarik", location: "Raf A-2" },
  { id: 6, name: "MacBook Air M2 Batarya", sku: "MBA-M2-BAT-001", category: "Batarya", quantity: 4, minQuantity: 2, unitPrice: 1500, supplier: "AppleParts", location: "Raf B-1" },
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: "Ekran",
    quantity: 0,
    minQuantity: 5,
    unitPrice: 0,
  })

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("yt_inventory")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInventory(parsed)
        }
      }
    } catch (e) {
      console.error("Load error:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_inventory", JSON.stringify(inventory))
  }, [inventory, isLoaded])

  const categories = Array.from(new Set(inventory.map(i => i.category)))

  const filteredItems = inventory.filter((item) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search)
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity)
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

  const updateQuantity = (id: number, delta: number) => {
    setInventory(inventory.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ))
  }

  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku) {
      alert("Lütfen ürün adı ve SKU kodu girin!")
      return
    }
    const item: InventoryItem = {
      id: Date.now(),
      name: newItem.name,
      sku: newItem.sku,
      category: newItem.category || "Diğer",
      quantity: Number(newItem.quantity) || 0,
      minQuantity: Number(newItem.minQuantity) || 5,
      unitPrice: Number(newItem.unitPrice) || 0,
      supplier: newItem.supplier || "",
      location: newItem.location || "",
    }
    setInventory([item, ...inventory])
    setNewItem({ category: "Ekran", quantity: 0, minQuantity: 5, unitPrice: 0 })
    setIsDialogOpen(false)
  }

  const handleUpdateItem = () => {
    if (!editingItem) return
    if (!editingItem.name || !editingItem.sku) {
      alert("Lütfen ürün adı ve SKU kodu girin!")
      return
    }
    setInventory(inventory.map(item =>
      item.id === editingItem.id ? editingItem : item
    ))
    setIsEditOpen(false)
    setEditingItem(null)
  }

  const handleDeleteItem = (id: number) => {
    const item = inventory.find(i => i.id === id)
    if (!item) return
    if (!confirm(`\u{26A0} *${item.name}* ürününü silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    setInventory(inventory.filter(item => item.id !== id))
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({ ...item })
    setIsEditOpen(true)
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Stok Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
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
                  <label className="text-sm font-medium text-slate-300">Birim Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={newItem.unitPrice || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tedarikçi</label>
                  <Input
                    value={newItem.supplier || ""}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    placeholder="Tedarikçi adı"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Konum</label>
                  <Input
                    value={newItem.location || ""}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="Depo konumu"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Değer</CardTitle>
            <Barcode className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">₺{totalValue.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Kategori Sayısı</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
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
                      <div className="font-bold text-emerald-400">₺{item.unitPrice.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-slate-400">Birim fiyat</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
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
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
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
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
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
                  <label className="text-sm font-medium text-slate-300">Birim Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tedarikçi</label>
                  <Input
                    value={editingItem.supplier}
                    onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
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
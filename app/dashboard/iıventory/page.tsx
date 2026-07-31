"use client"

import { useState } from "react"
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
import { Plus, Package, Search, AlertTriangle, Barcode, Minus, Plus as PlusIcon } from "lucide-react"

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

const categories = Array.from(new Set(initialInventory.map(i => i.category)))

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: "Ekran",
    quantity: 0,
    minQuantity: 5,
    unitPrice: 0,
  })

  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!newItem.name || !newItem.sku) return
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stok Yonetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Urun
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Yeni Stok Urunu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Urun Adi</label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Urun adi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU / Barkod</label>
                  <Input
                    value={newItem.sku || ""}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="SKU kodu"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="Diger">Diger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Miktar</label>
                  <Input
                    type="number"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min. Stok</label>
                  <Input
                    type="number"
                    value={newItem.minQuantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Birim Fiyat</label>
                  <Input
                    type="number"
                    value={newItem.unitPrice || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tedarikci</label>
                  <Input
                    value={newItem.supplier || ""}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    placeholder="Tedarikci adi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Konum</label>
                  <Input
                    value={newItem.location || ""}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="Depo konumu"
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Urun</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Deger</CardTitle>
            <Barcode className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalValue.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Sayisi</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kritik Stok Uyarisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name} ({item.sku})</span>
                  <Badge variant="destructive">Stok: {item.quantity} / Min: {item.minQuantity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stok Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Urun adi veya SKU ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const stockPercent = Math.min(100, (item.quantity / item.minQuantity) * 100)
              const isLowStock = item.quantity <= item.minQuantity

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-200 bg-red-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.name}</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        {isLowStock && <Badge variant="destructive" className="text-xs">Kritik Stok</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <Barcode className="inline h-3 w-3 mr-1" />
                        {item.sku} • {item.supplier} • {item.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₺{item.unitPrice.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-muted-foreground">Birim fiyat</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Progress value={stockPercent} className={isLowStock ? "bg-red-200" : ""} />
                    </div>
                    <div className="text-sm text-muted-foreground w-24 text-right">
                      Stok: {item.quantity}/{item.minQuantity}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
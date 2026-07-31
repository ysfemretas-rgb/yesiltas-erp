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
import { Plus, Package, AlertTriangle, Search, Minus, Plus as PlusIcon } from "lucide-react"

interface Consumable {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  unitPrice: number
  supplier: string
  lastRestocked: string
}

const initialConsumables: Consumable[] = [
  { id: 1, name: "Ekran Temizleyici", category: "Temizlik", currentStock: 45, minStock: 20, unit: "Adet", unitPrice: 25, supplier: "TemizlikTedarik", lastRestocked: "2024-01-10" },
  { id: 2, name: "Tornavida Seti", category: "Alet", currentStock: 8, minStock: 10, unit: "Set", unitPrice: 150, supplier: "AletTedarik", lastRestocked: "2024-01-05" },
  { id: 3, name: "Isıtıcı Tabanca", category: "Alet", currentStock: 3, minStock: 5, unit: "Adet", unitPrice: 450, supplier: "AletTedarik", lastRestocked: "2023-12-20" },
  { id: 4, name: "Ekran Yapıştırıcı", category: "Yapıştırıcı", currentStock: 12, minStock: 15, unit: "Tüp", unitPrice: 85, supplier: "KimyaTedarik", lastRestocked: "2024-01-08" },
  { id: 5, name: "Mikrofiber Bez", category: "Temizlik", currentStock: 100, minStock: 50, unit: "Adet", unitPrice: 5, supplier: "TemizlikTedarik", lastRestocked: "2024-01-12" },
  { id: 6, name: "Batarya Yapıştırıcı", category: "Yapıştırıcı", currentStock: 20, minStock: 10, unit: "Tüp", unitPrice: 65, supplier: "KimyaTedarik", lastRestocked: "2024-01-03" },
]

const categories = Array.from(new Set(initialConsumables.map(c => c.category)))

export default function ConsumablesPage() {
  const [consumables, setConsumables] = useState<Consumable[]>(initialConsumables)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<Consumable>>({
    category: "Temizlik",
    unit: "Adet",
    currentStock: 0,
    minStock: 10,
    unitPrice: 0,
  })

  const filteredItems = consumables.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = consumables.filter(item => item.currentStock <= item.minStock)
  const totalValue = consumables.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)

  const updateStock = (id: number, delta: number) => {
    setConsumables(consumables.map(item =>
      item.id === id ? { ...item, currentStock: Math.max(0, item.currentStock + delta) } : item
    ))
  }

  const handleAddItem = () => {
    if (!newItem.name) return
    const item: Consumable = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category || "Diğer",
      currentStock: Number(newItem.currentStock) || 0,
      minStock: Number(newItem.minStock) || 10,
      unit: newItem.unit || "Adet",
      unitPrice: Number(newItem.unitPrice) || 0,
      supplier: newItem.supplier || "",
      lastRestocked: new Date().toISOString().split("T")[0],
    }
    setConsumables([item, ...consumables])
    setNewItem({ category: "Temizlik", unit: "Adet", currentStock: 0, minStock: 10, unitPrice: 0 })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sarf Malzeme Takibi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Malzeme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Sarf Malzeme</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Malzeme Adı</label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Malzeme adı"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Birim</label>
                  <Input
                    value={newItem.unit || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Adet, Set, Tüp..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mevcut Stok</label>
                  <Input
                    type="number"
                    value={newItem.currentStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min. Stok</label>
                  <Input
                    type="number"
                    value={newItem.minStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Birim Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={newItem.unitPrice || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tedarikçi</label>
                <Input
                  value={newItem.supplier || ""}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Tedarikçi adı"
                />
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
            <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumables.length}</div>
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
            <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalValue.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Sayısı</CardTitle>
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
              Kritik Stok Uyarısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="destructive">Stok: {item.currentStock} {item.unit} / Min: {item.minStock}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sarf Malzeme Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Malzeme ara..."
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
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const stockPercent = Math.min(100, (item.currentStock / item.minStock) * 100)
              const isLowStock = item.currentStock <= item.minStock

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-200 bg-red-50" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.name}</span>
                        <Badge variant="outline">{item.category}</Badge>
                        {isLowStock && <Badge variant="destructive">Kritik</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.supplier} • Son güncelleme: {item.lastRestocked}
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
                        onClick={() => updateStock(item.id, -1)}
                        disabled={item.currentStock <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold w-12 text-center">{item.currentStock} {item.unit}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStock(item.id, 1)}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Progress value={stockPercent} className={isLowStock ? "bg-red-200" : ""} />
                    </div>
                    <div className="text-sm text-muted-foreground w-32 text-right">
                      Min: {item.minStock} {item.unit}
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
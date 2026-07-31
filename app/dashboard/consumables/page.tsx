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
  { id: 3, name: "Isitici Tabanca", category: "Alet", currentStock: 3, minStock: 5, unit: "Adet", unitPrice: 450, supplier: "AletTedarik", lastRestocked: "2023-12-20" },
  { id: 4, name: "Ekran Yapistirici", category: "Yapistirici", currentStock: 12, minStock: 15, unit: "Tup", unitPrice: 85, supplier: "KimyaTedarik", lastRestocked: "2024-01-08" },
  { id: 5, name: "Mikrofiber Bez", category: "Temizlik", currentStock: 100, minStock: 50, unit: "Adet", unitPrice: 5, supplier: "TemizlikTedarik", lastRestocked: "2024-01-12" },
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
      category: newItem.category || "Diger",
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Sarf Malzeme Takibi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Malzeme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Sarf Malzeme</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Malzeme Adi</label>
                <Input
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Malzeme adi"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                      <SelectItem value="Diger" className="text-white">Diger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Birim</label>
                  <Input
                    value={newItem.unit || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Adet, Set, Tup..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Mevcut Stok</label>
                  <Input
                    type="number"
                    value={newItem.currentStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Min. Stok</label>
                  <Input
                    type="number"
                    value={newItem.minStock || ""}
                    onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Birim Fiyat</label>
                  <Input
                    type="number"
                    value={newItem.unitPrice || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tedarikci</label>
                <Input
                  value={newItem.supplier || ""}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Tedarikci adi"
                  className="bg-slate-800 border-slate-700 text-white"
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
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Malzeme</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{consumables.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Deger</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₺{totalValue.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Kategori Sayisi</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-red-800 bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kritik Stok Uyarisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{item.name}</span>
                  <Badge variant="destructive">Stok: {item.currentStock} {item.unit} / Min: {item.minStock}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Sarf Malzeme Listesi</CardTitle>
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
                <SelectItem value="all" className="text-white">Tum Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const stockPercent = Math.min(100, (item.currentStock / item.minStock) * 100)
              const isLowStock = item.currentStock <= item.minStock

              return (
                <div key={item.id} className={`rounded-lg border p-4 ${isLowStock ? "border-red-700 bg-red-900/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg text-white">{item.name}</span>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">{item.category}</Badge>
                        {isLowStock && <Badge variant="destructive">Kritik</Badge>}
                      </div>
                      <div className="text-sm text-slate-400">
                        Tedarikci: {item.supplier} • Son Tedarik: {item.lastRestocked}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{item.currentStock} <span className="text-sm font-normal text-slate-400">{item.unit}</span></div>
                      <div className="text-sm text-green-400">₺{item.unitPrice} / {item.unit}</div>
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
                      className={`h-2 ${isLowStock ? "bg-red-900" : "bg-slate-700"}`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      Toplam Deger: <span className="font-semibold text-white">₺{(item.currentStock * item.unitPrice).toLocaleString("tr-TR")}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStock(item.id, -1)}
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
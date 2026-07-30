"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Search, Plus, Trash2, Edit, AlertTriangle, Package } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit_price: number
  min_stock: number
  created_at: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<InventoryItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit_price: "",
    min_stock: "5"
  })

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    category: "",
    quantity: "",
    unit_price: "",
    min_stock: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = items
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(i =>
        i.name?.toLowerCase().includes(term) ||
        i.category?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, items])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from("inventory").select("*").order("created_at", { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(form.quantity) || 0
    const price = parseFloat(form.unit_price) || 0
    const minStock = parseInt(form.min_stock) || 5

    const { error } = await supabase.from("inventory").insert([{
      name: form.name,
      category: form.category,
      quantity: qty,
      unit_price: price,
      min_stock: minStock
    }])

    if (error) {
      toast.error("Ürün eklenirken hata: " + error.message)
      return
    }

    toast.success("Ürün başarıyla eklendi")
    setShowAddModal(false)
    setForm({ name: "", category: "", quantity: "", unit_price: "", min_stock: "5" })
    loadData()
  }

  const openEditModal = (item: InventoryItem) => {
    setEditForm({
      id: item.id,
      name: item.name || "",
      category: item.category || "",
      quantity: item.quantity?.toString() || "",
      unit_price: item.unit_price?.toString() || "",
      min_stock: item.min_stock?.toString() || "5"
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(editForm.quantity) || 0
    const price = parseFloat(editForm.unit_price) || 0
    const minStock = parseInt(editForm.min_stock) || 5

    const { error } = await supabase.from("inventory").update({
      name: editForm.name,
      category: editForm.category,
      quantity: qty,
      unit_price: price,
      min_stock: minStock
    }).eq("id", editForm.id)

    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }

    toast.success("Ürün güncellendi")
    setShowEditModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("inventory").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("Ürün silindi")
    loadData()
  }

  const lowStockItems = items.filter(i => i.quantity <= (i.min_stock || 5))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stok</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Ürün</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Birim Fiyat</Label>
                <Input type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Min. Stok</Label>
                <Input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Düşük Stok Uyarısı ({lowStockItems.length} ürün)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {lowStockItems.map(item => (
                <span key={item.id} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                  {item.name} ({item.quantity} adet)
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <Input
              placeholder="Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Değer</TableHead>
                  <TableHead>Min. Stok</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const isLow = item.quantity <= (item.min_stock || 5)
                  return (
                    <TableRow key={item.id} className={isLow ? "bg-yellow-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className={isLow ? "text-yellow-700 font-bold" : ""}>{item.quantity}</TableCell>
                      <TableCell>{item.unit_price?.toLocaleString("tr-TR")} ₺</TableCell>
                      <TableCell>{(item.quantity * item.unit_price)?.toLocaleString("tr-TR")} ₺</TableCell>
                      <TableCell>{item.min_stock || 5}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ürün Adı</Label>
              <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Adet</Label>
              <Input type="number" min="0" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Birim Fiyat</Label>
              <Input type="number" value={editForm.unit_price} onChange={e => setEditForm({...editForm, unit_price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Min. Stok</Label>
              <Input type="number" value={editForm.min_stock} onChange={e => setEditForm({...editForm, min_stock: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

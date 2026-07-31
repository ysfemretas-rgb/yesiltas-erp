"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Truck, Search, Phone, Mail, MapPin, Star, Package, Save, Trash2, Edit3 } from "lucide-react"

interface Supplier {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  status: "active" | "inactive"
  totalOrders: number
  lastOrderDate: string
}

const initialSuppliers: Supplier[] = [
  { id: 1, name: "EkranTedarik A.S.", contactPerson: "Ali Yilmaz", phone: "0212 123 4567", email: "info@ekrantedarik.com", address: "Istanbul, Kadikoy", category: "Ekran", rating: 5, status: "active", totalOrders: 45, lastOrderDate: "2024-01-15" },
  { id: 2, name: "SamsungParts", contactPerson: "Mehmet Kaya", phone: "0216 234 5678", email: "satis@samsungparts.com", address: "Istanbul, Umraniye", category: "Batarya", rating: 4, status: "active", totalOrders: 32, lastOrderDate: "2024-01-10" },
  { id: 3, name: "AppleParts", contactPerson: "Ayse Demir", phone: "0232 345 6789", email: "destek@appleparts.com", address: "Izmir, Bornova", category: "Kapak", rating: 5, status: "active", totalOrders: 28, lastOrderDate: "2024-01-08" },
  { id: 4, name: "GenelTedarik", contactPerson: "Fatma Sahin", phone: "0312 456 7890", email: "iletisim@geneltedarik.com", address: "Ankara, Cankaya", category: "Port", rating: 3, status: "inactive", totalOrders: 15, lastOrderDate: "2023-12-20" },
  { id: 5, name: "KimyaTedarik", contactPerson: "Veli Can", phone: "0212 567 8901", email: "siparis@kimyatedarik.com", address: "Istanbul, Maltepe", category: "Yapistirici", rating: 4, status: "active", totalOrders: 22, lastOrderDate: "2024-01-12" },
]

const categories = Array.from(new Set(initialSuppliers.map(s => s.category)))

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    category: "Ekran",
    rating: 5,
    status: "active",
    totalOrders: 0,
  })

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}`}
      />
    ))
  }

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? <Badge className="bg-green-900/50 text-green-300 border-green-700">Aktif</Badge>
      : <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || s.category === filterCategory
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const activeCount = suppliers.filter(s => s.status === "active").length
  const totalOrders = suppliers.reduce((sum, s) => sum + s.totalOrders, 0)

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.contactPerson) return
    const supplier: Supplier = {
      id: Date.now(),
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson,
      phone: newSupplier.phone || "",
      email: newSupplier.email || "",
      address: newSupplier.address || "",
      category: newSupplier.category || "Diger",
      rating: Number(newSupplier.rating) || 5,
      status: "active",
      totalOrders: 0,
      lastOrderDate: new Date().toISOString().split("T")[0],
    }
    setSuppliers([supplier, ...suppliers])
    setNewSupplier({ category: "Ekran", rating: 5, status: "active", totalOrders: 0 })
    setIsDialogOpen(false)
  }

  const handleEditSupplier = () => {
    if (!editingSupplier || !newSupplier.name || !newSupplier.contactPerson) return
    setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...newSupplier, rating: Number(newSupplier.rating) || s.rating } : s))
    setIsEditOpen(false)
    setEditingSupplier(null)
  }

  const handleDeleteSupplier = (id: number) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setNewSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      category: supplier.category,
      rating: supplier.rating,
      status: supplier.status
    })
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Tedarikci Yonetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tedarikci
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Tedarikci Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Firma Adi</label>
                <Input
                  value={newSupplier.name || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Firma adi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yetkili Kisi</label>
                <Input
                  value={newSupplier.contactPerson || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input
                    value={newSupplier.phone || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="0212 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">E-posta</label>
                  <Input
                    type="email"
                    value={newSupplier.email || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="ornek@firma.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newSupplier.category}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, category: value })}
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
                  <label className="text-sm font-medium text-slate-300">Degerlendirme (1-5)</label>
                  <Select
                    value={String(newSupplier.rating)}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, rating: Number(value) })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="5" className="text-white">5 - Mukemmel</SelectItem>
                      <SelectItem value="4" className="text-white">4 - Cok Iyi</SelectItem>
                      <SelectItem value="3" className="text-white">3 - Iyi</SelectItem>
                      <SelectItem value="2" className="text-white">2 - Orta</SelectItem>
                      <SelectItem value="1" className="text-white">1 - Kotu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Adres</label>
                <Input
                  value={newSupplier.address || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Sehir, Ilce"
                />
              </div>
              <Button onClick={handleAddSupplier} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Tedarikci</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aktif Tedarikci</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Siparis</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Kategori</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Tedarikci Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Firma veya yetkili ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tum Kategoriler</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tumu</SelectItem>
                  <SelectItem value="active" className="text-white">Aktif</SelectItem>
                  <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg text-white">{supplier.name}</span>
                      {getStatusBadge(supplier.status)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <span className="font-medium text-slate-300">Yetkili:</span> {supplier.contactPerson}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRatingStars(supplier.rating)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {supplier.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {supplier.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {supplier.address}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <Badge variant="outline" className="border-slate-600 text-slate-400">{supplier.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm bg-slate-900 p-2 rounded border border-slate-700">
                  <span className="text-slate-400">Toplam Siparis: <span className="font-semibold text-white">{supplier.totalOrders}</span></span>
                  <span className="text-slate-400">Son Siparis: <span className="font-semibold text-white">{supplier.lastOrderDate}</span></span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(supplier)} className="border-slate-600 text-slate-300 hover:text-white">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSupplier(supplier.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Tedarikci Duzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Firma Adi</label>
              <Input value={newSupplier.name || ""} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Yetkili Kisi</label>
              <Input value={newSupplier.contactPerson || ""} onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telefon</label>
                <Input value={newSupplier.phone || ""} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-posta</label>
                <Input value={newSupplier.email || ""} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <Button onClick={handleEditSupplier}>
              <Save className="mr-2 h-4 w-4" />
              Guncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
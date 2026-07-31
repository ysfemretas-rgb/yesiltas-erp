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
import { Plus, Truck, Search, Phone, Mail, MapPin, Star, Package } from "lucide-react"

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
  { id: 1, name: "EkranTedarik A.Ş.", contactPerson: "Ali Yılmaz", phone: "0212 123 4567", email: "info@ekrantedarik.com", address: "İstanbul, Kadıköy", category: "Ekran", rating: 5, status: "active", totalOrders: 45, lastOrderDate: "2024-01-15" },
  { id: 2, name: "SamsungParts", contactPerson: "Mehmet Kaya", phone: "0216 234 5678", email: "satis@samsungparts.com", address: "İstanbul, Ümraniye", category: "Batarya", rating: 4, status: "active", totalOrders: 32, lastOrderDate: "2024-01-10" },
  { id: 3, name: "AppleParts", contactPerson: "Ayşe Demir", phone: "0232 345 6789", email: "destek@appleparts.com", address: "İzmir, Bornova", category: "Kapak", rating: 5, status: "active", totalOrders: 28, lastOrderDate: "2024-01-08" },
  { id: 4, name: "GenelTedarik", contactPerson: "Fatma Şahin", phone: "0312 456 7890", email: "iletisim@geneltedarik.com", address: "Ankara, Çankaya", category: "Port", rating: 3, status: "inactive", totalOrders: 15, lastOrderDate: "2023-12-20" },
  { id: 5, name: "KimyaTedarik", contactPerson: "Veli Can", phone: "0212 567 8901", email: "siparis@kimyatedarik.com", address: "İstanbul, Maltepe", category: "Yapıştırıcı", rating: 4, status: "active", totalOrders: 22, lastOrderDate: "2024-01-12" },
]

const categories = Array.from(new Set(initialSuppliers.map(s => s.category)))

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
        className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ))
  }

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      : <Badge variant="secondary">Pasif</Badge>
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
      category: newSupplier.category || "Diğer",
      rating: Number(newSupplier.rating) || 5,
      status: "active",
      totalOrders: 0,
      lastOrderDate: new Date().toISOString().split("T")[0],
    }
    setSuppliers([supplier, ...suppliers])
    setNewSupplier({ category: "Ekran", rating: 5, status: "active", totalOrders: 0 })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tedarikçi Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tedarikçi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Firma Adı</label>
                <Input
                  value={newSupplier.name || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Firma adı"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Yetkili Kişi</label>
                <Input
                  value={newSupplier.contactPerson || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={newSupplier.phone || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="0212 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={newSupplier.email || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="ornek@firma.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select
                    value={newSupplier.category}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, category: value })}
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
                  <label className="text-sm font-medium">Değerlendirme (1-5)</label>
                  <Select
                    value={String(newSupplier.rating)}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, rating: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Mükemmel</SelectItem>
                      <SelectItem value="4">4 - Çok İyi</SelectItem>
                      <SelectItem value="3">3 - İyi</SelectItem>
                      <SelectItem value="2">2 - Orta</SelectItem>
                      <SelectItem value="1">1 - Kötü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adres</label>
                <Input
                  value={newSupplier.address || ""}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Şehir, İlçe"
                />
              </div>
              <Button onClick={handleAddSupplier} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tedarikçi</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Tedarikçi</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Firma veya yetkili ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">{supplier.name}</span>
                      {getStatusBadge(supplier.status)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Yetkili:</span> {supplier.contactPerson}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRatingStars(supplier.rating)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
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
                    <Badge variant="outline">{supplier.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                  <span>Toplam Sipariş: <span className="font-semibold">{supplier.totalOrders}</span></span>
                  <span>Son Sipariş: <span className="font-semibold">{supplier.lastOrderDate}</span></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
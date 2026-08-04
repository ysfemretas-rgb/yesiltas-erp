"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Truck, Search, Phone, Mail, MapPin, Star, Package, Save, Trash2, Edit3, X, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

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

const CATEGORIES = ["Ekran", "Batarya", "Kapak", "Port", "Yapıştırıcı", "Diğer"]

const getInitialSuppliers = (): Supplier[] => [
  { id: 1, name: "EkranTedarik A.Ş.", contactPerson: "Ali Yılmaz", phone: "0212 123 4567", email: "info@ekrantedarik.com", address: "İstanbul, Kadıköy", category: "Ekran", rating: 5, status: "active", totalOrders: 45, lastOrderDate: "2024-01-15" },
  { id: 2, name: "SamsungParts", contactPerson: "Mehmet Kaya", phone: "0216 234 5678", email: "satis@samsungparts.com", address: "İstanbul, Ümraniye", category: "Batarya", rating: 4, status: "active", totalOrders: 32, lastOrderDate: "2024-01-10" },
  { id: 3, name: "AppleParts", contactPerson: "Ayşe Demir", phone: "0232 345 6789", email: "destek@appleparts.com", address: "İzmir, Bornova", category: "Kapak", rating: 5, status: "active", totalOrders: 28, lastOrderDate: "2024-01-08" },
  { id: 4, name: "GenelTedarik", contactPerson: "Fatma Şahin", phone: "0312 456 7890", email: "iletisim@geneltedarik.com", address: "Ankara, Çankaya", category: "Port", rating: 3, status: "inactive", totalOrders: 15, lastOrderDate: "2023-12-20" },
  { id: 5, name: "KimyaTedarik", contactPerson: "Veli Can", phone: "0212 567 8901", email: "siparis@kimyatedarik.com", address: "İstanbul, Maltepe", category: "Yapıştırıcı", rating: 4, status: "active", totalOrders: 22, lastOrderDate: "2024-01-12" },
]

export default function SuppliersPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  const [isLoaded, setIsLoaded] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    category: "Ekran",
    rating: 5,
    status: "active",
    totalOrders: 0,
  })

  // localStorage'dan yükle

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const userStr = localStorage.getItem("yt_user")
      if (!userStr) {
        setAuthorized(false)
        setChecking(false)
        return
      }
      const user = JSON.parse(userStr)
      if (user.role === "admin") {
        setAuthorized(true)
      } else if (user.permissions && Array.isArray(user.permissions) && user.permissions.includes("Tedarikçiler")) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }
    } catch (e) {
      console.error("Permission guard error:", e)
      setAuthorized(false)
    }
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!authorized && !checking) {
      router.push("/dashboard")
    }
  }, [authorized, checking, router])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yt_suppliers")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSuppliers(parsed)
        } else {
          const initial = getInitialSuppliers()
          setSuppliers(initial)
          localStorage.setItem("yt_suppliers", JSON.stringify(initial))
        }
      } else {
        const initial = getInitialSuppliers()
        setSuppliers(initial)
        localStorage.setItem("yt_suppliers", JSON.stringify(initial))
      }
    } catch {
      const initial = getInitialSuppliers()
      setSuppliers(initial)
      localStorage.setItem("yt_suppliers", JSON.stringify(initial))
    }
    setIsLoaded(true)
  }, [])

  // localStorage'a kaydet
  useEffect(() => {

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

    if (isLoaded && suppliers.length > 0) {
      localStorage.setItem("yt_suppliers", JSON.stringify(suppliers))
    }
  }, [suppliers, isLoaded])

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
      />
    ))
  }

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Aktif</Badge>
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
  const totalOrders = suppliers.reduce((sum, s) => sum + (Number(s.totalOrders) || 0), 0)

  const handleAddSupplier = () => {
    if (!newSupplier.name?.trim() || !newSupplier.contactPerson?.trim()) {
      alert("Lütfen firma adı ve yetkili kişi alanlarını doldurun!")
      return
    }
    const supplier: Supplier = {
      id: Date.now(),
      name: newSupplier.name.trim(),
      contactPerson: newSupplier.contactPerson.trim(),
      phone: newSupplier.phone?.trim() || "",
      email: newSupplier.email?.trim() || "",
      address: newSupplier.address?.trim() || "",
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

  const handleEditSupplier = () => {
    if (!editingSupplier) return
    const name = newSupplier.name?.trim()
    const contactPerson = newSupplier.contactPerson?.trim()
    if (!name || !contactPerson) {
      alert("Lütfen firma adı ve yetkili kişi alanlarını doldurun!")
      return
    }
    setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? {
      ...s,
      name: name,
      contactPerson: contactPerson,
      phone: newSupplier.phone?.trim() || s.phone,
      email: newSupplier.email?.trim() || s.email,
      address: newSupplier.address?.trim() || s.address,
      category: newSupplier.category || s.category,
      rating: Number(newSupplier.rating) || s.rating,
      status: (newSupplier.status as "active" | "inactive") || s.status,
    } : s))
    setIsEditOpen(false)
    setEditingSupplier(null)
  }

  const handleDeleteSupplier = (id: number) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
    setShowDeleteConfirm(null)
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

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\s/g, "").replace(/^0/, "+90")
    const message = `Merhaba ${name}, Yeşiltaş Teknoloji'den iletişim:`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`
  }

  const handleMap = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank")
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Başlık */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Tedarikçi Yönetimi</h1>
            <p className="text-slate-400 mt-1">Tedarikçi firmalarını yönetin</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Tedarikçi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Yeni Tedarikçi Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Firma Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={newSupplier.name || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Firma adı"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Yetkili Kişi <span className="text-red-400">*</span></label>
                  <Input
                    value={newSupplier.contactPerson || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Telefon</label>
                    <Input
                      value={newSupplier.phone || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="0212 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">E-posta</label>
                    <Input
                      type="email"
                      value={newSupplier.email || ""}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
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
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Değerlendirme (1-5)</label>
                    <Select
                      value={String(newSupplier.rating)}
                      onValueChange={(value) => setNewSupplier({ ...newSupplier, rating: Number(value) })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="5" className="text-white">5 - Mükemmel</SelectItem>
                        <SelectItem value="4" className="text-white">4 - Çok İyi</SelectItem>
                        <SelectItem value="3" className="text-white">3 - İyi</SelectItem>
                        <SelectItem value="2" className="text-white">2 - Orta</SelectItem>
                        <SelectItem value="1" className="text-white">1 - Kötü</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Adres</label>
                  <Input
                    value={newSupplier.address || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Şehir, İlçe"
                  />
                </div>
                <Button onClick={handleAddSupplier} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Tedarikçi</CardTitle>
              <Truck className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{suppliers.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Aktif Tedarikçi</CardTitle>
              <Truck className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Sipariş</CardTitle>
              <Package className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Kategori</CardTitle>
              <Truck className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{CATEGORIES.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tedarikçi Listesi */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tedarikçi Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Firma veya yetkili ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">Tüm Kategoriler</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">Tümü</SelectItem>
                    <SelectItem value="active" className="text-white">Aktif</SelectItem>
                    <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="rounded-lg border border-slate-600 bg-slate-700/50 p-4 hover:bg-slate-700 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-lg text-white">{supplier.name}</span>
                          {getStatusBadge(supplier.status)}
                          <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">{supplier.category}</Badge>
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
                        <span className="text-slate-300">{supplier.totalOrders} sipariş</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-slate-800 p-2 rounded border border-slate-600 mb-2">
                      <span className="text-slate-400">Son Sipariş: <span className="font-semibold text-white">{supplier.lastOrderDate}</span></span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600" onClick={() => handleCall(supplier.phone)}>
                        <Phone className="h-3 w-3 mr-1" /> Ara
                      </Button>
                      <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30" onClick={() => handleWhatsApp(supplier.phone, supplier.contactPerson)}>
                        <span className="text-xs font-bold mr-1">W</span> Mesaj
                      </Button>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30" onClick={() => handleMap(supplier.address)}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Harita
                      </Button>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30" onClick={() => openEdit(supplier)}>
                        <Edit3 className="h-3 w-3 mr-1" /> Düzenle
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/30" onClick={() => setShowDeleteConfirm(supplier.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Sil
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">Tedarikçi bulunamadı.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Düzenleme Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Tedarikçi Düzenle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Firma Adı <span className="text-red-400">*</span></label>
                <Input value={newSupplier.name || ""} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yetkili Kişi <span className="text-red-400">*</span></label>
                <Input value={newSupplier.contactPerson || ""} onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input value={newSupplier.phone || ""} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">E-posta</label>
                  <Input value={newSupplier.email || ""} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select value={newSupplier.category} onValueChange={(value) => setNewSupplier({...newSupplier, category: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Değerlendirme</label>
                  <Select value={String(newSupplier.rating)} onValueChange={(value) => setNewSupplier({...newSupplier, rating: Number(value)})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="5" className="text-white">5 - Mükemmel</SelectItem>
                      <SelectItem value="4" className="text-white">4 - Çok İyi</SelectItem>
                      <SelectItem value="3" className="text-white">3 - İyi</SelectItem>
                      <SelectItem value="2" className="text-white">2 - Orta</SelectItem>
                      <SelectItem value="1" className="text-white">1 - Kötü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Adres</label>
                <Input value={newSupplier.address || ""} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Durum</label>
                <Select value={newSupplier.status} onValueChange={(value: "active" | "inactive") => setNewSupplier({...newSupplier, status: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="active" className="text-white">Aktif</SelectItem>
                    <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditSupplier} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Güncelle
                </Button>
                <Button onClick={() => setIsEditOpen(false)} variant="outline" className="border-slate-600 text-slate-300">
                  <X className="mr-2 h-4 w-4" />
                  İptal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        {showDeleteConfirm && (
          <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">⚠️ Tedarikçi Sil</DialogTitle>
              </DialogHeader>
              <p className="text-slate-300 py-4">
                <strong>{suppliers.find(s => s.id === showDeleteConfirm)?.name}</strong> isimli tedarikçiyi silmek istediğinize emin misiniz?
                <br />
                <span className="text-red-400 text-sm">Bu işlem geri alınamaz!</span>
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleDeleteSupplier(showDeleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Evet, Sil
                </Button>
                <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="border-slate-600 text-slate-300">
                  İptal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
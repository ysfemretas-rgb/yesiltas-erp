"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Plus, Users, Search, Phone, Mail, MapPin, CreditCard, History, Trash2, Edit3, Save, MessageCircle, X } from "lucide-react"

interface Debt {
  id: number
  amount: number
  description: string
  date: string
  status: "paid" | "unpaid"
  source?: "repair" | "sale" | "manual"
  paidAmount?: number
}

interface Customer {
  id: number
  customerId: string
  firstName: string
  lastName: string
  name: string
  phone: string
  phone2: string
  email: string
  address: string
  city: string
  debts: Debt[]
  totalDebt: number
  totalRepairs: number
  lastVisit: string
  status: "active" | "inactive"
  notes: string
}

interface Repair {
  id: number
  customerId?: number
  customerName: string
  device: string
  brand: string
  cost: number
  paid: number
  remaining: number
  status: string
  createdAt: string
}

interface Sale {
  id: number
  customerId: number
  customerName: string
  totalAmount: number
  paid: number
  remaining: number
  date: string
  items: { name: string; quantity: number }[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDebtOpen, setIsDebtOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    status: "active",
    city: "Istanbul",
    debts: [],
    totalDebt: 0,
    totalRepairs: 0,
  })
  const [newDebt, setNewDebt] = useState({ amount: 0, description: "" })
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [whatsappType, setWhatsappType] = useState<"simple" | "detailed">("simple")

  // Load data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedCustomers = localStorage.getItem("yt_customers")
      const savedRepairs = localStorage.getItem("yt_repairs")
      const savedSales = localStorage.getItem("yt_sales")

      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers)
        if (Array.isArray(parsed)) {
          // Eski formatı yeni formata çevir
          const migrated = parsed.map((c: any) => ({
            ...c,
            firstName: c.firstName || c.name?.split(" ")[0] || "",
            lastName: c.lastName || c.name?.split(" ").slice(1).join(" ") || "",
            name: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          }))
          setCustomers(migrated)
        }
      }

      if (savedRepairs) {
        const parsed = JSON.parse(savedRepairs)
        if (Array.isArray(parsed)) setRepairs(parsed)
      }

      if (savedSales) {
        const parsed = JSON.parse(savedSales)
        if (Array.isArray(parsed)) setSales(parsed)
      }
    } catch (e) {
      console.error("Load error:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save customers to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_customers", JSON.stringify(customers))
  }, [customers, isLoaded])

  // Calculate customer debts from repairs and sales
  const getCustomerTransactions = (customerId: number) => {
    const customerRepairs = repairs.filter(r => r.customerId === customerId || r.customerName === customers.find(c => c.id === customerId)?.name)
    const customerSales = sales.filter(s => s.customerId === customerId || s.customerName === customers.find(c => c.id === customerId)?.name)

    const transactions: {
      type: "repair" | "sale"
      id: number
      description: string
      total: number
      paid: number
      remaining: number
      date: string
    }[] = []

    customerRepairs.forEach(r => {
      if (r.remaining > 0 || r.paid > 0) {
        transactions.push({
          type: "repair",
          id: r.id,
          description: `${r.brand} ${r.device} - Tamir`,
          total: r.cost,
          paid: r.paid || 0,
          remaining: r.remaining || 0,
          date: r.createdAt,
        })
      }
    })

    customerSales.forEach(s => {
      if (s.remaining > 0 || s.paid > 0) {
        transactions.push({
          type: "sale",
          id: s.id,
          description: `Satış: ${s.items?.map(i => i.name).join(", ") || "Ürün"}`,
          total: s.totalAmount,
          paid: s.paid || 0,
          remaining: s.remaining || 0,
          date: s.date,
        })
      }
    })

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""} ${c.name || ""}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.customerId && c.customerId.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalDebt = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0)
  const activeCount = customers.filter(c => c.status === "active").length
  const debtCount = customers.filter(c => (c.totalDebt || 0) > 0).length

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const handleAddCustomer = () => {
    const firstName = newCustomer.firstName || ""
    const lastName = newCustomer.lastName || ""
    const fullName = `${firstName} ${lastName}`.trim()

    if (!firstName || !lastName || !newCustomer.phone) return

    const customer: Customer = {
      id: Date.now(),
      customerId: `MUS-${String(customers.length + 1).padStart(3, "0")}`,
      firstName,
      lastName,
      name: fullName,
      phone: newCustomer.phone,
      phone2: newCustomer.phone2 || "",
      email: newCustomer.email || "",
      address: newCustomer.address || "",
      city: newCustomer.city || "Istanbul",
      debts: [],
      totalDebt: 0,
      totalRepairs: 0,
      lastVisit: new Date().toISOString().split("T")[0],
      status: "active",
      notes: newCustomer.notes || "",
    }
    setCustomers([customer, ...customers])
    setNewCustomer({ status: "active", city: "Istanbul", debts: [], totalDebt: 0, totalRepairs: 0 })
    setIsDialogOpen(false)
  }

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setNewCustomer({
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: customer.name,
      phone: customer.phone,
      phone2: customer.phone2,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      notes: customer.notes,
    })
    setIsEditOpen(true)
  }

  const handleEditCustomer = () => {
    if (!selectedCustomer) return
    const firstName = newCustomer.firstName || selectedCustomer.firstName
    const lastName = newCustomer.lastName || selectedCustomer.lastName
    const fullName = `${firstName} ${lastName}`.trim()

    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id 
        ? { 
            ...c, 
            firstName,
            lastName,
            name: fullName,
            phone: newCustomer.phone || c.phone, 
            phone2: newCustomer.phone2 || "", 
            email: newCustomer.email || "", 
            address: newCustomer.address || "", 
            city: newCustomer.city || c.city, 
            notes: newCustomer.notes || "" 
          }
        : c
    ))
    setIsEditOpen(false)
    setSelectedCustomer(null)
  }

  const handleDeleteCustomer = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id))
  }

  const openDebtDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDebtOpen(true)
  }

  const openDetailDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailOpen(true)
  }

  const openWhatsAppDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setWhatsappType("simple")
    setIsWhatsAppOpen(true)
  }

  const sendWhatsApp = (type: "simple" | "detailed") => {
    if (!selectedCustomer || !selectedCustomer.phone) {
      alert("Müşteri telefon numarası yok!")
      return
    }

    const phone = String(selectedCustomer.phone).replace(/\D/g, "")
    if (!phone || phone.length < 10) {
      alert("Geçersiz telefon numarası!")
      return
    }

    const transactions = getCustomerTransactions(selectedCustomer.id)
    const totalRemaining = transactions.reduce((sum, t) => sum + t.remaining, 0)

    let message = `Merhaba ${selectedCustomer.firstName || selectedCustomer.name},%0A%0A`
    message += `Yeşiltaş Teknoloji'den bilgilendirme mesajıdır.%0A%0A`

    if (type === "simple") {
      // Sadece toplam borç
      if (totalRemaining > 0) {
        message += `Toplam Borcunuz: ₺${totalRemaining.toLocaleString("tr-TR")}%0A`
        message += `Lütfen en kısa sürede ödeme yapınız.%0A`
      } else {
        message += `Borcunuz bulunmamaktadır. Teşekkür ederiz!%0A`
      }
    } else {
      // Detaylı borç listesi
      if (transactions.length > 0) {
        message += `İşlem Detaylarınız:%0A%0A`
        transactions.forEach(t => {
          message += `📌 ${t.description}%0A`
          message += `   Toplam: ₺${t.total.toLocaleString("tr-TR")}%0A`
          message += `   Alınan: ₺${t.paid.toLocaleString("tr-TR")}%0A`
          message += `   Kalan: ₺${t.remaining.toLocaleString("tr-TR")}%0A`
          message += `   Tarih: ${t.date}%0A%0A`
        })
        if (totalRemaining > 0) {
          message += `Toplam Kalan Borç: ₺${totalRemaining.toLocaleString("tr-TR")}%0A`
        }
      } else {
        message += `Borcunuz bulunmamaktadır.%0A`
      }
    }

    message += `%0ATeşekkür ederiz, iyi günler dileriz!%0AYeşiltaş Teknoloji`

    const cleanPhone = phone.startsWith("0") ? phone.substring(1) : phone
    window.open(`https://wa.me/90${cleanPhone}?text=${message}`, "_blank")
    setIsWhatsAppOpen(false)
  }

  const handleAddDebt = () => {
    if (!selectedCustomer || !newDebt.amount || !newDebt.description) return
    const debt: Debt = {
      id: Date.now(),
      amount: Number(newDebt.amount),
      description: newDebt.description,
      date: new Date().toISOString().split("T")[0],
      status: "unpaid",
      source: "manual",
    }
    setCustomers(customers.map(c =>
      c.id === selectedCustomer.id
        ? { ...c, debts: [...(c.debts || []), debt], totalDebt: (c.totalDebt || 0) + debt.amount }
        : c
    ))
    setNewDebt({ amount: 0, description: "" })
    setIsDebtOpen(false)
  }

  const handlePayDebt = (customerId: number, debtId: number) => {
    setCustomers(customers.map(c => {
      if (c.id !== customerId) return c
      const updatedDebts = (c.debts || []).map(d => d.id === debtId ? { ...d, status: "paid" as const } : d)
      const paidAmount = (c.debts || []).find(d => d.id === debtId)?.amount || 0
      return { ...c, debts: updatedDebts, totalDebt: Math.max(0, (c.totalDebt || 0) - paidAmount) }
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Müşteri Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Müşteri
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Müşteri Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ad *</label>
                  <Input
                    value={newCustomer.firstName || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    placeholder="Ahmet"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Soyad *</label>
                  <Input
                    value={newCustomer.lastName || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    placeholder="Yılmaz"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon *</label>
                  <Input
                    value={newCustomer.phone || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="0555 123 4567"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon 2</label>
                  <Input
                    value={newCustomer.phone2 || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone2: e.target.value })}
                    placeholder="0555 987 6543"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-posta</label>
                <Input
                  type="email"
                  value={newCustomer.email || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Şehir</label>
                  <Select
                    value={newCustomer.city || "Istanbul"}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, city: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Istanbul" className="text-white">İstanbul</SelectItem>
                      <SelectItem value="Ankara" className="text-white">Ankara</SelectItem>
                      <SelectItem value="Izmir" className="text-white">İzmir</SelectItem>
                      <SelectItem value="Bursa" className="text-white">Bursa</SelectItem>
                      <SelectItem value="Antalya" className="text-white">Antalya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Adres</label>
                  <Input
                    value={newCustomer.address || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="İlçe, Semt"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={newCustomer.notes || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Müşteri hakkında not..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button 
                onClick={handleAddCustomer} 
                disabled={!newCustomer.firstName || !newCustomer.lastName || !newCustomer.phone}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Müşteri Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aktif Müşteri</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Borçlu Müşteri</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{debtCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Borç</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Müşteri ara (isim, telefon, ID)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Tümü</SelectItem>
                <SelectItem value="active" className="text-white">Aktif</SelectItem>
                <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => openDetailDialog(customer)}>
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg text-white">{customer.name}</span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">{customer.customerId}</Badge>
                    {customer.status === "active" ? (
                      <Badge className="bg-green-900/50 text-green-300 border-green-700">Aktif</Badge>
                    ) : (
                      <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email || "-"}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {customer.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <History className="h-3 w-3" />
                      Son ziyaret: {customer.lastVisit}
                    </div>
                  </div>
                  {(customer.totalDebt || 0) > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-red-400 font-medium">Borç: {formatCurrency(customer.totalDebt)}</span>
                      <span className="text-slate-500 ml-2">({(customer.debts || []).length} kayıt)</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => openWhatsAppDialog(customer)} className="border-green-600 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDebtDialog(customer)} className="border-slate-600 text-slate-300 hover:text-white">
                    <CreditCard className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(customer)} className="border-slate-600 text-slate-300 hover:text-white">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCustomer(customer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Müşteri Detayı - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-slate-400">Telefon:</div>
                  <div className="text-white">{selectedCustomer.phone}</div>
                  {selectedCustomer.phone2 && (
                    <>
                      <div className="text-slate-400">Telefon 2:</div>
                      <div className="text-white">{selectedCustomer.phone2}</div>
                    </>
                  )}
                  <div className="text-slate-400">E-posta:</div>
                  <div className="text-white">{selectedCustomer.email || "-"}</div>
                  <div className="text-slate-400">Şehir:</div>
                  <div className="text-white">{selectedCustomer.city}</div>
                  <div className="text-slate-400">Adres:</div>
                  <div className="text-white">{selectedCustomer.address || "-"}</div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">İşlem Geçmişi</h3>
                  {(() => {
                    const transactions = getCustomerTransactions(selectedCustomer.id)
                    if (transactions.length === 0) {
                      return <p className="text-slate-500">Henüz işlem bulunmuyor.</p>
                    }
                    return (
                      <div className="space-y-2">
                        {transactions.map(t => (
                          <div key={`${t.type}-${t.id}`} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium text-white">{t.description}</div>
                                <div className="text-xs text-slate-400">{t.date} • {t.type === "repair" ? "Tamir" : "Satış"}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-white">Toplam: {formatCurrency(t.total)}</div>
                                <div className="text-xs text-green-400">Alınan: {formatCurrency(t.paid)}</div>
                                {t.remaining > 0 && (
                                  <div className="text-xs text-red-400">Kalan: {formatCurrency(t.remaining)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-slate-700">
                          <span className="text-sm font-medium text-slate-300">Toplam Kalan Borç:</span>
                          <span className="text-sm font-bold text-red-400">
                            {formatCurrency(transactions.reduce((sum, t) => sum + t.remaining, 0))}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {(selectedCustomer.debts || []).length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Manuel Borçlar</h3>
                    <div className="space-y-2">
                      {selectedCustomer.debts.map(debt => (
                        <div key={debt.id} className="flex justify-between p-2 bg-slate-800 rounded-lg">
                          <div>
                            <div className="text-sm text-white">{debt.description}</div>
                            <div className="text-xs text-slate-400">{debt.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{formatCurrency(debt.amount)}</span>
                            {debt.status === "unpaid" ? (
                              <Badge className="bg-red-900/50 text-red-300">Ödenmedi</Badge>
                            ) : (
                              <Badge className="bg-green-900/50 text-green-300">Ödendi</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">WhatsApp Mesajı - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-400">Göndermek istediğiniz mesaj tipini seçin:</p>
            <div className="space-y-2">
              <Button 
                onClick={() => sendWhatsApp("simple")}
                className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-green-400" />
                <div className="text-left">
                  <div className="text-sm">Sadece Borç Özeti</div>
                  <div className="text-xs text-slate-400">Toplam borç tutarı gönderilir</div>
                </div>
              </Button>
              <Button 
                onClick={() => sendWhatsApp("detailed")}
                className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-blue-400" />
                <div className="text-left">
                  <div className="text-sm">Detaylı Borç Listesi</div>
                  <div className="text-xs text-slate-400">Tüm işlemler ve kalan borçlar gönderilir</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Müşteri Düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ad</label>
                <Input value={newCustomer.firstName || ""} onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Soyad</label>
                <Input value={newCustomer.lastName || ""} onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telefon</label>
                <Input value={newCustomer.phone || ""} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telefon 2</label>
                <Input value={newCustomer.phone2 || ""} onChange={(e) => setNewCustomer({...newCustomer, phone2: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">E-posta</label>
              <Input value={newCustomer.email || ""} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button onClick={handleEditCustomer} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="mr-2 h-4 w-4" />
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={isDebtOpen} onOpenChange={setIsDebtOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Borç Yönetimi - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mevcut Borçlar</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedCustomer?.debts || []).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                    <div>
                      <div className="text-sm text-white">{debt.description}</div>
                      <div className="text-xs text-slate-400">{debt.date} • {formatCurrency(debt.amount)}</div>
                    </div>
                    {debt.status === "unpaid" ? (
                      <Button size="sm" onClick={() => handlePayDebt(selectedCustomer!.id, debt.id)} className="bg-emerald-600 hover:bg-emerald-700">
                        Öde
                      </Button>
                    ) : (
                      <Badge className="bg-green-900/50 text-green-300 border-green-700">Ödenmiş</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <label className="text-sm font-medium text-slate-300">Yeni Borç Ekle</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  placeholder="Tutar"
                  value={newDebt.amount || ""}
                  onChange={(e) => setNewDebt({...newDebt, amount: Number(e.target.value)})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Açıklama"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({...newDebt, description: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleAddDebt} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" disabled={!newDebt.amount || !newDebt.description}>
                <Plus className="mr-2 h-4 w-4" />
                Borç Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
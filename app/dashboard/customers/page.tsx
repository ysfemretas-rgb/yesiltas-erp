"use client"

import { useState } from "react"
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
import { Plus, Users, Search, Phone, Mail, MapPin, CreditCard, History, Trash2, Edit3, Save, UserPlus } from "lucide-react"

interface Debt {
  id: number
  amount: number
  description: string
  date: string
  status: "paid" | "unpaid"
}

interface Customer {
  id: number
  customerId: string
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

const initialCustomers: Customer[] = [
  { id: 1, customerId: "MUS-001", name: "Ahmet Yilmaz", phone: "0555 123 4567", phone2: "", email: "ahmet@email.com", address: "Kadikoy, Istanbul", city: "Istanbul", debts: [{ id: 1, amount: 2500, description: "iPhone 14 Pro ekran degisimi", date: "2024-01-15", status: "unpaid" }], totalDebt: 2500, totalRepairs: 5, lastVisit: "2024-07-28", status: "active", notes: "Daimi musteri" },
  { id: 2, customerId: "MUS-002", name: "Mehmet Kaya", phone: "0555 234 5678", phone2: "0555 876 5432", email: "mehmet@email.com", address: "Umraniye, Istanbul", city: "Istanbul", debts: [], totalDebt: 0, totalRepairs: 3, lastVisit: "2024-07-25", status: "active", notes: "" },
  { id: 3, customerId: "MUS-003", name: "Ayse Demir", phone: "0555 345 6789", phone2: "", email: "ayse@email.com", address: "Bornova, Izmir", city: "Izmir", debts: [{ id: 2, amount: 1800, description: "Samsung S23 batarya", date: "2024-01-10", status: "unpaid" }, { id: 3, amount: 3200, description: "iPad Air 5 ekran", date: "2024-01-05", status: "unpaid" }], totalDebt: 5000, totalRepairs: 8, lastVisit: "2024-07-20", status: "active", notes: "VIP musteri" },
  { id: 4, customerId: "MUS-004", name: "Fatma Sahin", phone: "0555 456 7890", phone2: "", email: "fatma@email.com", address: "Cankaya, Ankara", city: "Ankara", debts: [], totalDebt: 0, totalRepairs: 2, lastVisit: "2024-07-15", status: "inactive", notes: "" },
  { id: 5, customerId: "MUS-005", name: "Ali Veli", phone: "0555 567 8901", phone2: "", email: "ali@email.com", address: "Maltepe, Istanbul", city: "Istanbul", debts: [{ id: 4, amount: 900, description: "Sarj portu degisimi", date: "2024-01-08", status: "unpaid" }], totalDebt: 900, totalRepairs: 4, lastVisit: "2024-07-10", status: "active", notes: "" },
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDebtOpen, setIsDebtOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    status: "active",
    city: "Istanbul",
    debts: [],
    totalDebt: 0,
    totalRepairs: 0,
  })
  const [newDebt, setNewDebt] = useState({ amount: 0, description: "" })

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0)
  const activeCount = customers.filter(c => c.status === "active").length
  const debtCount = customers.filter(c => c.totalDebt > 0).length

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return
    const customer: Customer = {
      id: Date.now(),
      customerId: `MUS-${String(customers.length + 1).padStart(3, "0")}`,
      name: newCustomer.name,
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
    
    const name = newCustomer.name || selectedCustomer.name
    const phone = newCustomer.phone || selectedCustomer.phone
    
    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id 
        ? { ...c, name, phone, phone2: newCustomer.phone2 || "", email: newCustomer.email || "", address: newCustomer.address || "", city: newCustomer.city || c.city, notes: newCustomer.notes || "" }
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

  const handleAddDebt = () => {
    if (!selectedCustomer || !newDebt.amount || !newDebt.description) return
    const debt: Debt = {
      id: Date.now(),
      amount: Number(newDebt.amount),
      description: newDebt.description,
      date: new Date().toISOString().split("T")[0],
      status: "unpaid",
    }
    setCustomers(customers.map(c =>
      c.id === selectedCustomer.id
        ? { ...c, debts: [...c.debts, debt], totalDebt: c.totalDebt + debt.amount }
        : c
    ))
    setNewDebt({ amount: 0, description: "" })
    setIsDebtOpen(false)
  }

  const handlePayDebt = (customerId: number, debtId: number) => {
    setCustomers(customers.map(c => {
      if (c.id !== customerId) return c
      const updatedDebts = c.debts.map(d => d.id === debtId ? { ...d, status: "paid" as const } : d)
      const paidAmount = c.debts.find(d => d.id === debtId)?.amount || 0
      return { ...c, debts: updatedDebts, totalDebt: c.totalDebt - paidAmount }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Musteri Yonetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Musteri
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Musteri Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ad Soyad *</label>
                <Input
                  value={newCustomer.name || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Ahmet Yilmaz"
                  className="bg-slate-800 border-slate-700 text-white"
                />
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
                  <label className="text-sm font-medium text-slate-300">Sehir</label>
                  <Select
                    value={newCustomer.city}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, city: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Istanbul" className="text-white">Istanbul</SelectItem>
                      <SelectItem value="Ankara" className="text-white">Ankara</SelectItem>
                      <SelectItem value="Izmir" className="text-white">Izmir</SelectItem>
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
                    placeholder="Ilce, Semt"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={newCustomer.notes || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Musteri hakkinda not..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
                <Save className="mr-2 h-4 w-4" />
                Musteri Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Musteri</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aktif Musteri</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Borc Alan</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{debtCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Borc</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">₺{totalDebt.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Musteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Musteri ara (isim, telefon, ID)..."
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
                <SelectItem value="all" className="text-white">Tumu</SelectItem>
                <SelectItem value="active" className="text-white">Aktif</SelectItem>
                <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <Avatar className="h-12 w-12">
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
                  {customer.totalDebt > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-red-400 font-medium">Borc: ₺{customer.totalDebt.toLocaleString("tr-TR")}</span>
                      <span className="text-slate-500 ml-2">({customer.debts.length} kayit)</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Musteri Duzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ad Soyad</label>
              <Input value={newCustomer.name || ""} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
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
            <Button onClick={handleEditCustomer}>
              <Save className="mr-2 h-4 w-4" />
              Guncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt Dialog */}
      <Dialog open={isDebtOpen} onOpenChange={setIsDebtOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Borc Yonetimi - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mevcut Borclar</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedCustomer?.debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                    <div>
                      <div className="text-sm text-white">{debt.description}</div>
                      <div className="text-xs text-slate-400">{debt.date} • ₺{debt.amount.toLocaleString("tr-TR")}</div>
                    </div>
                    {debt.status === "unpaid" ? (
                      <Button size="sm" onClick={() => handlePayDebt(selectedCustomer.id, debt.id)}>
                        Ode
                      </Button>
                    ) : (
                      <Badge className="bg-green-900/50 text-green-300 border-green-700">Odenmis</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <label className="text-sm font-medium text-slate-300">Yeni Borc Ekle</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Tutar"
                  value={newDebt.amount || ""}
                  onChange={(e) => setNewDebt({...newDebt, amount: Number(e.target.value)})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Aciklama"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({...newDebt, description: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleAddDebt} className="w-full mt-2" disabled={!newDebt.amount || !newDebt.description}>
                <Plus className="mr-2 h-4 w-4" />
                Borc Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
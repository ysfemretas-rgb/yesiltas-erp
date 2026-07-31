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
import { 
  Users, 
  Plus, 
  Search, 
  Phone,
  MessageCircle,
  Edit3,
  Trash2,
  Save,
  AlertTriangle
} from "lucide-react"

interface Debt {
  id: number
  amount: number
  type: "installment" | "cash"
  dueDate: string
  status: "paid" | "pending" | "overdue"
  description: string
}

interface Customer {
  id: number
  customerId: string
  name: string
  phone: string
  phone2?: string
  email?: string
  debts: Debt[]
  totalDebt: number
}

const generateCustomerId = (index: number) => {
  return `YTM-${String(index + 1).padStart(4, '0')}`
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    customerId: "YTM-0001",
    name: "Ahmet Yilmaz",
    phone: "0555 123 4567",
    phone2: "0532 987 6543",
    debts: [
      { id: 1, amount: 2500, type: "installment", dueDate: "2024-08-15", status: "pending", description: "iPhone tamir taksidi" }
    ],
    totalDebt: 2500
  },
  {
    id: 2,
    customerId: "YTM-0002",
    name: "Mehmet Kaya",
    phone: "0555 234 5678",
    debts: [],
    totalDebt: 0
  },
  {
    id: 3,
    customerId: "YTM-0003",
    name: "Ayse Demir",
    phone: "0555 345 6789",
    debts: [
      { id: 2, amount: 1200, type: "cash", dueDate: "2024-07-20", status: "overdue", description: "Samsung batarya" }
    ],
    totalDebt: 1200
  }
]

const IBAN = "TR00 1234 5678 9012 3456 7890 12"
const ACCOUNT_NAME = "Yesiltas Teknik Servis"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDebtOpen, setIsDebtOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    phone2: "",
    email: ""
  })

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = customers.length
  const debtCustomers = customers.filter(c => c.totalDebt > 0).length

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return
    
    const customer: Customer = {
      id: Date.now(),
      customerId: generateCustomerId(customers.length),
      name: newCustomer.name,
      phone: newCustomer.phone,
      phone2: newCustomer.phone2 || undefined,
      email: newCustomer.email || undefined,
      debts: [],
      totalDebt: 0
    }
    
    setCustomers([customer, ...customers])
    setNewCustomer({ name: "", phone: "", phone2: "", email: "" })
    setIsNewCustomerOpen(false)
  }

  const handleEditCustomer = () => {
    if (!selectedCustomer || !newCustomer.name || !newCustomer.phone) return
    
    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id 
        ? { ...c, name: newCustomer.name, phone: newCustomer.phone, phone2: newCustomer.phone2, email: newCustomer.email }
        : c
    ))
    setIsEditOpen(false)
    setSelectedCustomer(null)
  }

  const handleDeleteCustomer = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id))
  }

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      phone2: customer.phone2,
      email: customer.email
    })
    setIsEditOpen(true)
  }

  const openDebt = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDebtOpen(true)
  }

  const sendWhatsApp = (customer: Customer) => {
    const message = `Merhaba ${customer.name},%0A%0AYesiltas Teknik Servis borc bilgileriniz:%0ABorc Tutari: ₺${customer.totalDebt}%0A%0AOdeme icin IBAN:%0A${IBAN}%0AHesap Adi: ${ACCOUNT_NAME}%0A%0AIyi gunler dileriz.`
    const url = `https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${message}`
    window.open(url, '_blank')
  }

  const getDebtBadge = (debt: number) => {
    if (debt > 0) return <Badge className="bg-red-900/50 text-red-300 border-red-700"><AlertTriangle className="mr-1 h-3 w-3"/>₺{debt}</Badge>
    return <Badge className="bg-green-900/50 text-green-300 border-green-700">Borc Yok</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Musteriler</h1>
        <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
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
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ahmet Yilmaz"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Telefon *</label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0555 123 4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">2. Telefon</label>
                <Input
                  value={newCustomer.phone2 || ""}
                  onChange={(e) => setNewCustomer({...newCustomer, phone2: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0532 987 6543"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">E-posta</label>
                <Input
                  value={newCustomer.email || ""}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="ornek@email.com"
                />
              </div>
              <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Musteri</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Borclu Musteri</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{debtCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Borc</CardTitle>
            <Phone className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              ₺{customers.reduce((sum, c) => sum + c.totalDebt, 0).toLocaleString("tr-TR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Musteri Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              placeholder="ID, isim veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-blue-600 text-blue-400">{customer.customerId}</Badge>
                      <span className="font-semibold text-white text-lg">{customer.name}</span>
                      {getDebtBadge(customer.totalDebt)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                      <div><span className="text-slate-500">Telefon:</span> {customer.phone}</div>
                      {customer.phone2 && <div><span className="text-slate-500">2. Telefon:</span> {customer.phone2}</div>}
                      {customer.email && <div><span className="text-slate-500">E-posta:</span> {customer.email}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {customer.totalDebt > 0 && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => sendWhatsApp(customer)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDebt(customer)}
                      className="border-slate-600 text-slate-300 hover:text-white"
                    >
                      Borc
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEdit(customer)}
                      className="border-slate-600 text-slate-300 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duzenle Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Musteri Duzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ad Soyad *</label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Telefon *</label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">2. Telefon</label>
              <Input
                value={newCustomer.phone2 || ""}
                onChange={(e) => setNewCustomer({...newCustomer, phone2: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">E-posta</label>
              <Input
                value={newCustomer.email || ""}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button onClick={handleEditCustomer}>
              <Save className="mr-2 h-4 w-4" />
              Guncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Borc Detay Dialog */}
      <Dialog open={isDebtOpen} onOpenChange={setIsDebtOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Borc Detaylari - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedCustomer?.debts.length === 0 ? (
              <div className="text-center text-slate-500 py-4">Borc kaydi bulunmuyor</div>
            ) : (
              <div className="space-y-3">
                {selectedCustomer?.debts.map(debt => (
                  <div key={debt.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-white">{debt.description}</span>
                      <Badge className={debt.status === "overdue" ? "bg-red-900/50 text-red-300" : debt.status === "paid" ? "bg-green-900/50 text-green-300" : "bg-yellow-900/50 text-yellow-300"}>
                        {debt.status === "overdue" ? "Gecikmis" : debt.status === "paid" ? "Odenmis" : "Bekliyor"}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      Tutar: ₺{debt.amount} | Tur: {debt.type === "installment" ? "Taksitli" : "Pesin"} | Vade: {debt.dueDate}
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="text-lg font-bold text-white text-right">
                    Toplam Borc: ₺{selectedCustomer?.totalDebt}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Plus,
  Wrench,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  CreditCard,
  Edit3,
  Trash2,
  ChevronDown,
  Check,
  UserPlus
} from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
  phone2?: string
}

interface Repair {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  customerPhone2?: string
  device: string
  brand: string
  model: string
  issue: string
  status: "waiting" | "in_progress" | "completed" | "cancelled"
  cost: number
  paidAmount: number
  paymentStatus: "unpaid" | "partial" | "paid"
  notes: string
  createdAt: string
  completedAt?: string
}

const initialCustomers: Customer[] = [
  { id: 1, name: "Ahmet Yılmaz", phone: "0555 123 4567", phone2: "0555 987 6543" },
  { id: 2, name: "Mehmet Kaya", phone: "0555 234 5678" },
  { id: 3, name: "Ayşe Demir", phone: "0555 345 6789", phone2: "0555 111 2222" },
  { id: 4, name: "Fatma Şahin", phone: "0555 456 7890" },
  { id: 5, name: "Ali Veli", phone: "0555 567 8901" },
]

const initialRepairs: Repair[] = [
  { id: 1, customerId: 1, customerName: "Ahmet Yılmaz", customerPhone: "0555 123 4567", customerPhone2: "0555 987 6543", device: "iPhone", brand: "Apple", model: "14 Pro", issue: "Ekran kırık", status: "completed", cost: 2500, paidAmount: 2500, paymentStatus: "paid", notes: "Orijinal ekran takıldı", createdAt: "2024-01-15", completedAt: "2024-01-16" },
  { id: 2, customerId: 2, customerName: "Mehmet Kaya", customerPhone: "0555 234 5678", device: "Samsung", brand: "Samsung", model: "S23", issue: "Batarya şişme", status: "in_progress", cost: 1800, paidAmount: 0, paymentStatus: "unpaid", notes: "Batarya değişimi yapılıyor", createdAt: "2024-01-18" },
  { id: 3, customerId: 3, customerName: "Ayşe Demir", customerPhone: "0555 345 6789", customerPhone2: "0555 111 2222", device: "iPad", brand: "Apple", model: "Air 5", issue: "Şarj almıyor", status: "waiting", cost: 1200, paidAmount: 0, paymentStatus: "unpaid", notes: "", createdAt: "2024-01-20" },
]

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>(initialRepairs)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(false)

  const [newRepair, setNewRepair] = useState<Partial<Repair>>({
    status: "waiting",
    paymentStatus: "unpaid",
    paidAmount: 0,
  })

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    phone2: "",
  })

  const filteredRepairs = repairs.filter((r) => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerPhone.includes(searchTerm) ||
      r.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issue.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: repairs.length,
    waiting: repairs.filter(r => r.status === "waiting").length,
    inProgress: repairs.filter(r => r.status === "in_progress").length,
    completed: repairs.filter(r => r.status === "completed").length,
    totalRevenue: repairs.reduce((sum, r) => sum + r.paidAmount, 0),
    pendingRevenue: repairs.reduce((sum, r) => sum + (r.cost - r.paidAmount), 0),
  }

  const handleAddRepair = () => {
    let customerId: number
    let customerName: string
    let customerPhone: string
    let customerPhone2: string | undefined

    if (isNewCustomer) {
      if (!newCustomer.name || !newCustomer.phone) return
      const customer: Customer = {
        id: Date.now(),
        name: newCustomer.name,
        phone: newCustomer.phone,
        phone2: newCustomer.phone2 || undefined,
      }
      setCustomers([...customers, customer])
      customerId = customer.id
      customerName = customer.name
      customerPhone = customer.phone
      customerPhone2 = customer.phone2
    } else {
      const customer = customers.find(c => c.id === newRepair.customerId)
      if (!customer) return
      customerId = customer.id
      customerName = customer.name
      customerPhone = customer.phone
      customerPhone2 = customer.phone2
    }

    if (!newRepair.device || !newRepair.issue) return

    const repair: Repair = {
      id: Date.now(),
      customerId,
      customerName,
      customerPhone,
      customerPhone2,
      device: newRepair.device,
      brand: newRepair.brand || "",
      model: newRepair.model || "",
      issue: newRepair.issue,
      status: "waiting",
      cost: Number(newRepair.cost) || 0,
      paidAmount: 0,
      paymentStatus: "unpaid",
      notes: newRepair.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setRepairs([repair, ...repairs])
    setNewRepair({ status: "waiting", paymentStatus: "unpaid", paidAmount: 0 })
    setNewCustomer({ name: "", phone: "", phone2: "" })
    setIsNewCustomer(false)
    setIsDialogOpen(false)
  }

  const handleStatusChange = (id: number, status: Repair["status"]) => {
    setRepairs(repairs.map(r => 
      r.id === id 
        ? { ...r, status, completedAt: status === "completed" ? new Date().toISOString().split("T")[0] : r.completedAt }
        : r
    ))
  }

  const handlePayment = (id: number, amount: number) => {
    setRepairs(repairs.map(r => {
      if (r.id !== id) return r
      const newPaid = r.paidAmount + amount
      const paymentStatus: Repair["paymentStatus"] = 
        newPaid >= r.cost ? "paid" : newPaid > 0 ? "partial" : "unpaid"
      return { ...r, paidAmount: newPaid, paymentStatus }
    }))
  }

  const handleDelete = (id: number) => {
    setRepairs(repairs.filter(r => r.id !== id))
  }

  const openEdit = (repair: Repair) => {
    setSelectedRepair(repair)
    setNewRepair({
      customerId: repair.customerId,
      device: repair.device,
      brand: repair.brand,
      model: repair.model,
      issue: repair.issue,
      cost: repair.cost,
      notes: repair.notes,
      paymentStatus: repair.paymentStatus,
      paidAmount: repair.paidAmount,
    })
    setIsEditOpen(true)
  }

  const handleEditSave = () => {
    if (!selectedRepair) return

    const updatedCost = Number(newRepair.cost) || selectedRepair.cost
    const updatedPaid = Number(newRepair.paidAmount) || selectedRepair.paidAmount

    let paymentStatus: Repair["paymentStatus"] = "unpaid"
    if (updatedPaid >= updatedCost && updatedCost > 0) {
      paymentStatus = "paid"
    } else if (updatedPaid > 0) {
      paymentStatus = "partial"
    }

    setRepairs(repairs.map(r => 
      r.id === selectedRepair.id 
        ? { 
            ...r, 
            device: newRepair.device || r.device,
            brand: newRepair.brand || r.brand,
            model: newRepair.model || r.model,
            issue: newRepair.issue || r.issue,
            cost: updatedCost,
            paidAmount: updatedPaid,
            paymentStatus,
            notes: newRepair.notes || r.notes,
          }
        : r
    ))
    setIsEditOpen(false)
    setSelectedRepair(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Bekliyor</Badge>
      case "in_progress": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">Devam Ediyor</Badge>
      case "completed": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Tamamlandı</Badge>
      case "cancelled": return <Badge className="bg-red-900/50 text-red-300 border-red-700">İptal</Badge>
      default: return null
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Ödendi</Badge>
      case "partial": return <Badge className="bg-orange-900/50 text-orange-300 border-orange-700">Kısmi</Badge>
      case "unpaid": return <Badge className="bg-red-900/50 text-red-300 border-red-700">Ödenmedi</Badge>
      default: return null
    }
  }

  const sendWhatsApp = (phone: string, customerName: string, device: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    const message = encodeURIComponent(`Merhaba ${customerName}, ${device} cihazınızın tamiri tamamlanmıştır. Cihazınızı teslim alabilirsiniz. Yeşiltaş Teknoloji`)
    window.open(`https://wa.me/90${cleanPhone}?text=${message}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Teknik Servis</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tamir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Tamir Kaydı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Müşteri Seçimi / Yeni Müşteri */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Müşteri</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewCustomer(!isNewCustomer)}
                    className="h-7 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {isNewCustomer ? "Mevcut Müşteri Seç" : "Yeni Müşteri Ekle"}
                  </Button>
                </div>

                {isNewCustomer ? (
                  <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Ad Soyad *</label>
                      <Input
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Ahmet Yılmaz"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400">Cep Telefonu *</label>
                        <Input
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="0555 123 4567"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-slate-400">Cep Telefonu 2</label>
                        <Input
                          value={newCustomer.phone2}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone2: e.target.value })}
                          placeholder="0555 987 6543"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        {newRepair.customerId
                          ? customers.find((c) => c.id === newRepair.customerId)?.name
                          : "Müşteri seçin..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                      <Command className="bg-slate-800">
                        <CommandInput placeholder="Müşteri ara..." className="text-white" />
                        <CommandList>
                          <CommandEmpty className="text-slate-400">Müşteri bulunamadı.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => {
                                  setNewRepair({ ...newRepair, customerId: customer.id })
                                  setCustomerOpen(false)
                                }}
                                className="text-white hover:bg-slate-700"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newRepair.customerId === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div>{customer.name}</div>
                                  <div className="text-xs text-slate-400">{customer.phone}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Cihaz *</label>
                  <Input
                    value={newRepair.device || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, device: e.target.value })}
                    placeholder="Telefon, Tablet, Laptop..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Marka</label>
                  <Input
                    value={newRepair.brand || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, brand: e.target.value })}
                    placeholder="Apple, Samsung..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Model</label>
                  <Input
                    value={newRepair.model || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, model: e.target.value })}
                    placeholder="iPhone 14 Pro..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Arıza Açıklaması *</label>
                <Textarea
                  value={newRepair.issue || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, issue: e.target.value })}
                  placeholder="Cihazın arızasını detaylı açıklayın..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tahmini Ücret (₺)</label>
                <Input
                  type="number"
                  value={newRepair.cost || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, cost: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Textarea
                  value={newRepair.notes || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, notes: e.target.value })}
                  placeholder="Teknisyen notları..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <Button 
                onClick={handleAddRepair}
                disabled={isNewCustomer ? (!newCustomer.name || !newCustomer.phone || !newRepair.device || !newRepair.issue) : (!newRepair.customerId || !newRepair.device || !newRepair.issue)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Tamir</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.waiting}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Devam Eden</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Tamamlanan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtre */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Tamir Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Müşteri, telefon, cihaz veya arıza ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Tümü</SelectItem>
                <SelectItem value="waiting" className="text-white">Bekliyor</SelectItem>
                <SelectItem value="in_progress" className="text-white">Devam Ediyor</SelectItem>
                <SelectItem value="completed" className="text-white">Tamamlandı</SelectItem>
                <SelectItem value="cancelled" className="text-white">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredRepairs.map((repair) => (
              <div key={repair.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg text-white">{repair.customerName}</span>
                      {getStatusBadge(repair.status)}
                      {getPaymentBadge(repair.paymentStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {repair.customerPhone}
                        {repair.customerPhone2 && ` / ${repair.customerPhone2}`}
                      </span>
                      <span>{repair.brand} {repair.model}</span>
                      <span className="text-slate-500">{repair.createdAt}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">₺{repair.cost.toLocaleString("tr-TR")}</div>
                    <div className="text-sm text-slate-400">
                      Alınan: <span className="text-green-400">₺{repair.paidAmount.toLocaleString("tr-TR")}</span>
                    </div>
                    {repair.paymentStatus !== "paid" && (
                      <div className="text-sm text-red-400">
                        Kalan: ₺{(repair.cost - repair.paidAmount).toLocaleString("tr-TR")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Arıza:</span> {repair.issue}
                  </p>
                  {repair.notes && (
                    <p className="text-sm text-slate-400 mt-1">
                      <span className="text-slate-500">Not:</span> {repair.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Select
                      value={repair.status}
                      onValueChange={(value) => handleStatusChange(repair.id, value as Repair["status"])}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="waiting" className="text-white">Bekliyor</SelectItem>
                        <SelectItem value="in_progress" className="text-white">Devam Ediyor</SelectItem>
                        <SelectItem value="completed" className="text-white">Tamamlandı</SelectItem>
                        <SelectItem value="cancelled" className="text-white">İptal</SelectItem>
                      </SelectContent>
                    </Select>

                    {repair.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendWhatsApp(repair.customerPhone, repair.customerName, `${repair.brand} ${repair.model}`)}
                        className="border-green-700 text-green-400 hover:bg-green-900/20 hover:text-green-300"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(repair)}
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(repair.id)}
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

      {/* Düzenleme Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Tamir Düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Cihaz</label>
                <Input
                  value={newRepair.device || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, device: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Marka</label>
                <Input
                  value={newRepair.brand || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, brand: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Model</label>
                <Input
                  value={newRepair.model || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, model: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Arıza</label>
              <Textarea
                value={newRepair.issue || ""}
                onChange={(e) => setNewRepair({ ...newRepair, issue: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Toplam Ücret (₺)</label>
              <Input
                type="number"
                value={newRepair.cost || ""}
                onChange={(e) => setNewRepair({ ...newRepair, cost: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Ödeme Durumu */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ödeme Durumu</label>
              <Select
                value={newRepair.paymentStatus}
                onValueChange={(value) => setNewRepair({ ...newRepair, paymentStatus: value as Repair["paymentStatus"] })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="unpaid" className="text-white">Ödenmedi</SelectItem>
                  <SelectItem value="partial" className="text-white">Kısmi Ödeme</SelectItem>
                  <SelectItem value="paid" className="text-white">Ödendi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kısmi ödeme seçilince göster */}
            {newRepair.paymentStatus === "partial" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Alınan Tutar (₺)</label>
                <Input
                  type="number"
                  value={newRepair.paidAmount || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, paidAmount: Number(e.target.value) })}
                  placeholder="Ne kadar alındı?"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notlar</label>
              <Textarea
                value={newRepair.notes || ""}
                onChange={(e) => setNewRepair({ ...newRepair, notes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button onClick={handleEditSave}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
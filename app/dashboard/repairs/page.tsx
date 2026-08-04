"use client"

function usePermissionGuard(requiredPermission: string) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecking(false)
      return
    }
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
        setChecking(false)
        return
      }
      if (user.permissions && Array.isArray(user.permissions) && user.permissions.includes(requiredPermission)) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }
    } catch (e) {
      console.error("Permission guard error:", e)
      setAuthorized(false)
    }
    setChecking(false)
  }, [requiredPermission])

  return { authorized, checking }
}

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  CreditCard,
  Banknote,
  Receipt,
  Pencil,
  Trash2,
  Wallet
} from "lucide-react"

interface Repair {
  id: number
  customerName: string
  phone1: string
  phone2: string
  device: string
  brand: string
  model: string
  issue: string
  status: "waiting" | "in_progress" | "completed"
  cost: number
  paid: number
  remaining: number
  paymentType: "cash" | "card" | "transfer" | "partial" | "unpaid"
  notes: string
  createdAt: string
  completedAt?: string
}

interface Customer {
  id: number
  name: string
  phone1: string
  phone2: string
  email: string
  address: string
}

interface Note {
  id: number
  repairId: number
  text: string
  createdAt: string
  author: string
}

interface FinanceTransaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  customer?: string
  source: "repair" | "sale" | "manual"
  sourceId?: number
}

const initialRepairs: Repair[] = [
  {
    id: 1,
    customerName: "Ahmet Yilmaz",
    phone1: "0532 123 4567",
    phone2: "",
    device: "Telefon",
    brand: "Apple",
    model: "iPhone 14 Pro",
    issue: "Ekran kirildi",
    status: "completed",
    cost: 4500,
    paid: 4500,
    remaining: 0,
    paymentType: "cash",
    notes: "Ekran degistirildi, test edildi.",
    createdAt: "2026-07-28",
    completedAt: "2026-07-29",
  },
  {
    id: 2,
    customerName: "Mehmet Demir",
    phone1: "0533 987 6543",
    phone2: "0544 111 2222",
    device: "Laptop",
    brand: "Dell",
    model: "XPS 15",
    issue: "Sarj olmuyor",
    status: "in_progress",
    cost: 1200,
    paid: 0,
    remaining: 1200,
    paymentType: "unpaid",
    notes: "Sarj soketi kontrol ediliyor.",
    createdAt: "2026-07-30",
  },
  {
    id: 3,
    customerName: "Ayse Kaya",
    phone1: "0555 444 3333",
    phone2: "",
    device: "Tablet",
    brand: "Samsung",
    model: "Galaxy Tab S8",
    issue: "Dokunmatik calismiyor",
    status: "waiting",
    cost: 800,
    paid: 0,
    remaining: 800,
    paymentType: "unpaid",
    notes: "Parca siparisi verildi.",
    createdAt: "2026-08-01",
  },
]

const initialCustomers: Customer[] = [
  { id: 1, name: "Ahmet Yilmaz", phone1: "0532 123 4567", phone2: "", email: "ahmet@email.com", address: "Istanbul" },
  { id: 2, name: "Mehmet Demir", phone1: "0533 987 6543", phone2: "0544 111 2222", email: "mehmet@email.com", address: "Ankara" },
  { id: 3, name: "Ayse Kaya", phone1: "0555 444 3333", phone2: "", email: "ayse@email.com", address: "Izmir" },
]

const initialNotes: Note[] = [
  { id: 1, repairId: 2, text: "Parca siparisi verildi, 2 gun surecek.", createdAt: "2026-07-30 10:00", author: "Teknisyen" },
]

const initialFinance: FinanceTransaction[] = [
  { id: 1, description: "iPhone 14 Pro Ekran Degisimi", amount: 4500, type: "income", category: "Tamir Geliri", date: "2026-07-29", customer: "Ahmet Yilmaz", source: "repair", sourceId: 1 },
]

// Helper to normalize customer data from different sources
function normalizeCustomer(raw: any): Customer {
  return {
    id: raw.id || 0,
    name: raw.name || raw.fullName || raw.customerName || "",
    phone1: raw.phone1 || raw.phone || raw.telefon || raw.tel1 || raw.phoneNumber || "",
    phone2: raw.phone2 || raw.phoneSecondary || raw.tel2 || "",
    email: raw.email || raw.e_posta || "",
    address: raw.address || raw.adres || "",
  }
}

export default function RepairsPage() {
  const router = useRouter()
  const { authorized, checking } = usePermissionGuard("Tamir")

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetki kontrol ediliyor...</div>
      </div>
    )
  }

  if (!authorized) {
    if (typeof window !== "undefined") {
      router.push("/dashboard")
    }
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetkisiz erişim. Yönlendiriliyor...</div>
      </div>
    )
  }

  const [repairs, setRepairs] = useState<Repair[]>(initialRepairs)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(initialFinance)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [noteText, setNoteText] = useState("")

  // Form states
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [phone1, setPhone1] = useState("")
  const [phone2, setPhone2] = useState("")
  const [device, setDevice] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [issue, setIssue] = useState("")
  const [cost, setCost] = useState("")
  const [paymentType, setPaymentType] = useState<string>("unpaid")
  const [paidAmount, setPaidAmount] = useState("")
  const [notesInput, setNotesInput] = useState("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)

  // New customer form
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone1, setNewCustomerPhone1] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRepairs = localStorage.getItem("yt_repairs")
        const savedCustomers = localStorage.getItem("yt_customers")
        const savedNotes = localStorage.getItem("yt_repair_notes")
        const savedFinance = localStorage.getItem("yt_finance")
        if (savedRepairs) setRepairs(JSON.parse(savedRepairs))
        if (savedCustomers) {
          const parsed = JSON.parse(savedCustomers)
          // Normalize customers to ensure phone1 field exists
          const normalized = Array.isArray(parsed) ? parsed.map(normalizeCustomer) : []
          setCustomers(normalized)
        }
        if (savedNotes) setNotes(JSON.parse(savedNotes))
        if (savedFinance) setFinanceTransactions(JSON.parse(savedFinance))
      } catch (e) {
        console.error("Load error:", e)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yt_repairs", JSON.stringify(repairs))
      localStorage.setItem("yt_customers", JSON.stringify(customers))
      localStorage.setItem("yt_repair_notes", JSON.stringify(notes))
      localStorage.setItem("yt_finance", JSON.stringify(financeTransactions))
    }
  }, [repairs, customers, notes, financeTransactions])

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const matchesSearch =
        search === "" ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.phone1.includes(search) ||
        r.phone2.includes(search) ||
        r.device.toLowerCase().includes(search.toLowerCase()) ||
        r.brand.toLowerCase().includes(search.toLowerCase()) ||
        r.model.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [repairs, search, statusFilter])

  const stats = useMemo(() => {
    const total = repairs.length
    const waiting = repairs.filter((r) => r.status === "waiting").length
    const inProgress = repairs.filter((r) => r.status === "in_progress").length
    const completed = repairs.filter((r) => r.status === "completed").length
    const totalRevenue = repairs.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.paid, 0)
    const totalRemaining = repairs.reduce((sum, r) => sum + r.remaining, 0)
    return { total, waiting, inProgress, completed, totalRevenue, totalRemaining }
  }, [repairs])

  const handleCustomerSelect = (value: string) => {
    if (value === "new") {
      setIsNewCustomer(true)
      setCustomerId("")
      setCustomerName("")
      setPhone1("")
      setPhone2("")
    } else {
      setIsNewCustomer(false)
      setCustomerId(value)
      const customer = customers.find((c) => c.id.toString() === value)
      if (customer) {
        setCustomerName(customer.name)
        setPhone1(customer.phone1 || "")
        setPhone2(customer.phone2 || "")
      }
    }
  }

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone1.trim()) return
    const newId = Math.max(...customers.map((c) => c.id), 0) + 1
    const newCustomer: Customer = {
      id: newId,
      name: newCustomerName,
      phone1: newCustomerPhone1,
      phone2: newCustomerPhone2,
      email: newCustomerEmail,
      address: newCustomerAddress,
    }
    setCustomers([...customers, newCustomer])
    setCustomerId(newId.toString())
    setCustomerName(newCustomerName)
    setPhone1(newCustomerPhone1)
    setPhone2(newCustomerPhone2)
    setIsNewCustomerDialogOpen(false)
    setIsNewCustomer(false)
    setNewCustomerName("")
    setNewCustomerPhone1("")
    setNewCustomerPhone2("")
    setNewCustomerEmail("")
    setNewCustomerAddress("")
  }

  const calculateRemaining = (totalCost: number, paid: number) => {
    return Math.max(0, totalCost - paid)
  }

  const addFinanceTransaction = (repair: Repair) => {
    if (repair.paid <= 0) return
    const newTransaction: FinanceTransaction = {
      id: Date.now(),
      description: `${repair.brand} ${repair.model} ${repair.device} Tamiri`,
      amount: repair.paid,
      type: "income",
      category: "Tamir Geliri",
      date: new Date().toISOString().split("T")[0],
      customer: repair.customerName,
      source: "repair",
      sourceId: repair.id,
    }
    setFinanceTransactions(prev => [newTransaction, ...prev])
  }

  const validateForm = () => {
    const missingFields: string[] = []

    if (!customerName.trim()) missingFields.push("Müşteri Adi")
    if (!phone1.trim()) missingFields.push("Telefon 1")
    if (!device.trim()) missingFields.push("Cihaz Türü")
    if (!brand.trim()) missingFields.push("Marka")
    if (!issue.trim()) missingFields.push("Arıza Açıklaması")

    if (missingFields.length > 0) {
      alert("Lütfen zorunlu alanlari doldurun:\n\n" + missingFields.map(f => "• " + f).join("\n"))
      return false
    }
    return true
  }

  const handleAddRepair = () => {
    if (!validateForm()) return

    const newId = Math.max(...repairs.map((r) => r.id), 0) + 1
    const costNum = parseFloat(cost) || 0
    const paidNum = paymentType === "partial" ? (parseFloat(paidAmount) || 0) : (paymentType === "unpaid" ? 0 : costNum)
    const remainingNum = calculateRemaining(costNum, paidNum)
    const newRepair: Repair = {
      id: newId,
      customerName,
      phone1,
      phone2,
      device,
      brand,
      model,
      issue,
      status: "waiting",
      cost: costNum,
      paid: paidNum,
      remaining: remainingNum,
      paymentType: paymentType as Repair["paymentType"],
      notes: notesInput,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setRepairs([newRepair, ...repairs])

    // Add to finance if payment made
    if (paidNum > 0) {
      addFinanceTransaction({ ...newRepair, id: newId })
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleUpdateRepair = () => {
    if (!selectedRepair) return

    const missingFields: string[] = []
    if (!customerName.trim()) missingFields.push("Müşteri Adi")
    if (!phone1.trim()) missingFields.push("Telefon 1")
    if (!device.trim()) missingFields.push("Cihaz Türü")
    if (!brand.trim()) missingFields.push("Marka")
    if (!issue.trim()) missingFields.push("Arıza Açıklaması")

    if (missingFields.length > 0) {
      alert("Lütfen zorunlu alanlari doldurun:\n\n" + missingFields.map(f => "• " + f).join("\n"))
      return
    }

    const costNum = parseFloat(cost) || selectedRepair.cost
    const paidNum = paymentType === "partial" 
      ? (parseFloat(paidAmount) || selectedRepair.paid) 
      : (paymentType === "unpaid" ? 0 : costNum)
    const remainingNum = calculateRemaining(costNum, paidNum)

    const updatedRepair: Repair = {
      ...selectedRepair,
      customerName,
      phone1,
      phone2,
      device,
      brand,
      model,
      issue,
      cost: costNum,
      paid: paidNum,
      remaining: remainingNum,
      paymentType: paymentType as Repair["paymentType"],
      notes: notesInput,
    }

    setRepairs(
      repairs.map((r) =>
        r.id === selectedRepair.id ? updatedRepair : r
      )
    )

    // Update finance if payment changed
    if (paidNum > selectedRepair.paid) {
      const diff = paidNum - selectedRepair.paid
      const newTransaction: FinanceTransaction = {
        id: Date.now(),
        description: `${updatedRepair.brand} ${updatedRepair.model} - Ek Ödeme`,
        amount: diff,
        type: "income",
        category: "Tamir Geliri",
        date: new Date().toISOString().split("T")[0],
        customer: updatedRepair.customerName,
        source: "repair",
        sourceId: updatedRepair.id,
      }
      setFinanceTransactions(prev => [newTransaction, ...prev])
    }

    setIsEditDialogOpen(false)
    setSelectedRepair(null)
  }

  const handleStatusChange = (id: number, newStatus: Repair["status"]) => {
    const repair = repairs.find(r => r.id === id)
    if (!repair) return

    const updatedRepair = {
      ...repair,
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString().split("T")[0] : repair.completedAt,
    }

    setRepairs(
      repairs.map((r) =>
        r.id === id ? updatedRepair : r
      )
    )

    // Add to finance when completed and has payment
    if (newStatus === "completed" && repair.paid > 0) {
      // Check if already added
      const alreadyAdded = financeTransactions.some(t => t.source === "repair" && t.sourceId === id && t.description.includes("Tamamlandı"))
      if (!alreadyAdded) {
        const newTransaction: FinanceTransaction = {
          id: Date.now(),
          description: `${repair.brand} ${repair.model} - Tamir Tamamlandı`,
          amount: repair.paid,
          type: "income",
          category: "Tamir Geliri",
          date: new Date().toISOString().split("T")[0],
          customer: repair.customerName,
          source: "repair",
          sourceId: repair.id,
        }
        setFinanceTransactions(prev => [newTransaction, ...prev])
      }
    }
  }

  const handleDeleteRepair = (id: number) => {
    if (confirm("Bu tamir kaydini silmek istediginize emin misiniz?")) {
      setRepairs(repairs.filter((r) => r.id !== id))
      setNotes(notes.filter((n) => n.repairId !== id))
      // Remove related finance transactions
      setFinanceTransactions(financeTransactions.filter(t => !(t.source === "repair" && t.sourceId === id)))
    }
  }

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedRepair) return
    const newNote: Note = {
      id: Math.max(...notes.map((n) => n.id), 0) + 1,
      repairId: selectedRepair.id,
      text: noteText,
      createdAt: new Date().toLocaleString("tr-TR"),
      author: "Teknisyen",
    }
    setNotes([...notes, newNote])
    setNoteText("")
  }

  const openEditDialog = (repair: Repair) => {
    setSelectedRepair(repair)
    setCustomerName(repair.customerName)
    setPhone1(repair.phone1)
    setPhone2(repair.phone2)
    setDevice(repair.device)
    setBrand(repair.brand)
    setModel(repair.model)
    setIssue(repair.issue)
    setCost(repair.cost.toString())
    setPaymentType(repair.paymentType)
    setPaidAmount(repair.paid.toString())
    setNotesInput(repair.notes)
    setIsEditDialogOpen(true)
  }

  const openNoteDialog = (repair: Repair) => {
    setSelectedRepair(repair)
    setIsNoteDialogOpen(true)
  }

  const resetForm = () => {
    setCustomerId("")
    setCustomerName("")
    setPhone1("")
    setPhone2("")
    setDevice("")
    setBrand("")
    setModel("")
    setIssue("")
    setCost("")
    setPaymentType("unpaid")
    setPaidAmount("")
    setNotesInput("")
    setIsNewCustomer(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="border-amber-500 text-amber-400"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500 text-blue-400"><AlertCircle className="h-3 w-3 mr-1" />Devam Ediyor</Badge>
      case "completed":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Tamamlandı</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (type: string, remaining: number) => {
    if (remaining > 0 && type !== "unpaid") {
      return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kismi ({formatCurrency(remaining)} kaldi)</Badge>
    }
    switch (type) {
      case "cash": return <Badge className="bg-emerald-600"><Banknote className="h-3 w-3 mr-1" />Nakit</Badge>
      case "card": return <Badge className="bg-blue-600"><CreditCard className="h-3 w-3 mr-1" />Kart</Badge>
      case "transfer": return <Badge className="bg-violet-600"><Receipt className="h-3 w-3 mr-1" />Havale</Badge>
      case "partial": return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kismi</Badge>
      default: return <Badge variant="secondary">Odenmedi</Badge>
    }
  }

  const getRepairNotes = (repairId: number) => notes.filter((n) => n.repairId === repairId)

  const sendWhatsApp = (repair: Repair) => {
    const cleanPhone = repair.phone1.replace(/\D/g, "")
    let message = `\uD83D\uDC4B Merhaba *${repair.customerName}*,%0A%0A`
    message += `\u2705 *${repair.brand} ${repair.model}* cihazınızın tamiri tamamlanmıştır. \uD83D\uDD27%0A%0A`

    if (repair.remaining > 0) {
      message += `\uD83D\uDCB0 *Toplam Ücret:* ${formatCurrency(repair.cost)}%0A`
      message += `\uD83D\uDCB5 *Alınan:* ${formatCurrency(repair.paid)}%0A`
      message += `\u23F3 *Kalan Bakiye:* ${formatCurrency(repair.remaining)}%0A%0A`
      message += `\uD83D\uDE4F Lütfen kalan tutarı getirerek cihazınızı teslim alınız.`
    } else {
      message += `\uD83C\uDF89 *Ücret tamamen ödenmiştir* (${formatCurrency(repair.cost)}).%0A`
      message += `\u2705 Hemen teslim alabilirsiniz.`
    }

    message += `%0A%0A\uD83C\uDFEA *Yeşiltaş Teknoloji*%0A\uD83D\uDCDE Bizi tercih ettiğiniz için teşekkür ederiz! \uD83D\uDE4F`

    window.open(`https://wa.me/90${cleanPhone}?text=${message}`, "_blank")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Teknik Servis</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />Yeni Tamir
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Tamir Kaydı</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Müşteri Seçimi</Label>
                <Select value={customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Müşteri secin veya yeni ekleyin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="new" className="text-emerald-400 font-semibold">
                      + Yeni Müşteri Ekle
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()} className="text-white">
                        {c.name} - {c.phone1 || "Telefon yok"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isNewCustomer && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-400 font-semibold">Yeni Müşteri Bilgileri</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsNewCustomerDialogOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />Detayli Ekle
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Ad Soyad <span className="text-red-400">*</span></Label>
                      <Input 
                        value={customerName} 
                        onChange={(e) => setCustomerName(e.target.value)} 
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Orn: Ahmet Yilmaz"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Telefon 1 <span className="text-red-400">*</span></Label>
                      <Input 
                        value={phone1} 
                        onChange={(e) => setPhone1(e.target.value)} 
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="0532 123 4567"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Telefon 2</Label>
                      <Input 
                        value={phone2} 
                        onChange={(e) => setPhone2(e.target.value)} 
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="0544 987 6543"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isNewCustomer && customerName && (
                <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-slate-400">Ad:</span> <span className="text-white">{customerName}</span></div>
                    <div><span className="text-slate-400">Tel 1:</span> <span className="text-white">{phone1 || "-"}</span></div>
                    {phone2 && <div><span className="text-slate-400">Tel 2:</span> <span className="text-white">{phone2}</span></div>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Cihaz Türü <span className="text-red-400">*</span></Label>
                  <Select value={device} onValueChange={setDevice}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Telefon">Telefon</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Bilgisayar">Bilgisayar</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                      <SelectItem value="Diger">Diger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Marka <span className="text-red-400">*</span></Label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Orn: Apple" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Orn: iPhone 14 Pro" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ücret (TL)</Label>
                  <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="4500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Arıza Açıklaması <span className="text-red-400">*</span></Label>
                <Textarea value={issue} onChange={(e) => setIssue(e.target.value)} className="bg-slate-800 border-slate-600 text-white min-h-[80px]" placeholder="Cihazda yasanan sorunu detayli aciklayin..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ödeme Sekli</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="unpaid">Odenmedi</SelectItem>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="card">Kredi Karti</SelectItem>
                      <SelectItem value="transfer">Havale/EFT</SelectItem>
                      <SelectItem value="partial">Kismi Ödeme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentType === "partial" && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Alınan Tutar (TL)</Label>
                    <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Orn: 2000" />
                  </div>
                )}
              </div>

              {paymentType === "partial" && cost && paidAmount && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-slate-400">Toplam:</span> <span className="text-white font-bold">{formatCurrency(parseFloat(cost) || 0)}</span></div>
                    <div><span className="text-slate-400">Alınan:</span> <span className="text-emerald-400 font-bold">{formatCurrency(parseFloat(paidAmount) || 0)}</span></div>
                    <div><span className="text-slate-400">Kalan:</span> <span className="text-amber-400 font-bold">{formatCurrency(calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Notlar</Label>
                <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Ekstra notlar..." />
              </div>

              <Button onClick={handleAddRepair} className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Toplam Tamir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{stats.waiting}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Devam Eden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Toplam Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Bekleyen Tahsilat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{formatCurrency(stats.totalRemaining)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Müşteri, telefon, cihaz, marka, model ara..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Durum filtresi" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">Tumu</SelectItem>
            <SelectItem value="waiting">Bekliyor</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">Müşteri</TableHead>
                <TableHead className="text-slate-400">Telefon</TableHead>
                <TableHead className="text-slate-400">Cihaz</TableHead>
                <TableHead className="text-slate-400">Arıza</TableHead>
                <TableHead className="text-slate-400">Durum</TableHead>
                <TableHead className="text-slate-400">Ücret</TableHead>
                <TableHead className="text-slate-400">Ödeme</TableHead>
                <TableHead className="text-slate-400">Tarih</TableHead>
                <TableHead className="text-slate-400 text-right">Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                    Kayit bulunamadi.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRepairs.map((repair) => (
                  <TableRow key={repair.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="text-slate-300 font-mono">#{repair.id}</TableCell>
                    <TableCell className="text-white font-medium">{repair.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-300 text-sm">{repair.phone1}</span>
                        {repair.phone2 && <span className="text-slate-400 text-xs">{repair.phone2}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{repair.brand} {repair.model}</TableCell>
                    <TableCell className="text-slate-300 max-w-[200px] truncate">{repair.issue}</TableCell>
                    <TableCell>{getStatusBadge(repair.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{formatCurrency(repair.cost)}</span>
                        {repair.remaining > 0 && (
                          <span className="text-amber-400 text-xs">Kalan: {formatCurrency(repair.remaining)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPaymentBadge(repair.paymentType, repair.remaining)}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{repair.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {repair.status === "completed" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => sendWhatsApp(repair)}
                            className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            title="📱 WhatsApp ile bilgilendir"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Select 
                          value={repair.status} 
                          onValueChange={(v) => handleStatusChange(repair.id, v as Repair["status"])}
                        >
                          <SelectTrigger className="h-8 w-[130px] bg-slate-800 border-slate-600 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="waiting">Bekliyor</SelectItem>
                            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => openNoteDialog(repair)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(repair)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRepair(repair.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Tamir Düzenle #{selectedRepair?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Müşteri Adi <span className="text-red-400">*</span></Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefon 1 <span className="text-red-400">*</span></Label>
                <Input value={phone1} onChange={(e) => setPhone1(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefon 2</Label>
              <Input value={phone2} onChange={(e) => setPhone2(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Ikinci telefon (opsiyonel)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Cihaz Türü <span className="text-red-400">*</span></Label>
                <Select value={device} onValueChange={setDevice}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="Telefon">Telefon</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Bilgisayar">Bilgisayar</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Diger">Diger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Marka <span className="text-red-400">*</span></Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Ücret (TL)</Label>
                <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Arıza Açıklaması <span className="text-red-400">*</span></Label>
              <Textarea value={issue} onChange={(e) => setIssue(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Ödeme Sekli</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="unpaid">Odenmedi</SelectItem>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="card">Kredi Karti</SelectItem>
                    <SelectItem value="transfer">Havale/EFT</SelectItem>
                    <SelectItem value="partial">Kismi Ödeme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentType === "partial" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Alınan Tutar (TL)</Label>
                  <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Ne kadar alindi?" />
                </div>
              )}
            </div>

            {paymentType === "partial" && cost && paidAmount && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-slate-400">Toplam:</span> <span className="text-white font-bold">{formatCurrency(parseFloat(cost) || 0)}</span></div>
                  <div><span className="text-slate-400">Alınan:</span> <span className="text-emerald-400 font-bold">{formatCurrency(parseFloat(paidAmount) || 0)}</span></div>
                  <div><span className="text-slate-400">Kalan:</span> <span className="text-amber-400 font-bold">{formatCurrency(calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Notlar</Label>
              <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <Button onClick={handleUpdateRepair} className="w-full bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Notlar - {selectedRepair?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Yeni Not Ekle</Label>
              <div className="flex gap-2">
                <Textarea 
                  value={noteText} 
                  onChange={(e) => setNoteText(e.target.value)} 
                  className="bg-slate-800 border-slate-600 text-white flex-1" 
                  placeholder="Not yazin..."
                />
                <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700 self-end">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <Label className="text-slate-300">Geçmiş Notlar</Label>
              {getRepairNotes(selectedRepair?.id || 0).length === 0 ? (
                <p className="text-slate-500 text-sm">Heniz not eklenmemis.</p>
              ) : (
                getRepairNotes(selectedRepair?.id || 0).map((note) => (
                  <div key={note.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <p className="text-white text-sm">{note.text}</p>
                    <p className="text-slate-500 text-xs mt-1">{note.author} - {note.createdAt}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Ad Soyad <span className="text-red-400">*</span></Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefon 1 <span className="text-red-400">*</span></Label>
              <Input value={newCustomerPhone1} onChange={(e) => setNewCustomerPhone1(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="0532 123 4567" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefon 2</Label>
              <Input value={newCustomerPhone2} onChange={(e) => setNewCustomerPhone2(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="0544 987 6543" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">E-posta</Label>
              <Input value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="ornek@email.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Adres</Label>
              <Textarea value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Adres..." />
            </div>
            <Button onClick={handleAddNewCustomer} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />Müşteri Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
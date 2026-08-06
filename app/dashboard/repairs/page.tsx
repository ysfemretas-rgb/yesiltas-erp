"use client"

import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Repair, fetchRepairs, createRepair, updateRepair, deleteRepair } from "@/lib/repairs"
import { RepairNote as Note, fetchRepairNotes, createRepairNote } from "@/lib/repairNotes"
import { fetchCustomers, createCustomer } from "@/lib/customers"
import { createTransaction } from "@/lib/finance"
import { QrDialog } from "@/components/repairs/QrDialog"
import { NoteDialog } from "@/components/repairs/NoteDialog"
import { getRepairStatusBadge as getStatusBadge, getRepairPaymentBadge as getPaymentBadge, formatCurrency } from "@/components/repairs/RepairBadges"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { validateIMEI } from "@/lib/validation"
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Pencil,
  Trash2,
  QrCode
} from "lucide-react"


interface Customer {
  id: string
  name: string
  phone1: string
  phone2: string
  email: string
  address: string
}


export default function RepairsPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Tamir")
  const isManager = useIsManager()

  const [repairs, setRepairs] = useState<Repair[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const [noteText, setNoteText] = useState("")
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [phone1, setPhone1] = useState("")
  const [phone2, setPhone2] = useState("")
  const [device, setDevice] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [issue, setIssue] = useState("")
  const [imei, setImei] = useState("")
  const [cost, setCost] = useState("")
  const [paymentType, setPaymentType] = useState<string>("unpaid")
  const [paidAmount, setPaidAmount] = useState("")
  const [notesInput, setNotesInput] = useState("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone1, setNewCustomerPhone1] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  useEffect(() => {
    let cancelled = false

    fetchRepairNotes()
      .then((data) => {
        if (!cancelled) setNotes(data)
      })
      .catch((e) => console.error("Not verisi yüklenemedi:", e))

    fetchCustomers()
      .then((data) => {
        if (!cancelled) setCustomers(data.map(c => ({ id: c.id, name: c.name, phone1: c.phone1 || c.phone, phone2: c.phone2, email: c.email, address: c.address })))
      })
      .catch((e) => console.error("Müşteriler yüklenemedi:", e))

    fetchRepairs()
      .then((data) => {
        if (!cancelled) setRepairs(data)
      })
      .catch((e) => {
        console.error("Tamir kayıtları yüklenemedi:", e)
        if (!cancelled) showToast("Tamir kayıtları yüklenirken bir sorun oluştu.", "error")
      })

    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yt_repairs", JSON.stringify(repairs))
    }
  }, [repairs])
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


  // Form states

  // New customer form

  // Load from localStorage

  // Save to localStorage



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

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone1.trim()) return
    try {
      const created = await createCustomer({
        name: newCustomerName,
        firstName: newCustomerName.split(" ")[0] || newCustomerName,
        lastName: newCustomerName.split(" ").slice(1).join(" "),
        phone: newCustomerPhone1,
        phone2: newCustomerPhone2 || "",
        email: newCustomerEmail || "",
        address: newCustomerAddress || "",
        status: "active",
        lastVisit: new Date().toISOString().split("T")[0],
      })
      const newCustomer: Customer = {
        id: created.id,
        name: created.name,
        phone1: created.phone,
        phone2: created.phone2 || "",
        email: created.email,
        address: created.address,
      }
      setCustomers([...customers, newCustomer])
      setCustomerId(newCustomer.id)
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
      showToast("Müşteri eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Müşteri eklenirken bir sorun oluştu.", "error")
    }
  }

  const calculateRemaining = (totalCost: number, paid: number) => {
    return Math.max(0, totalCost - paid)
  }

  const addFinanceTransaction = async (repair: Repair) => {
    if (repair.paid <= 0) return
    try {
      await createTransaction({
        type: "income",
        category: "Tamir Geliri",
        amount: repair.paid,
        description: `${repair.brand} ${repair.model} ${repair.device} Tamiri`,
        date: new Date().toISOString().split("T")[0],
        customer: repair.customerName,
        source: "repair",
      })
    } catch (e) {
      console.error("Finans kaydı oluşturulamadı:", e)
    }
  }

  const validateForm = () => {
    const missingFields: string[] = []

    if (!customerName.trim()) missingFields.push("Müşteri Adi")
    if (!phone1.trim()) missingFields.push("Telefon 1")
    if (!device.trim()) missingFields.push("Cihaz Türü")
    if (!brand.trim()) missingFields.push("Marka")
    if (!issue.trim()) missingFields.push("Arıza Açıklaması")

    if (missingFields.length > 0) {
      showToast("Lütfen zorunlu alanlari doldurun:\n\n" + missingFields.map(f => "• " + f).join("\n"), "error")
      return false
    }
    return true
  }

  const handleAddRepair = async () => {
    if (!validateForm()) return

    const costNum = parseFloat(cost) || 0
    const paidNum = paymentType === "partial" ? (parseFloat(paidAmount) || 0) : (paymentType === "unpaid" ? 0 : costNum)
    const remainingNum = calculateRemaining(costNum, paidNum)
    try {
      const newRepair = await createRepair({
        customerName,
        phone1,
        phone2,
        device,
        brand,
        model,
        issue,
        imei: imei.trim() || undefined,
        status: "waiting",
        cost: costNum,
        paid: paidNum,
        remaining: remainingNum,
        paymentType: paymentType as Repair["paymentType"],
        notes: notesInput,
        createdAt: new Date().toISOString().split("T")[0],
      })
      setRepairs([newRepair, ...repairs])

      // Add to finance if payment made
      if (paidNum > 0) {
        await addFinanceTransaction(newRepair)
      }

      resetForm()
      setIsDialogOpen(false)
      showToast("Tamir kaydı eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Tamir kaydı eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateRepair = async () => {
    if (!selectedRepair) return

    const missingFields: string[] = []
    if (!customerName.trim()) missingFields.push("Müşteri Adi")
    if (!phone1.trim()) missingFields.push("Telefon 1")
    if (!device.trim()) missingFields.push("Cihaz Türü")
    if (!brand.trim()) missingFields.push("Marka")
    if (!issue.trim()) missingFields.push("Arıza Açıklaması")

    if (missingFields.length > 0) {
      showToast("Lütfen zorunlu alanlari doldurun:\n\n" + missingFields.map(f => "• " + f).join("\n"), "error")
      return
    }

    const costNum = parseFloat(cost) || selectedRepair.cost
    const paidNum = paymentType === "partial" 
      ? (parseFloat(paidAmount) || selectedRepair.paid) 
      : (paymentType === "unpaid" ? 0 : costNum)
    const remainingNum = calculateRemaining(costNum, paidNum)

    try {
      const updatedRepair = await updateRepair(selectedRepair.id, {
        customerName,
        phone1,
        phone2,
        device,
        brand,
        model,
        issue,
        imei: imei.trim() || undefined,
        cost: costNum,
        paid: paidNum,
        remaining: remainingNum,
        paymentType: paymentType as Repair["paymentType"],
        notes: notesInput,
      })

      setRepairs(repairs.map((r) => r.id === selectedRepair.id ? updatedRepair : r))

      // Update finance if payment changed
      if (paidNum > selectedRepair.paid) {
        const diff = paidNum - selectedRepair.paid
        await createTransaction({
          type: "income",
          category: "Tamir Geliri",
          amount: diff,
          description: `${updatedRepair.brand} ${updatedRepair.model} - Ek Ödeme`,
          date: new Date().toISOString().split("T")[0],
          customer: updatedRepair.customerName,
          source: "repair",
        })
      }

      setIsEditDialogOpen(false)
      setSelectedRepair(null)
      showToast("Tamir kaydı güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Tamir kaydı güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleStatusChange = async (id: string, newStatus: Repair["status"]) => {
    const repair = repairs.find(r => r.id === id)
    if (!repair) return

    const wasAlreadyCompleted = repair.status === "completed"

    try {
      const updatedRepair = await updateRepair(id, {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString().split("T")[0] : repair.completedAt,
      })

      setRepairs(repairs.map((r) => r.id === id ? updatedRepair : r))

      // Add to finance when completed and has payment (sadece ilk kez tamamlanınca)
      if (newStatus === "completed" && !wasAlreadyCompleted && repair.paid > 0) {
        await createTransaction({
          type: "income",
          category: "Tamir Geliri",
          amount: repair.paid,
          description: `${repair.brand} ${repair.model} - Tamir Tamamlandı`,
          date: new Date().toISOString().split("T")[0],
          customer: repair.customerName,
          source: "repair",
        })
      }
    } catch (e) {
      console.error(e)
      showToast("Durum güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteRepair = async (id: string) => {
    if (confirm("Bu tamir kaydini silmek istediginize emin misiniz?")) {
      try {
        await deleteRepair(id)
        setRepairs(repairs.filter((r) => r.id !== id))
        setNotes(notes.filter((n) => n.repairId !== id))
        showToast("Tamir kaydı silindi.", "success")
      } catch (e) {
        console.error(e)
        showToast("Tamir kaydı silinirken bir sorun oluştu.", "error")
      }
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedRepair) return
    try {
      const newNote = await createRepairNote(selectedRepair.id, noteText)
      setNotes([newNote, ...notes])
      setNoteText("")
    } catch (e) {
      console.error(e)
      showToast("Not eklenirken bir sorun oluştu.", "error")
    }
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
    setImei(repair.imei || "")
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

  const openQrDialog = (repair: Repair) => {
    setSelectedRepair(repair)
    setIsQrDialogOpen(true)
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
    setImei("")
    setCost("")
    setPaymentType("unpaid")
    setPaidAmount("")
    setNotesInput("")
    setIsNewCustomer(false)
  }

  const getRepairNotes = (repairId: string) => notes.filter((n) => n.repairId === repairId)

  const sendWhatsApp = (repair: Repair) => {
    const cleanPhone = repair.phone1.replace(/\D/g, "")
    let message = `\uD83D\uDC4B Merhaba *${repair.customerName}*,\n\n`
    message += `\u2705 *${repair.brand} ${repair.model}* cihazınızın tamiri tamamlanmıştır. \uD83D\uDD27\n\n`

    if (repair.remaining > 0) {
      message += `\uD83D\uDCB0 *Toplam Ücret:* ${formatCurrency(repair.cost)}\n`
      message += `\uD83D\uDCB5 *Alınan:* ${formatCurrency(repair.paid)}\n`
      message += `\u23F3 *Kalan Bakiye:* ${formatCurrency(repair.remaining)}\n\n`
      message += `\uD83D\uDE4F Lütfen kalan tutarı getirerek cihazınızı teslim alınız.`
    } else {
      message += `\uD83C\uDF89 *Ücret tamamen ödenmiştir* (${formatCurrency(repair.cost)}).\n`
      message += `\u2705 Hemen teslim alabilirsiniz.`
    }

    message += `\n\n\uD83C\uDFEA *Yeşiltaş Teknoloji*\n\uD83D\uDCDE Bizi tercih ettiğiniz için teşekkür ederiz! \uD83D\uDE4F`

    window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🔧 Teknik Servis</h1>
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
                <Label className="text-slate-300">IMEI (opsiyonel)</Label>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white font-mono"
                  placeholder="15 haneli IMEI numarası"
                  maxLength={17}
                />
                {imei && !validateIMEI(imei) && (
                  <p className="text-xs text-red-400">IMEI 15 haneli olmalı.</p>
                )}
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
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>🔧 Tamir Listesi</span>
            <span className="text-sm text-slate-400">{filteredRepairs.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRepairs.length === 0 ? (
            <p className="text-slate-500 text-center py-8">📝 Kayıt bulunamadı.</p>
          ) : (
            <div className="space-y-2">
              {filteredRepairs.map((repair) => (
                <div key={repair.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-sm font-medium text-white">#{repair.id} — {repair.customerName}</div>
                      <div className="text-xs text-slate-400">
                        📱 {repair.phone1}{repair.phone2 ? ` / ${repair.phone2}` : ""} | 🔧 {repair.brand} {repair.model} | ⚠️ {repair.issue}
                      </div>
                      {repair.imei && (
                        <div className="text-xs text-slate-500 font-mono">IMEI: {repair.imei}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">📅 {repair.createdAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {formatCurrency(repair.cost)}
                        {repair.remaining > 0 && (
                          <span className="text-amber-400 text-xs font-normal ml-1">(Kalan: {formatCurrency(repair.remaining)})</span>
                        )}
                      </div>
                      <div className="flex gap-1 justify-end mt-1">
                        {getStatusBadge(repair.status)}
                        {getPaymentBadge(repair.paymentType, repair.remaining)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap items-center">
                    {repair.status === "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        onClick={() => sendWhatsApp(repair)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                      </Button>
                    )}
                    <Select
                      value={repair.status}
                      onValueChange={(v) => handleStatusChange(repair.id, v as Repair["status"])}
                    >
                      <SelectTrigger className="h-8 w-[140px] bg-slate-900 border-slate-600 text-xs text-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="waiting">⏳ Bekliyor</SelectItem>
                        <SelectItem value="in_progress">🔧 Devam Ediyor</SelectItem>
                        <SelectItem value="completed">✅ Tamamlandı</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      onClick={() => openNoteDialog(repair)}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />Not
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      onClick={() => openQrDialog(repair)}
                    >
                      <QrCode className="w-3 h-3 mr-1" />QR Kod
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      onClick={() => openEditDialog(repair)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />Düzenle
                    </Button>
                    {isManager && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDeleteRepair(repair.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Sil
                    </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <Label className="text-slate-300">IMEI (opsiyonel)</Label>
              <Input
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white font-mono"
                placeholder="15 haneli IMEI numarası"
                maxLength={17}
              />
              {imei && !validateIMEI(imei) && (
                <p className="text-xs text-red-400">IMEI 15 haneli olmalı.</p>
              )}
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

      <NoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        customerName={selectedRepair?.customerName}
        notes={getRepairNotes(selectedRepair?.id || "")}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onAddNote={handleAddNote}
      />

      <QrDialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen} repair={selectedRepair} />

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
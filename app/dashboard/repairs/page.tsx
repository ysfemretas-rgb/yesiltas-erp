"use client"

import { localDateStr } from "@/lib/dates"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Repair, RepairPart, fetchRepairs, createRepair, updateRepair, deleteRepair } from "@/lib/repairs"
import { InventoryItem, fetchInventory, adjustInventoryQuantity } from "@/lib/inventory"
import { fetchStaff, StaffMember } from "@/lib/staff"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { exportToExcel } from "@/lib/exportExcel"
import { SignaturePad } from "@/components/SignaturePad"
import { CustomerPicker } from "@/components/CustomerPicker"
import { RepairBoardDialog } from "@/components/repairs/RepairBoardDialog"
import { REPAIR_STAGES, RepairStage, QC_ITEMS, RepairQuote, QUOTE_LABELS, stageOf, stageLabel, statusForStage, reconcileStage, qcProgress, deliveryState } from "@/lib/repairWorkflow"
import { printRepairQuote } from "@/lib/repairQuote"
import { logActivity } from "@/lib/activityLog"
import { Pagination } from "@/components/Pagination"
import { Download as DownloadIcon, Trash2 as TrashIcon, Package as PackageIcon } from "lucide-react"
import { RepairNote as Note, fetchRepairNotes, createRepairNote } from "@/lib/repairNotes"
import { fetchCustomers, createCustomer } from "@/lib/customers"
import { validatePhone } from "@/lib/validation"
import { createTransaction, deleteTransactionsBySource } from "@/lib/finance"
import { getWhatsAppTemplates, renderTemplate } from "@/lib/whatsappTemplates"
import { QrDialog } from "@/components/repairs/QrDialog"
import { NoteDialog } from "@/components/repairs/NoteDialog"
import { getRepairStatusBadge as getStatusBadge, getRepairPaymentBadge as getPaymentBadge, formatCurrency } from "@/components/repairs/RepairBadges"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  QrCode,
  Printer
} from "lucide-react"
import { printRepairReceipt } from "@/lib/repairReceipt"
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog"


interface Customer {
  id: string
  customerCode?: string
  name: string
  phone1: string
  phone2: string
  email: string
  address: string
}


function RepairsPageContent() {
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [isRepairScannerOpen, setIsRepairScannerOpen] = useState(false)
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
  const [discount, setDiscount] = useState("")
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(20)
  const [paymentType, setPaymentType] = useState<string>("unpaid")
  const [paidAmount, setPaidAmount] = useState("")
  const [notesInput, setNotesInput] = useState("")
  const [technicianInput, setTechnicianInput] = useState("")
  const [estimatedInput, setEstimatedInput] = useState("")
  const [newEstimated, setNewEstimated] = useState("")
  const [boardOpen, setBoardOpen] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNote, setQuoteNote] = useState("")
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [stockItems, setStockItems] = useState<InventoryItem[]>([])
  const [partProductId, setPartProductId] = useState("")
  const [partQty, setPartQty] = useState("1")
  const [listPage, setListPage] = useState(1)
  const PAGE_SIZE = 20
  const { rates } = useExchangeRates()
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone1, setNewCustomerPhone1] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  useEffect(() => {
    let cancelled = false

    try {
      const companyRaw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
      if (companyRaw) {
        const parsed = JSON.parse(companyRaw)
        if (typeof parsed?.maxDiscountPercent === "number") setMaxDiscountPercent(parsed.maxDiscountPercent)
      }
    } catch (e) {
      console.error("Şirket ayarları okunamadı:", e)
    }

    fetchRepairNotes()
      .then((data) => {
        if (!cancelled) setNotes(data)
      })
      .catch((e) => console.error("Not verisi yüklenemedi:", e))

    fetchCustomers()
      .then((data) => {
        if (!cancelled) setCustomers(data.map(c => ({ id: c.id, customerCode: c.customerCode, name: c.name, phone1: c.phone1 || c.phone, phone2: c.phone2, email: c.email, address: c.address })))
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
    const totalRemaining = repairs.reduce((sum, r) => sum + Math.max(0, r.remaining), 0)
    const totalCredit = repairs.reduce((sum, r) => sum + Math.max(0, -r.remaining), 0)
    return { total, waiting, inProgress, completed, totalRevenue, totalRemaining, totalCredit }
  }, [repairs])

  // QR etiketi okutulduğunda (?open=<id> ile gelindiğinde) ilgili tamir
  // kaydını otomatik açar. (React kuralları gereği erken "return"lerden
  // önce, diğer hook'larla aynı yerde tanımlanmalı.)
  useEffect(() => {
    fetchStaff().then(setStaffList).catch((e) => console.error("Personel yüklenemedi:", e))
    fetchInventory().then(setStockItems).catch((e) => console.error("Envanter yüklenemedi:", e))
  }, [])

  useEffect(() => { setListPage(1) }, [search, statusFilter])

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
    setCost((repair.cost + (repair.discount || 0)).toString())
    setDiscount(repair.discount ? repair.discount.toString() : "")
    setPaymentType(repair.paymentType)
    setPaidAmount(repair.paid.toString())
    setNotesInput(repair.notes)
    setTechnicianInput(repair.technician || "")
    setEstimatedInput(repair.estimatedDelivery || "")
    setQuoteAmount(String(repair.quote?.amount ?? (repair.cost + (repair.discount || 0))))
    setQuoteNote(repair.quote?.note || "")
    setPartProductId("")
    setPartQty("1")
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    const openId = searchParams.get("open")
    if (!openId || repairs.length === 0) return
    const found = repairs.find((r) => r.id === openId)
    if (found) {
      openEditDialog(found)
      router.replace("/dashboard/repairs")
    } else {
      showToast("QR kodundaki tamir kaydı bulunamadı.", "error")
      router.replace("/dashboard/repairs")
    }
  }, [searchParams, repairs])

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
    if (!validatePhone(newCustomerPhone1)) {
      showToast("Telefon numarası geçerli görünmüyor (05XX XXX XX XX formatında olmalı).", "error")
      return
    }
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
        lastVisit: localDateStr(),
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

  // Kalan bakiye artık 0'da sınırlanmıyor: negatif çıkarsa müşteri fazla
  // ödemiş demektir — bu da bize borç değil, müşteriye "alacak" anlamına gelir.
  const calculateRemaining = (totalCost: number, paid: number) => {
    return totalCost - paid
  }

  const addFinanceTransaction = async (repair: Repair) => {
    if (repair.paid <= 0) return
    try {
      await createTransaction({
        type: "income",
        category: "Tamir Geliri",
        amount: repair.paid,
        description: `${repair.brand} ${repair.model} ${repair.device} Tamiri`,
        date: localDateStr(),
        customer: repair.customerName,
        source: "repair",
        sourceId: repair.id,
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
    const discountNum = parseFloat(discount) || 0
    const maxAllowedDiscount = costNum * maxDiscountPercent / 100
    if (discountNum > maxAllowedDiscount) {
      showToast(`İskonto izin verilen maksimum %${maxDiscountPercent}'i (${formatCurrency(maxAllowedDiscount)}) aşıyor.`, "error")
      return
    }
    const netCost = Math.max(0, costNum - discountNum)
    const isGift = paymentType === "gift"
    const paidNum = isGift ? 0 : (paymentType === "partial" ? (parseFloat(paidAmount) || 0) : (paymentType === "unpaid" ? 0 : netCost))
    const remainingNum = isGift ? 0 : calculateRemaining(netCost, paidNum)
    try {
      const newRepair = await createRepair({
        customerCode: customers.find(c => c.id === customerId)?.customerCode || "",
        customerName,
        phone1,
        phone2,
        device,
        brand,
        model,
        issue,
        imei: imei.trim() || undefined,
        status: "waiting",
        cost: netCost,
        discount: discountNum,
        paid: paidNum,
        remaining: remainingNum,
        paymentType: paymentType as Repair["paymentType"],
        notes: notesInput,
        stage: "received",
        estimatedDelivery: newEstimated || "",
        createdAt: localDateStr(),
      })
      setRepairs([newRepair, ...repairs])

      if (isGift && netCost > 0) {
        // Eşantiyon: müşteriden ücret alınmadı, ama verilen değeri kasaya gider (zarar) olarak yaz.
        try {
          await createTransaction({
            type: "expense",
            category: "Eşantiyon/Bedelsiz Verilen",
            amount: netCost,
            description: `🎁 Eşantiyon: ${newRepair.brand} ${newRepair.model} — ${newRepair.customerName}`,
            date: localDateStr(),
            customer: newRepair.customerName,
            source: "repair",
            sourceId: newRepair.id,
          })
        } catch (e) {
          console.error("Eşantiyon gider kaydı oluşturulamadı:", e)
        }
      } else if (paidNum > 0) {
        // Add to finance if payment made
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

    const costNum = parseFloat(cost) || (selectedRepair.cost + (selectedRepair.discount || 0))
    const discountNum = parseFloat(discount) || 0
    const maxAllowedDiscount = costNum * maxDiscountPercent / 100
    if (discountNum > maxAllowedDiscount) {
      showToast(`İskonto izin verilen maksimum %${maxDiscountPercent}'i (${formatCurrency(maxAllowedDiscount)}) aşıyor.`, "error")
      return
    }
    const netCost = Math.max(0, costNum - discountNum)
    const isGift = paymentType === "gift"
    const paidNum = isGift ? 0 : (paymentType === "partial"
      ? (parseFloat(paidAmount) || selectedRepair.paid)
      : (paymentType === "unpaid" ? 0 : netCost))
    const remainingNum = isGift ? 0 : calculateRemaining(netCost, paidNum)

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
        cost: netCost,
        discount: discountNum,
        paid: paidNum,
        remaining: remainingNum,
        paymentType: paymentType as Repair["paymentType"],
        notes: notesInput,
        technician: technicianInput,
        estimatedDelivery: estimatedInput || "",
      })

      setRepairs(repairs.map((r) => r.id === selectedRepair.id ? updatedRepair : r))

      if (isGift && netCost > 0 && selectedRepair.paymentType !== "gift") {
        try {
          await createTransaction({
            type: "expense",
            category: "Eşantiyon/Bedelsiz Verilen",
            amount: netCost,
            description: `🎁 Eşantiyon: ${updatedRepair.brand} ${updatedRepair.model} — ${updatedRepair.customerName}`,
            date: localDateStr(),
            customer: updatedRepair.customerName,
            source: "repair",
            sourceId: updatedRepair.id,
          })
        } catch (e) {
          console.error("Eşantiyon gider kaydı oluşturulamadı:", e)
        }
      } else if (!isGift && paidNum > selectedRepair.paid) {
        const diff = paidNum - selectedRepair.paid
        await createTransaction({
          type: "income",
          category: "Tamir Geliri",
          amount: diff,
          description: `${updatedRepair.brand} ${updatedRepair.model} - Ek Ödeme`,
          date: localDateStr(),
          customer: updatedRepair.customerName,
          source: "repair",
          sourceId: updatedRepair.id,
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


    try {
      const updatedRepair = await updateRepair(id, {
        status: newStatus,
        stage: reconcileStage(repair.stage, newStatus),
        completedAt: newStatus === "completed" ? localDateStr() : repair.completedAt,
      })

      setRepairs(repairs.map((r) => r.id === id ? updatedRepair : r))

      // Not: Alınan ödeme kasaya zaten kayıt açılırken / ödeme eklenirken yazılıyor.
      // Eskiden tamamlanınca aynı tutar ikinci kez gelire yazılıyordu (çift gelir).
    } catch (e) {
      console.error(e)
      showToast("Durum güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteRepair = async (id: string) => {
    if (confirm("Bu tamir kaydını silmek istediğinize emin misiniz?\n\n⚠️ Bu tamirden oluşan finans geliri kaydı da silinecek. Bu işlem geri alınamaz!")) {
      try {
        const target = repairs.find((r) => r.id === id)
        for (const part of target?.parts || []) {
          await adjustInventoryQuantity(part.productId, part.quantity, `Tamir silindi ${target?.repairCode || ""}`.trim(), part.name).catch((e) => console.error(e))
        }
        await deleteRepair(id)
        let financeFailed = false
        await deleteTransactionsBySource("repair", id).catch((err) => { console.error(err); financeFailed = true })
        setRepairs(repairs.filter((r) => r.id !== id))
        setNotes(notes.filter((n) => n.repairId !== id))
        if (financeFailed) showToast("Tamir silindi ancak kasa kayıtları silinemedi; Finans sayfasından kontrol edin.", "error")
        else showToast("Tamir kaydı silindi.", "success")
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

  const openNoteDialog = (repair: Repair) => {
    setSelectedRepair(repair)
    setIsNoteDialogOpen(true)
  }

  const openQrDialog = (repair: Repair) => {
    setSelectedRepair(repair)
    setIsQrDialogOpen(true)
  }

  const handleRepairQrScan = (scanned: string) => {
    let targetId: string | null = null
    try {
      const url = new URL(scanned)
      // Yeni etiketler /repair-status/<id> taşıyor; eski basılmış
      // etiketlerde ise ?open=<id> olabilir — ikisini de destekle.
      targetId = url.searchParams.get("open") || url.pathname.split("/repair-status/")[1]?.split(/[/?#]/)[0] || null
    } catch {
      // URL değil, muhtemelen bir tamir kodu (YTT-0001) — koda göre ara
    }
    const found = targetId
      ? repairs.find((r) => r.id === targetId)
      : repairs.find((r) => (r.repairCode || "").toLowerCase() === scanned.trim().toLowerCase())

    if (found) {
      openEditDialog(found)
      showToast(`Bulundu: ${found.customerName}`, "success")
    } else {
      showToast("Bu QR koduna ait tamir kaydı bulunamadı.", "error")
    }
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
    setDiscount("")
    setPaymentType("unpaid")
    setPaidAmount("")
    setNotesInput("")
    setNewEstimated("")
    setIsNewCustomer(false)
  }

  const getRepairNotes = (repairId: string) => notes.filter((n) => n.repairId === repairId)

  // Alış fiyatını TL'ye çevirir (parça maliyeti için)
  const costInTRY = (item: InventoryItem) => {
    const price = item.purchasePrice || 0
    if (item.purchaseCurrency === "USD") return Math.round(price * rates.USD * 100) / 100
    if (item.purchaseCurrency === "EUR") return Math.round(price * rates.EUR * 100) / 100
    return price
  }

  const sumPartsCost = (parts: RepairPart[]) => Math.round(parts.reduce((sum, p) => sum + p.unitCost * p.quantity, 0) * 100) / 100

  // Tamirde kullanılan parçayı ekler: stoktan düşer, maliyet tamire yazılır
  const addPart = async () => {
    if (!selectedRepair) return
    const product = stockItems.find(i => i.id === partProductId)
    const qty = Math.floor(Number(partQty))
    if (!product || !qty || qty < 1) {
      showToast("Parça ve adet seçin.", "error")
      return
    }
    if (qty > product.quantity) {
      showToast(`${product.name} — stokta sadece ${product.quantity} adet var.`, "error")
      return
    }
    const current = selectedRepair.parts || []
    const existing = current.find(p => p.productId === product.id)
    const nextParts: RepairPart[] = existing
      ? current.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + qty } : p)
      : [...current, { productId: product.id, name: product.name, quantity: qty, unitCost: costInTRY(product) }]
    try {
      await adjustInventoryQuantity(product.id, -qty, `Tamir ${selectedRepair.repairCode || ""}`.trim(), product.name)
      const updated = await updateRepair(selectedRepair.id, { parts: nextParts, partsCost: sumPartsCost(nextParts) })
      setSelectedRepair(updated)
      setRepairs(repairs.map(r => r.id === updated.id ? updated : r))
      setStockItems(stockItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity - qty } : i))
      setPartProductId("")
      setPartQty("1")
      showToast("Parça eklendi, stoktan düşüldü.", "success")
    } catch (e) {
      console.error(e)
      showToast("Parça eklenirken bir sorun oluştu (v4 SQL çalıştırıldı mı?).", "error")
    }
  }

  const removePart = async (index: number) => {
    if (!selectedRepair) return
    const current = selectedRepair.parts || []
    const part = current[index]
    if (!part) return
    const nextParts = current.filter((_, i) => i !== index)
    try {
      await adjustInventoryQuantity(part.productId, part.quantity, `Tamirden çıkarıldı ${selectedRepair.repairCode || ""}`.trim(), part.name)
      const updated = await updateRepair(selectedRepair.id, { parts: nextParts, partsCost: sumPartsCost(nextParts) })
      setSelectedRepair(updated)
      setRepairs(repairs.map(r => r.id === updated.id ? updated : r))
      setStockItems(stockItems.map(i => i.id === part.productId ? { ...i, quantity: i.quantity + part.quantity } : i))
      showToast("Parça çıkarıldı, stoğa geri eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Parça çıkarılırken bir sorun oluştu.", "error")
    }
  }

  const exportRepairs = () => {
    exportToExcel("tamirler", "Teknik Servis", filteredRepairs.map(r => ({
      "Tamir Kodu": r.repairCode || "",
      "Tarih": r.createdAt,
      "Müşteri": r.customerName,
      "Müşteri Kodu": r.customerCode || "",
      "Telefon": r.phone1,
      "Cihaz": `${r.brand} ${r.model}`.trim(),
      "IMEI": r.imei || "",
      "Arıza": r.issue,
      "Durum": r.status === "completed" ? "Tamamlandı" : r.status === "in_progress" ? "Devam Ediyor" : "Bekliyor",
      "Teknisyen": r.technician || "",
      "Aşama": stageLabel(stageOf(r)),
      "Tahmini Teslim": r.estimatedDelivery || "",
      "Ücret": r.cost,
      "Parça Maliyeti": r.partsCost || 0,
      "Kâr": r.paymentType === "gift" ? -(r.partsCost || 0) : r.cost - (r.partsCost || 0),
      "Alınan": r.paid,
      "Kalan": r.remaining,
    })))
  }

  // ---- Servis iş akışı, kalite kontrol, teklif ----
  const actorName = () => {
    try { return JSON.parse(localStorage.getItem("yt_user") || "{}")?.name || "" } catch { return "" }
  }

  const applyUpdated = (updated: Repair) => {
    setRepairs(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelectedRepair(prev => prev && prev.id === updated.id ? updated : prev)
  }

  const changeStage = async (repair: Repair, stage: RepairStage) => {
    const current = stageOf(repair)
    if (current === stage) return
    const status = statusForStage(stage)
    if ((stage === "ready" || stage === "delivered") && !qcProgress(repair.qc).complete) {
      const q = qcProgress(repair.qc)
      if (!confirm(`Kalite kontrol listesi tamamlanmadı (${q.done}/${q.total}).\n\n"${stageLabel(stage)}" aşamasına yine de geçilsin mi?`)) return
    }
    try {
      const updated = await updateRepair(repair.id, {
        stage,
        status,
        completedAt: status === "completed" ? (repair.completedAt || localDateStr()) : "",
      })
      applyUpdated(updated)
      logActivity("Teknik Servis", "updated", `${repair.repairCode || ""} ${repair.customerName}: aşama ${stageLabel(current)} → ${stageLabel(stage)}`.trim())
    } catch (e) {
      console.error(e)
      showToast("Aşama güncellenemedi (v8 SQL çalıştırıldı mı?).", "error")
    }
  }

  const toggleQc = async (key: string, forceAll?: boolean) => {
    if (!selectedRepair) return
    const base = selectedRepair.qc?.checks || {}
    const checks: Record<string, boolean> = forceAll
      ? Object.fromEntries(QC_ITEMS.map(i => [i.key, true]))
      : { ...base, [key]: !base[key] }
    try {
      const updated = await updateRepair(selectedRepair.id, { qc: { checks, by: actorName(), at: new Date().toLocaleString("tr-TR") } })
      applyUpdated(updated)
    } catch (e) {
      console.error(e)
      showToast("Kalite kontrol kaydedilemedi (v8 SQL çalıştırıldı mı?).", "error")
    }
  }

  const saveQuote = async () => {
    if (!selectedRepair) return
    const amount = Number(quoteAmount)
    if (!(amount > 0)) {
      showToast("Teklif tutarını girin.", "error")
      return
    }
    const quote: RepairQuote = { status: "pending", amount, note: quoteNote.trim(), createdAt: localDateStr() }
    const cur = stageOf(selectedRepair)
    const moveToApproval = cur === "received" || cur === "diagnosed"
    try {
      const updated = await updateRepair(selectedRepair.id, { quote, ...(moveToApproval ? { stage: "awaiting_approval", status: "waiting" as const } : {}) })
      applyUpdated(updated)
      logActivity("Teknik Servis", "updated", `${selectedRepair.repairCode || ""} ${selectedRepair.customerName}: teklif hazırlandı — ${amount.toLocaleString("tr-TR")} TL`.trim())
      showToast("Teklif kaydedildi. WhatsApp ile gönderebilir veya yazdırabilirsiniz.", "success")
    } catch (e) {
      console.error(e)
      showToast("Teklif kaydedilemedi (v8 SQL çalıştırıldı mı?).", "error")
    }
  }

  const sendQuoteWhatsApp = () => {
    if (!selectedRepair?.quote) return
    const phone = (selectedRepair.phone1 || "").replace(/\D/g, "").replace(/^0/, "").replace(/^90/, "")
    if (phone.length < 10) {
      showToast("Müşterinin telefon numarası geçersiz.", "error")
      return
    }
    const q = selectedRepair.quote
    const device = [selectedRepair.brand, selectedRepair.model].filter(Boolean).join(" ")
    const message = `Merhaba *${selectedRepair.customerName}*,\n\n*${device}* cihazınızın incelemesi tamamlandı.\n\n🔍 *Teşhis / yapılacak işlem:* ${q.note || selectedRepair.issue}\n💰 *Tamir ücreti:* ${formatCurrency(q.amount)}${selectedRepair.estimatedDelivery ? `\n📅 *Tahmini teslim:* ${selectedRepair.estimatedDelivery}` : ""}\n\nOnay verirseniz işleme başlayacağız. Onay için bu mesaja *EVET*, vazgeçmek için *HAYIR* yazmanız yeterlidir.\n\n🏪 *Yeşiltaş Teknoloji*`
    window.open(`https://wa.me/90${phone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const decideQuote = async (decision: "approved" | "rejected") => {
    if (!selectedRepair?.quote) return
    const q: RepairQuote = { ...selectedRepair.quote, status: decision, decidedAt: localDateStr(), decidedBy: actorName() }
    const patch: Partial<Repair> = { quote: q }
    const cur = stageOf(selectedRepair)
    if (decision === "approved") {
      if (cur === "received" || cur === "diagnosed" || cur === "awaiting_approval") {
        patch.stage = "in_repair"
        patch.status = "in_progress"
      }
      const currentGross = selectedRepair.cost + (selectedRepair.discount || 0)
      if (Math.abs(currentGross - q.amount) > 0.01 && confirm(`Tamir ücreti şu an ${formatCurrency(currentGross)}. Onaylanan teklif tutarına (${formatCurrency(q.amount)}) güncellensin mi?`)) {
        const net = Math.max(0, q.amount - (selectedRepair.discount || 0))
        patch.cost = net
        patch.remaining = selectedRepair.paymentType === "gift" ? 0 : net - selectedRepair.paid
      }
    }
    try {
      const updated = await updateRepair(selectedRepair.id, patch)
      applyUpdated(updated)
      logActivity("Teknik Servis", "updated", `${selectedRepair.repairCode || ""} ${selectedRepair.customerName}: teklif ${decision === "approved" ? "ONAYLANDI" : "REDDEDİLDİ"} (${q.amount.toLocaleString("tr-TR")} TL)`.trim())
      showToast(decision === "approved" ? "Teklif onaylandı; tamir aşamasına geçildi." : "Teklif reddedildi olarak kaydedildi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Karar kaydedilemedi.", "error")
    }
  }

  // İmza kayda hemen yazılır (Güncelle'ye basmayı beklemez)
  const saveSignature = async (url: string) => {
    if (!selectedRepair) return
    try {
      const updated = await updateRepair(selectedRepair.id, { signature: url })
      setSelectedRepair(updated)
      setRepairs(repairs.map(r => r.id === updated.id ? updated : r))
      showToast("İmza kaydedildi.", "success")
    } catch (e) {
      console.error(e)
      showToast("İmza kaydedilemedi (v5 SQL çalıştırıldı mı?).", "error")
    }
  }

  const sendWhatsApp = (repair: Repair) => {
    const cleanPhone = repair.phone1.replace(/\D/g, "")

    const odemeDurumu = repair.remaining > 0
      ? `\uD83D\uDCB0 *Toplam Ücret:* ${formatCurrency(repair.cost)}\n\uD83D\uDCB5 *Alınan:* ${formatCurrency(repair.paid)}\n\u23F3 *Kalan Bakiye:* ${formatCurrency(repair.remaining)}\n\n\uD83D\uDE4F Lütfen kalan tutarı getirerek cihazınızı teslim alınız.`
      : repair.remaining < 0
        ? `\uD83C\uDF89 *Ücret tamamen ödenmiştir* (${formatCurrency(repair.cost)}).\n\uD83D\uDCB5 *Fazla Ödeme (Alacağınız):* ${formatCurrency(-repair.remaining)}\n\u2705 Hemen teslim alabilirsiniz.`
        : `\uD83C\uDF89 *Ücret tamamen ödenmiştir* (${formatCurrency(repair.cost)}).\n\u2705 Hemen teslim alabilirsiniz.`

    // Mesaj tamirin gerçek durumuna göre hazırlanır (eskiden her zaman "tamamlandı" yazıyordu)
    const device = `${repair.brand} ${repair.model}`.trim()
    const message = repair.status === "completed"
      ? renderTemplate(getWhatsAppTemplates().repairs, {
          musteri: repair.customerName,
          cihaz: device,
          odeme_durumu: odemeDurumu,
        })
      : repair.status === "in_progress"
        ? `\uD83D\uDC4B Merhaba *${repair.customerName}*,\n\n\uD83D\uDD27 *${device}* cihazınızın tamir işlemi devam etmektedir. Tamamlandığında size haber vereceğiz.\n\n\uD83C\uDFEA *Yeşiltaş Teknoloji*`
        : `\uD83D\uDC4B Merhaba *${repair.customerName}*,\n\n\uD83D\uDCE5 *${device}* cihazınız teslim alınmıştır${repair.repairCode ? ` (Kayıt No: ${repair.repairCode})` : ""}. İnceleme sonrası size bilgi vereceğiz.\n\n\uD83C\uDFEA *Yeşiltaş Teknoloji*`

    window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">🔧 Teknik Servis</h1>
        <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setBoardOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
          📋 Pano
        </Button>
        <Button onClick={exportRepairs} variant="outline" className="border-slate-600 text-slate-300">
          <DownloadIcon className="h-4 w-4 mr-2" />Excel
        </Button>
        <Button onClick={() => setIsRepairScannerOpen(true)} variant="outline" className="border-slate-600 text-cyan-400">
          <QrCode className="h-4 w-4 mr-2" />QR Okut
        </Button>
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
                <CustomerPicker
                  customers={customers as any}
                  value={customerId}
                  onChange={(id) => handleCustomerSelect(id)}
                  onNew={() => handleCustomerSelect("new")}
                  placeholder="Müşteri ara, listeden seç veya yeni ekle..."
                />
              </div>

              {isNewCustomer && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-400 font-semibold">Yeni Müşteri Bilgileri</Label>
                    <Button 
                      variant="outline" 
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

              {phone1.trim().length >= 6 && (() => {
                const pastRepairs = repairs.filter(r => r.phone1 && r.phone1.replace(/\D/g, "") === phone1.replace(/\D/g, ""))
                if (pastRepairs.length === 0) return null
                return (
                  <div className="rounded-lg border border-indigo-700/50 bg-indigo-900/10 p-3">
                    <div className="text-sm font-medium text-indigo-300 mb-2">🕘 Bu müşteri daha önce {pastRepairs.length} kez geldi</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {pastRepairs.slice(0, 5).map(r => (
                        <div key={r.id} className="text-xs text-slate-400">
                          {r.createdAt} — {r.brand} {r.model} ({r.issue || "arıza belirtilmemiş"}) — {getStatusBadge(r.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

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
                <div className="space-y-2">
                  <Label className="text-slate-300">İskonto (TL)</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="0" />
                  {cost && (
                    <p className="text-xs text-slate-500">Maks. {formatCurrency((parseFloat(cost) || 0) * maxDiscountPercent / 100)} (%{maxDiscountPercent})</p>
                  )}
                </div>
              </div>

              {discount && parseFloat(discount) > 0 && (
                <div className={`rounded-lg border p-3 text-sm ${parseFloat(discount) > (parseFloat(cost) || 0) * maxDiscountPercent / 100 ? "border-red-500/30 bg-red-500/10" : "border-blue-500/30 bg-blue-500/10"}`}>
                  {parseFloat(discount) > (parseFloat(cost) || 0) * maxDiscountPercent / 100 ? (
                    <span className="text-red-400">⚠️ Bu iskonto izin verilen maksimum %{maxDiscountPercent}'i aşıyor, kaydedilemez.</span>
                  ) : (
                    <><span className="text-slate-400">Net Ücret:</span> <span className="text-blue-400 font-bold">{formatCurrency(Math.max(0, (parseFloat(cost) || 0) - (parseFloat(discount) || 0)))}</span></>
                  )}
                </div>
              )}

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
                      <SelectItem value="gift">🎁 Eşantiyon (Bedelsiz)</SelectItem>
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

              {paymentType === "gift" && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
                  🎁 Bu tamir bedelsiz (eşantiyon) olarak işaretlenecek. Müşteriden ücret alınmayacak, borç oluşmayacak — ancak ücret tutarı kasaya gider (zarar) olarak kaydedilecek.
                </div>
              )}

              {paymentType === "partial" && cost && paidAmount && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-slate-400">Toplam:</span> <span className="text-white font-bold">{formatCurrency(parseFloat(cost) || 0)}</span></div>
                    <div><span className="text-slate-400">Alınan:</span> <span className="text-emerald-400 font-bold">{formatCurrency(parseFloat(paidAmount) || 0)}</span></div>
                    {calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0) >= 0 ? (
                      <div><span className="text-slate-400">Kalan:</span> <span className="text-amber-400 font-bold">{formatCurrency(calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                    ) : (
                      <div><span className="text-slate-400">Fazla Ödeme:</span> <span className="text-cyan-400 font-bold">{formatCurrency(-calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Notlar</Label>
                <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="Ekstra notlar..." />
              </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Tahmini Teslim Tarihi (opsiyonel)</Label>
              <Input type="date" value={newEstimated} onChange={(e) => setNewEstimated(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
            </div>

              <Button onClick={handleAddRepair} className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
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
        {stats.totalCredit > 0 && (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Müşterilerin Bizden Alacağı (Fazla Ödeme)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">{formatCurrency(stats.totalCredit)}</div>
            </CardContent>
          </Card>
        )}
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
              {filteredRepairs.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE).map((repair) => (
                <div key={repair.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{repair.customerName}</span>
                        {repair.repairCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 border border-orange-800">{repair.repairCode}</span>
                        )}
                        {repair.customerCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">{repair.customerCode}</span>
                        )}
                      </div>
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
                        {repair.remaining < 0 && (
                          <span className="text-cyan-400 text-xs font-normal ml-1">(Alacaklı: {formatCurrency(-repair.remaining)})</span>
                        )}
                      </div>
                      {repair.discount > 0 && (
                        <div className="text-xs text-blue-400">🏷️ İskonto: {formatCurrency(repair.discount)}</div>
                      )}
                      {repair.paymentType === "gift" && (
                        <div className="text-xs text-purple-400">🎁 Eşantiyon</div>
                      )}
                      <div className="flex gap-1 justify-end mt-1">
                        {getStatusBadge(repair.status)}
                        {getPaymentBadge(repair.paymentType, repair.remaining)}
                      </div>
                      <div className="text-[11px] text-slate-400 text-right mt-1">
                        {REPAIR_STAGES.find(x => x.key === stageOf(repair))?.icon} {stageLabel(stageOf(repair))}
                        {repair.estimatedDelivery && (() => {
                          const d = deliveryState(repair.estimatedDelivery, repair.status, localDateStr())
                          return <span className={d === "late" ? "text-red-400" : d === "soon" ? "text-amber-400" : ""}> • ⏰ {repair.estimatedDelivery}{d === "late" ? " (geçti)" : ""}</span>
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap items-center">
                    {repair.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-400 hover:text-green-300 hover:bg-green-500/10"
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
                      variant="outline"
                      className="border-amber-600 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      onClick={() => openNoteDialog(repair)}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />Not
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-600 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      onClick={() => openQrDialog(repair)}
                    >
                      <QrCode className="w-3 h-3 mr-1" />QR Kod
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-500/10"
                      onClick={() => printRepairReceipt(repair)}
                    >
                      <Printer className="w-3 h-3 mr-1" />Fiş
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      onClick={() => openEditDialog(repair)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />Düzenle
                    </Button>
                    {isManager && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDeleteRepair(repair.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Sil
                    </Button>
                    )}
                  </div>
                </div>
              ))}
              <Pagination
                currentPage={listPage}
                totalPages={Math.ceil(filteredRepairs.length / PAGE_SIZE)}
                goToPage={(p) => setListPage(Math.max(1, Math.min(p, Math.ceil(filteredRepairs.length / PAGE_SIZE))))}
                goToNext={() => setListPage(p => Math.min(p + 1, Math.ceil(filteredRepairs.length / PAGE_SIZE)))}
                goToPrev={() => setListPage(p => Math.max(p - 1, 1))}
                totalItems={filteredRepairs.length}
                pageSize={PAGE_SIZE}
              />
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
              <div className="space-y-2">
                <Label className="text-slate-300">İskonto (TL)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" placeholder="0" />
                {cost && (
                  <p className="text-xs text-slate-500">Maks. {formatCurrency((parseFloat(cost) || 0) * maxDiscountPercent / 100)} (%{maxDiscountPercent})</p>
                )}
              </div>
            </div>

            {discount && parseFloat(discount) > 0 && (
              <div className={`rounded-lg border p-3 text-sm ${parseFloat(discount) > (parseFloat(cost) || 0) * maxDiscountPercent / 100 ? "border-red-500/30 bg-red-500/10" : "border-blue-500/30 bg-blue-500/10"}`}>
                {parseFloat(discount) > (parseFloat(cost) || 0) * maxDiscountPercent / 100 ? (
                  <span className="text-red-400">⚠️ Bu iskonto izin verilen maksimum %{maxDiscountPercent}'i aşıyor, kaydedilemez.</span>
                ) : (
                  <><span className="text-slate-400">Net Ücret:</span> <span className="text-blue-400 font-bold">{formatCurrency(Math.max(0, (parseFloat(cost) || 0) - (parseFloat(discount) || 0)))}</span></>
                )}
              </div>
            )}
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
                    <SelectItem value="gift">🎁 Eşantiyon (Bedelsiz)</SelectItem>
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

            {paymentType === "gift" && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
                🎁 Bu tamir bedelsiz (eşantiyon) olarak işaretlenecek. Müşteriden ücret alınmayacak, borç oluşmayacak — ücret tutarı kasaya gider (zarar) olarak kaydedilecek.
              </div>
            )}

            {paymentType === "partial" && cost && paidAmount && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-slate-400">Toplam:</span> <span className="text-white font-bold">{formatCurrency(parseFloat(cost) || 0)}</span></div>
                  <div><span className="text-slate-400">Alınan:</span> <span className="text-emerald-400 font-bold">{formatCurrency(parseFloat(paidAmount) || 0)}</span></div>
                  {calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0) >= 0 ? (
                    <div><span className="text-slate-400">Kalan:</span> <span className="text-amber-400 font-bold">{formatCurrency(calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                  ) : (
                    <div><span className="text-slate-400">Fazla Ödeme:</span> <span className="text-cyan-400 font-bold">{formatCurrency(-calculateRemaining(parseFloat(cost) || 0, parseFloat(paidAmount) || 0))}</span></div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Label className="text-slate-300">🧭 Servis Aşaması</Label>
              <Select value={selectedRepair ? stageOf(selectedRepair) : "received"} onValueChange={(v) => selectedRepair && changeStage(selectedRepair, v as RepairStage)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {REPAIR_STAGES.map(st => <SelectItem key={st.key} value={st.key} className="text-white">{st.icon} {st.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Label className="text-slate-300">Tahmini Teslim Tarihi</Label>
              <Input type="date" value={estimatedInput} onChange={(e) => setEstimatedInput(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              <p className="text-xs text-slate-500">Tarih "Güncelle" ile kaydedilir; aşama seçilince hemen kaydedilir.</p>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Label className="text-slate-300">📝 Müşteri Onaylı Teklif</Label>
              {selectedRepair?.quote && (
                <div className={`text-xs px-2 py-1 rounded border ${selectedRepair.quote.status === "approved" ? "border-emerald-700 text-emerald-300 bg-emerald-900/20" : selectedRepair.quote.status === "rejected" ? "border-red-700 text-red-300 bg-red-900/20" : "border-amber-700 text-amber-300 bg-amber-900/20"}`}>
                  {QUOTE_LABELS[selectedRepair.quote.status]} — {formatCurrency(selectedRepair.quote.amount)} ({selectedRepair.quote.createdAt}{selectedRepair.quote.decidedAt ? ` → ${selectedRepair.quote.decidedAt}${selectedRepair.quote.decidedBy ? `, ${selectedRepair.quote.decidedBy}` : ""}` : ""})
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" inputMode="decimal" placeholder="Tutar (TL)" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                <Input placeholder="Teşhis / yapılacak işlem" value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} className="bg-slate-800 border-slate-600 text-white col-span-2" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="button" size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={saveQuote}>Teklifi Kaydet</Button>
                {selectedRepair?.quote && (
                  <>
                    <Button type="button" size="sm" variant="outline" className="border-green-600 text-green-400" onClick={sendQuoteWhatsApp}>WhatsApp ile Gönder</Button>
                    <Button type="button" size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => selectedRepair.quote && printRepairQuote(selectedRepair, selectedRepair.quote)}>Yazdır</Button>
                  </>
                )}
              </div>
              {selectedRepair?.quote && selectedRepair.quote.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => decideQuote("approved")}>✅ Müşteri Onayladı</Button>
                  <Button type="button" size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => decideQuote("rejected")}>❌ Reddetti</Button>
                </div>
              )}
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Label className="text-slate-300 flex items-center justify-between">
                <span>✅ Kalite Kontrol Listesi</span>
                <span className="text-xs text-slate-400">{qcProgress(selectedRepair?.qc).done}/{qcProgress(selectedRepair?.qc).total}</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {QC_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer py-1">
                    <input type="checkbox" checked={!!selectedRepair?.qc?.checks?.[item.key]} onChange={() => toggleQc(item.key)} className="h-4 w-4" />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => toggleQc("", true)}>Hepsi tamam</Button>
                {selectedRepair?.qc?.by && <span className="text-xs text-slate-500">Son: {selectedRepair.qc.by}{selectedRepair.qc.at ? `, ${selectedRepair.qc.at}` : ""}</span>}
              </div>
              <p className="text-xs text-slate-500">Liste tamamlanmadan "Teslime Hazır / Teslim Edildi" aşamasına geçilirse uyarı çıkar.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Teknisyen</Label>
              <Select value={technicianInput || "__none__"} onValueChange={(v) => setTechnicianInput(v === "__none__" ? "" : v)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Teknisyen seçin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__none__" className="text-slate-400">— Atanmadı —</SelectItem>
                  {staffList.filter(m => m.status !== "inactive").map(m => (
                    <SelectItem key={m.id} value={m.name} className="text-white">{m.name}</SelectItem>
                  ))}
                  {technicianInput && !staffList.some(m => m.name === technicianInput) && (
                    <SelectItem value={technicianInput} className="text-white">{technicianInput}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Label className="text-slate-300 flex items-center gap-2"><PackageIcon className="h-4 w-4" />Kullanılan Parçalar</Label>
              {(selectedRepair?.parts || []).length === 0 && <p className="text-xs text-slate-500">Henüz parça eklenmedi. Eklenen parça stoktan otomatik düşer.</p>}
              {(selectedRepair?.parts || []).map((p, i) => (
                <div key={`${p.productId}-${i}`} className="flex items-center justify-between gap-2 text-sm p-2 bg-slate-900 rounded border border-slate-700">
                  <span className="text-white truncate">{p.name} <span className="text-slate-500">x{p.quantity}</span></span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-amber-400">{formatCurrency(p.unitCost * p.quantity)}</span>
                    <Button type="button" size="icon" variant="outline" className="h-6 w-6 text-red-400" onClick={() => removePart(i)}><TrashIcon className="h-3 w-3" /></Button>
                  </span>
                </div>
              ))}
              <div className="flex gap-2">
                <Select value={partProductId} onValueChange={setPartProductId}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white flex-1 min-w-0">
                    <SelectValue placeholder="Parça seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                    {stockItems.filter(i => i.quantity > 0).map(i => (
                      <SelectItem key={i.id} value={i.id} className="text-white">{i.name} (stok {i.quantity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} value={partQty} onChange={(e) => setPartQty(e.target.value)} className="w-16 bg-slate-800 border-slate-600 text-white" />
                <Button type="button" onClick={addPart} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /></Button>
              </div>
              {selectedRepair && (selectedRepair.partsCost || 0) > 0 && (
                <div className="flex justify-between text-sm pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Parça maliyeti: <span className="text-amber-400">{formatCurrency(selectedRepair.partsCost || 0)}</span></span>
                  <span className="text-slate-400">Tahmini kâr: <span className={selectedRepair.paymentType === "gift" || selectedRepair.cost - (selectedRepair.partsCost || 0) < 0 ? "text-red-400" : "text-emerald-400"}>{formatCurrency(selectedRepair.paymentType === "gift" ? -(selectedRepair.partsCost || 0) : selectedRepair.cost - (selectedRepair.partsCost || 0))}</span></span>
                </div>
              )}
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <Label className="text-slate-300">✍️ Müşteri İmzası</Label>
              {selectedRepair?.signature ? (
                <div className="space-y-2">
                  <img src={selectedRepair.signature} alt="İmza" className="h-20 rounded border border-slate-600 bg-white" />
                  <Button type="button" size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => saveSignature("")}>İmzayı Sil</Button>
                </div>
              ) : (
                <SignaturePad onSaved={saveSignature} />
              )}
              <p className="text-xs text-slate-500">İmza, Fiş yazdırıldığında "Teslim Eden (Müşteri)" alanında görünür.</p>
            </div>

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

      <RepairBoardDialog
        open={boardOpen}
        onOpenChange={setBoardOpen}
        repairs={repairs}
        onOpenRepair={(id) => { const r = repairs.find(x => x.id === id); if (r) { setBoardOpen(false); openEditDialog(r) } }}
        onMove={(id, stage) => { const r = repairs.find(x => x.id === id); if (r) changeStage(r, stage) }}
      />
      <QrDialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen} repair={selectedRepair} />

      <BarcodeScannerDialog
        open={isRepairScannerOpen}
        onOpenChange={setIsRepairScannerOpen}
        title="Tamir Kaydı QR Okut"
        onScan={handleRepairQrScan}
      />

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

export default function RepairsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="text-white">Yükleniyor...</div></div>}>
      <RepairsPageContent />
    </Suspense>
  )
}

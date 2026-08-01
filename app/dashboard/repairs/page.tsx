"use client"

import { useState } from "react"
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
import { Plus, Wrench, Search, Phone, User, Clock, CheckCircle2, XCircle, Printer, Save, Trash2, Edit3 } from "lucide-react"

interface Repair {
  id: number
  repairId: string
  customerName: string
  customerPhone: string
  deviceBrand: string
  deviceModel: string
  issue: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  cost: number
  paymentStatus: "paid" | "unpaid" | "partial"
  technician: string
  startDate: string
  endDate: string
  notes: string
}

const initialRepairs: Repair[] = [
  { id: 1, repairId: "TS-001", customerName: "Ahmet Yilmaz", customerPhone: "0555 123 4567", deviceBrand: "Apple", deviceModel: "iPhone 14 Pro", issue: "Ekran kirildi", status: "completed", cost: 3500, paymentStatus: "paid", technician: "Mehmet", startDate: "2024-01-10", endDate: "2024-01-12", notes: "Orijinal ekran takildi" },
  { id: 2, repairId: "TS-002", customerName: "Ayse Demir", customerPhone: "0555 345 6789", deviceBrand: "Samsung", deviceModel: "S23 Ultra", issue: "Batarya sismesi", status: "in_progress", cost: 1200, paymentStatus: "unpaid", technician: "Ahmet", startDate: "2024-01-15", endDate: "", notes: "" },
  { id: 3, repairId: "TS-003", customerName: "Fatma Sahin", customerPhone: "0555 456 7890", deviceBrand: "Apple", deviceModel: "MacBook Air M2", issue: "Anakart ariza", status: "pending", cost: 8500, paymentStatus: "unpaid", technician: "Mehmet", startDate: "2024-01-18", endDate: "", notes: "Anakart degisimi gerekebilir" },
  { id: 4, repairId: "TS-004", customerName: "Ali Veli", customerPhone: "0555 567 8901", deviceBrand: "Xiaomi", deviceModel: "Redmi Note 12", issue: "Sarj portu", status: "completed", cost: 450, paymentStatus: "paid", technician: "Ahmet", startDate: "2024-01-08", endDate: "2024-01-09", notes: "" },
  { id: 5, repairId: "TS-005", customerName: "Mehmet Kaya", customerPhone: "0555 234 5678", deviceBrand: "Apple", deviceModel: "iPad Air 5", issue: "Ekran degisimi", status: "cancelled", cost: 2800, paymentStatus: "unpaid", technician: "Mehmet", startDate: "2024-01-05", endDate: "2024-01-06", notes: "Musteri iptal etti" },
]

const technicians = ["Mehmet", "Ahmet", "Ayse", "Fatma"]
const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Huawei", "Diger"]

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>(initialRepairs)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null)
  const [newRepair, setNewRepair] = useState<Partial<Repair>>({
    status: "pending",
    paymentStatus: "unpaid",
    startDate: new Date().toISOString().split("T")[0],
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Beklemede</Badge>
      case "in_progress": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">Devam Ediyor</Badge>
      case "completed": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Tamamlandi</Badge>
      case "cancelled": return <Badge className="bg-red-900/50 text-red-300 border-red-700">Iptal</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-900/50 text-green-300 border-green-700"><CheckCircle2 className="h-3 w-3 mr-1"/>Odenmis</Badge>
      case "partial": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Kismi</Badge>
      case "unpaid": return <Badge className="bg-red-900/50 text-red-300 border-red-700"><XCircle className="h-3 w-3 mr-1"/>Odenmedi</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const filteredRepairs = repairs.filter((r) => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.repairId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const pendingCount = repairs.filter(r => r.status === "pending").length
  const inProgressCount = repairs.filter(r => r.status === "in_progress").length
  const completedCount = repairs.filter(r => r.status === "completed").length
  const totalRevenue = repairs.filter(r => r.status === "completed" && r.paymentStatus === "paid").reduce((sum, r) => sum + r.cost, 0)

  const handleAddRepair = () => {
    if (!newRepair.customerName || !newRepair.deviceModel) return
    const repair: Repair = {
      id: Date.now(),
      repairId: `TS-${String(repairs.length + 1).padStart(3, "0")}`,
      customerName: newRepair.customerName,
      customerPhone: newRepair.customerPhone || "",
      deviceBrand: newRepair.deviceBrand || "Diger",
      deviceModel: newRepair.deviceModel,
      issue: newRepair.issue || "",
      status: "pending",
      cost: Number(newRepair.cost) || 0,
      paymentStatus: "unpaid",
      technician: newRepair.technician || technicians[0],
      startDate: newRepair.startDate || new Date().toISOString().split("T")[0],
      endDate: "",
      notes: newRepair.notes || "",
    }
    setRepairs([repair, ...repairs])
    setNewRepair({ status: "pending", paymentStatus: "unpaid", startDate: new Date().toISOString().split("T")[0] })
    setIsDialogOpen(false)
  }

  const handleEditRepair = () => {
    if (!editingRepair) return
    setRepairs(repairs.map(r => r.id === editingRepair.id ? { ...r, ...newRepair, cost: Number(newRepair.cost) || r.cost } : r))
    setIsEditOpen(false)
    setEditingRepair(null)
  }

  const handleDeleteRepair = (id: number) => {
    setRepairs(repairs.filter(r => r.id !== id))
  }

  const openEdit = (repair: Repair) => {
    setEditingRepair(repair)
    setNewRepair({
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issue: repair.issue,
      status: repair.status,
      cost: repair.cost,
      paymentStatus: repair.paymentStatus,
      technician: repair.technician,
      startDate: repair.startDate,
      endDate: repair.endDate,
      notes: repair.notes,
    })
    setIsEditOpen(true)
  }

  const handlePrintReceipt = (repair: Repair) => {
    const receipt = `
YESILTAS TEKNOLOJI - TEKNIK SERVIS
=====================================
Servis No: ${repair.repairId}
Tarih: ${new Date().toLocaleDateString("tr-TR")}

MUSTERI BILGILERI
-----------------
Ad Soyad: ${repair.customerName}
Telefon: ${repair.customerPhone}

CIHAZ BILGILERI
---------------
Marka: ${repair.deviceBrand}
Model: ${repair.deviceModel}
Ariza: ${repair.issue}

SERVIS BILGILERI
----------------
Teknisyen: ${repair.technician}
Durum: ${repair.status}
Ucret: ₺${repair.cost.toLocaleString("tr-TR")}
Odeme: ${repair.paymentStatus}

Notlar: ${repair.notes || "-"}

Teslim Eden: _________________
Teslim Alan: _________________
    `.trim()

    const blob = new Blob([receipt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `servis-${repair.repairId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Teknik Servis</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Servis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Teknik Servis Kaydi</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Musteri Adi</label>
                  <Input
                    value={newRepair.customerName || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, customerName: e.target.value })}
                    placeholder="Ahmet Yilmaz"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input
                    value={newRepair.customerPhone || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, customerPhone: e.target.value })}
                    placeholder="0555 123 4567"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Marka</label>
                  <Select
                    value={newRepair.deviceBrand}
                    onValueChange={(value) => setNewRepair({ ...newRepair, deviceBrand: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand} className="text-white">{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Model</label>
                  <Input
                    value={newRepair.deviceModel || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, deviceModel: e.target.value })}
                    placeholder="iPhone 14 Pro"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ariza Aciklamasi</label>
                <Textarea
                  value={newRepair.issue || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, issue: e.target.value })}
                  placeholder="Cihazda yasanan sorun..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Teknisyen</label>
                  <Select
                    value={newRepair.technician}
                    onValueChange={(value) => setNewRepair({ ...newRepair, technician: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {technicians.map((tech) => (
                        <SelectItem key={tech} value={tech} className="text-white">{tech}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ucret</label>
                  <Input
                    type="number"
                    value={newRepair.cost || ""}
                    onChange={(e) => setNewRepair({ ...newRepair, cost: Number(e.target.value) })}
                    placeholder="0"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Textarea
                  value={newRepair.notes || ""}
                  onChange={(e) => setNewRepair({ ...newRepair, notes: e.target.value })}
                  placeholder="Ekstra notlar..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleAddRepair} className="w-full">
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
            <CardTitle className="text-sm font-medium text-slate-300">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Devam Eden</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Tamamlanan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gelir</CardTitle>
            <Printer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">₺{totalRevenue.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Servis Kayitlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Musteri, model veya servis no ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Tumu</SelectItem>
                <SelectItem value="pending" className="text-white">Beklemede</SelectItem>
                <SelectItem value="in_progress" className="text-white">Devam Ediyor</SelectItem>
                <SelectItem value="completed" className="text-white">Tamamlandi</SelectItem>
                <SelectItem value="cancelled" className="text-white">Iptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredRepairs.map((repair) => (
              <div key={repair.id} className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg text-white">{repair.deviceBrand} {repair.deviceModel}</span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">{repair.repairId}</Badge>
                    {getStatusBadge(repair.status)}
                    {getPaymentBadge(repair.paymentStatus)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {repair.customerName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {repair.customerPhone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Teknisyen: {repair.technician}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {repair.startDate} {repair.endDate && `- ${repair.endDate}`}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-slate-300">Ariza:</span> <span className="text-slate-400">{repair.issue}</span>
                  </div>
                  {repair.notes && (
                    <div className="mt-1 text-sm text-slate-500">
                      Not: {repair.notes}
                    </div>
                  )}
                  <div className="mt-2 text-lg font-bold text-white">
                    ₺{repair.cost.toLocaleString("tr-TR")}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(repair)} className="border-slate-600 text-slate-300 hover:text-white">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(repair)} className="border-slate-600 text-slate-300 hover:text-white">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteRepair(repair.id)}>
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
            <DialogTitle className="text-white">Servis Duzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Durum</label>
                <Select value={newRepair.status} onValueChange={(v) => setNewRepair({...newRepair, status: v as any})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pending" className="text-white">Beklemede</SelectItem>
                    <SelectItem value="in_progress" className="text-white">Devam Ediyor</SelectItem>
                    <SelectItem value="completed" className="text-white">Tamamlandi</SelectItem>
                    <SelectItem value="cancelled" className="text-white">Iptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Odeme</label>
                <Select value={newRepair.paymentStatus} onValueChange={(v) => setNewRepair({...newRepair, paymentStatus: v as any})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="paid" className="text-white">Odenmis</SelectItem>
                    <SelectItem value="unpaid" className="text-white">Odenmedi</SelectItem>
                    <SelectItem value="partial" className="text-white">Kismi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ucret</label>
              <Input type="number" value={newRepair.cost || ""} onChange={(e) => setNewRepair({...newRepair, cost: Number(e.target.value)})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button onClick={handleEditRepair}>
              <Save className="mr-2 h-4 w-4" />
              Guncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
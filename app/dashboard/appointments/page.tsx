"use client"

import { Toast, useToast } from "@/components/toast"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  CalendarDays, 
  Plus, 
  Search, 
  UserPlus,
  Clock,
  CheckCircle2,
  X,
  Save,
  Phone,
  Pencil,
  Trash2,
  MessageCircle,
  AlertTriangle,
  CalendarCheck
} from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
  phone1?: string
  phone2?: string
}

interface Appointment {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  date: string
  time: string
  service: string
  status: "scheduled" | "completed" | "cancelled"
  notes: string
}

const services = ["Ekran Değişimi", "Batarya Değişimi", "Anakart Tamiri", "Yazılım Güncelleme", "Genel Bakım"]

export default function AppointmentsPage() {

  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (!userData) {
      if (typeof window !== "undefined") window.location.href = "/"
      setChecking(false)
      return
    }
    try {
      const user = JSON.parse(userData)
      if (user.role === "Yönetici" || (user.permissions || []).includes("Randevular")) {
        setAuthorized(true)
      } else {
        if (typeof window !== "undefined") window.location.href = "/dashboard"
      }
    } catch {
      if (typeof window !== "undefined") window.location.href = "/"
    }
    setChecking(false)
  }, [])

  const [customers, setCustomers] = useState<Customer[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    status: "scheduled",
    service: services[0]
  })
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: ""
  })
  useEffect(() => {
    const savedCustomers = localStorage.getItem("yt_customers")
    const savedAppointments = localStorage.getItem("yt_appointments")

    if (savedCustomers) {
      try {
        const parsed = JSON.parse(savedCustomers)
        setCustomers(Array.isArray(parsed) ? parsed : [])
      } catch {
        setCustomers([])
      }
    }

    if (savedAppointments) {
      try {
        const parsed = JSON.parse(savedAppointments)
        setAppointments(Array.isArray(parsed) ? parsed : [])
      } catch {
        setAppointments([])
      }
    }
  }, [])
  useEffect(() => {
    localStorage.setItem("yt_appointments", JSON.stringify(appointments))
  }, [appointments])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null





  // Load from localStorage on mount

  // Save to localStorage

  const isPastDate = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const appDate = new Date(dateStr)
    appDate.setHours(0, 0, 0, 0)
    return appDate < today
  }

  const filteredAppointments = appointments.filter(a => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      a.customerName.toLowerCase().includes(searchLower) ||
      a.customerPhone.toLowerCase().includes(searchLower) ||
      a.service.toLowerCase().includes(searchLower)
    const matchesDate = (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo)
    return matchesSearch && matchesDate
  })

  const todayStr = new Date().toISOString().split("T")[0]
  const todayAppointments = appointments.filter(a => a.date === todayStr && a.status === "scheduled").length
  const weekAppointments = appointments.filter(a => {
    const appDate = new Date(a.date)
    const today = new Date()
    const diff = Math.ceil((appDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7 && a.status === "scheduled"
  }).length
  const pendingAppointments = appointments.filter(a => a.status === "scheduled").length
  const pastAppointments = appointments.filter(a => isPastDate(a.date) && a.status === "scheduled").length

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return
    const customer: Customer = {
      id: Date.now(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      phone1: newCustomer.phone,
      phone2: ""
    }
    const updated = [customer, ...customers]
    setCustomers(updated)
    localStorage.setItem("yt_customers", JSON.stringify(updated))
    setNewCustomer({ name: "", phone: "" })
    setIsNewCustomerOpen(false)
  }

  const validateAppointment = (appt: Partial<Appointment>) => {
    const missing: string[] = []
    if (!appt.customerId) missing.push("Müşteri")
    if (!appt.date) missing.push("Tarih")
    if (!appt.time) missing.push("Saat")
    if (missing.length > 0) {
      showToast("Lütfen zorunlu alanları doldurun: " + missing.join(", "), "error")
      return false
    }
    return true
  }

  const handleAddAppointment = () => {
    if (!validateAppointment(newAppointment)) return

    const customer = customers.find(c => c.id === Number(newAppointment.customerId))
    if (!customer) {
      showToast("Müşteri bulunamadı!", "error")
      return
    }

    const appointment: Appointment = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || customer.phone1 || "",
      date: newAppointment.date || new Date().toISOString().split("T")[0],
      time: newAppointment.time || "09:00",
      service: newAppointment.service || services[0],
      status: "scheduled",
      notes: newAppointment.notes || ""
    }

    setAppointments([appointment, ...appointments])
    setNewAppointment({
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      status: "scheduled",
      service: services[0]
    })
    setIsNewAppointmentOpen(false)
  }

  const handleUpdateAppointment = () => {
    if (!editingAppointment) return
    if (!validateAppointment(editingAppointment)) return

    setAppointments(appointments.map(a => a.id === editingAppointment.id ? editingAppointment : a))
    setIsEditOpen(false)
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = (id: number) => {
    if (!confirm(`Bu randevu kaydını silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    setAppointments(appointments.filter(a => a.id !== id))
  }

  const updateStatus = (id: number, status: Appointment["status"]) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
  }

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment({ ...appointment })
    setIsEditOpen(true)
  }

  const sendWhatsApp = (appointment: Appointment) => {
    try {
      if (!appointment) {
        showToast("Randevu bilgisi bulunamadı!", "error")
        return
      }

      let phone = appointment.customerPhone || ""
      let customerName = appointment.customerName || "Müşteri"

      if (!phone && appointment.customerId && customers.length > 0) {
        const customer = customers.find(c => c.id === appointment.customerId)
        if (customer) {
          phone = customer.phone || customer.phone1 || ""
          customerName = customer.name
        }
      }

      if (!phone) {
        showToast("Müşteri telefon numarası bulunamadı!", "error")
        return
      }

      let cleanPhone = String(phone).replace(/\D/g, "")
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1)
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        showToast("Geçersiz telefon numarası!", "error")
        return
      }

      const dateStr = new Date(appointment.date).toLocaleDateString("tr-TR")
      const isPast = isPastDate(appointment.date)

      let message = ""
      if (isPast) {
        message = `\u{1F44B} Merhaba *${customerName}*,\n\n`
        message += `\u{26A0} *Yeşiltaş Teknoloji*'den randevu hatırlatmasıdır.\n\n`
        message += `\u{1F4C5} Randevu tarihiniz (*${dateStr} - ${appointment.time}*) geçmiştir.\n\n`
        message += `\u{1F527} Hizmet: *${appointment.service}*\n\n`
        message += `\u{1F4DE} Lütfen yeni bir randevu oluşturmak için bizimle iletişime geçiniz.\n\n`
        message += `\u{1F64F} İyi günler dileriz!\n`
        message += `\u{1F3EA} *Yeşiltaş Teknoloji*`
      } else {
        message = `\u{1F44B} Merhaba *${customerName}*,\n\n`
        message += `\u{2705} *Yeşiltaş Teknoloji*'den randevu hatırlatmasıdır.\n\n`
        message += `\u{1F4C5} Randevu tarihiniz: *${dateStr} - ${appointment.time}*\n\n`
        message += `\u{1F527} Hizmet: *${appointment.service}*\n\n`
        message += `\u{23F0} Lütfen randevu saatinde gelmeyi unutmayınız.\n\n`
        message += `\u{1F64F} İyi günler dileriz!\n`
        message += `\u{1F3EA} *Yeşiltaş Teknoloji*`
      }

      if (appointment.notes) {
        message += `\n\n\u{1F4DD} Not: ${appointment.notes}`
      }

      window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
    } catch (err) {
      console.error("WhatsApp error:", err)
      showToast("WhatsApp gönderilirken hata oluştu!", "error")
    }
  }

  const getStatusBadge = (status: string, isPast: boolean) => {
    if (isPast && status === "scheduled") {
      return <Badge className="bg-orange-900/50 text-orange-300 border-orange-700"><AlertTriangle className="mr-1 h-3 w-3"/>Geçmiş</Badge>
    }
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700"><Clock className="mr-1 h-3 w-3"/>Planlandı</Badge>
      case "completed": return <Badge className="bg-green-900/50 text-green-300 border-green-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Tamamlandı</Badge>
      case "cancelled": return <Badge className="bg-red-900/50 text-red-300 border-red-700"><X className="mr-1 h-3 w-3"/>İptal</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const { toast, showToast, hideToast } = useToast()

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Randevular</h1>
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Randevu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Randevu</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Müşteri <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <Select value={String(newAppointment.customerId || "")} onValueChange={(v) => setNewAppointment({...newAppointment, customerId: Number(v)})}>
                    <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {customers.map(c => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-white">
                          {c.name} - {c.phone || c.phone1 || "Telefon yok"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tarih <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Saat <span className="text-red-400">*</span></label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Hizmet</label>
                <Select value={newAppointment.service} onValueChange={(v) => setNewAppointment({...newAppointment, service: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {services.map(s => (
                      <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={newAppointment.notes || ""}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ek notlar..."
                />
              </div>

              <Button onClick={handleAddAppointment} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Randevu Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{pendingAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bugün</CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{todayAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Geçmiş</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{pastAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{appointments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Randevu Listesi
            </span>
            <span className="text-sm text-slate-400">{appointments.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Müşteri adı, telefon veya hizmet ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 bg-slate-800 border-slate-700 text-white"
                placeholder="Başlangıç"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 bg-slate-800 border-slate-700 text-white"
                placeholder="Bitiş"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAppointments.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Randevu bulunamadı.</p>
              </div>
            )}
            {filteredAppointments.map((appointment) => {
              const isPast = isPastDate(appointment.date)
              return (
                <div key={appointment.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-white text-lg">{appointment.customerName}</span>
                        {getStatusBadge(appointment.status, isPast)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-2">
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500"/> {appointment.customerPhone}</div>
                        <div><span className="text-slate-500">Hizmet:</span> {appointment.service}</div>
                        <div><span className="text-slate-500">Tarih:</span> {appointment.date}</div>
                        <div><span className="text-slate-500">Saat:</span> {appointment.time}</div>
                      </div>
                      {appointment.notes && (
                        <div className="text-sm text-slate-500">
                          Not: {appointment.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Button size="sm" variant="outline" onClick={() => sendWhatsApp(appointment)} className="border-green-700 text-green-400 hover:bg-green-900/30">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(appointment)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {appointment.status === "scheduled" && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(appointment.id, "completed")} className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(appointment.id, "cancelled")} className="bg-red-900/50 hover:bg-red-800 border-red-800">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteAppointment(appointment.id)} className="bg-red-900/50 hover:bg-red-800 border-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Randevu Düzenle</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Müşteri</label>
                <Select value={String(editingAppointment.customerId)} onValueChange={(v) => {
                  const customer = customers.find(c => c.id === Number(v))
                  if (customer) {
                    setEditingAppointment({...editingAppointment, customerId: customer.id, customerName: customer.name, customerPhone: customer.phone || customer.phone1 || ""})
                  }
                }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {customers.map(c => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-white">
                        {c.name} - {c.phone || c.phone1 || "Telefon yok"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tarih <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    value={editingAppointment.date}
                    onChange={(e) => setEditingAppointment({...editingAppointment, date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Saat <span className="text-red-400">*</span></label>
                  <Input
                    type="time"
                    value={editingAppointment.time}
                    onChange={(e) => setEditingAppointment({...editingAppointment, time: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Hizmet</label>
                <Select value={editingAppointment.service} onValueChange={(v) => setEditingAppointment({...editingAppointment, service: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {services.map(s => (
                      <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Durum</label>
                <Select value={editingAppointment.status} onValueChange={(v) => setEditingAppointment({...editingAppointment, status: v as Appointment["status"]})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="scheduled" className="text-white">Planlandı</SelectItem>
                    <SelectItem value="completed" className="text-white">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled" className="text-white">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={editingAppointment.notes}
                  onChange={(e) => setEditingAppointment({...editingAppointment, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ek notlar..."
                />
              </div>

              <Button onClick={handleUpdateAppointment} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Güncelle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ad Soyad <span className="text-red-400">*</span></label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Telefon <span className="text-red-400">*</span></label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0555 123 4567"
              />
            </div>
            <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              Müşteri Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
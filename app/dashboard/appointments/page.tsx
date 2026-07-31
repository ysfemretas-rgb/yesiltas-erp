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
  CalendarDays, 
  Plus, 
  Search, 
  UserPlus,
  Clock,
  CheckCircle2,
  X,
  Save,
  Phone
} from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
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

const initialCustomers: Customer[] = [
  { id: 1, name: "Ahmet Yilmaz", phone: "0555 123 4567" },
  { id: 2, name: "Mehmet Kaya", phone: "0555 234 5678" },
]

const services = ["Ekran Degisimi", "Batarya Degisimi", "Anakart Tamiri", "Yazilim Guncelleme", "Genel Bakim"]

const initialAppointments: Appointment[] = [
  {
    id: 1,
    customerId: 1,
    customerName: "Ahmet Yilmaz",
    customerPhone: "0555 123 4567",
    date: "2024-08-02",
    time: "14:30",
    service: "Ekran Degisimi",
    status: "scheduled",
    notes: "Orijinal ekran istiyor"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Mehmet Kaya",
    customerPhone: "0555 234 5678",
    date: "2024-08-03",
    time: "10:00",
    service: "Batarya Degisimi",
    status: "scheduled",
    notes: ""
  }
]

export default function AppointmentsPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  
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

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.service.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo)
    return matchesSearch && matchesDate
  })

  const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length
  const weekAppointments = appointments.filter(a => {
    const appDate = new Date(a.date)
    const today = new Date()
    const diff = Math.ceil((appDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  }).length

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return
    const customer: Customer = {
      id: Date.now(),
      name: newCustomer.name,
      phone: newCustomer.phone
    }
    setCustomers([customer, ...customers])
    setNewCustomer({ name: "", phone: "" })
    setIsNewCustomerOpen(false)
  }

  const handleAddAppointment = () => {
    if (!newAppointment.customerId || !newAppointment.date || !newAppointment.time) return
    
    const customer = customers.find(c => c.id === Number(newAppointment.customerId))
    if (!customer) return

    const appointment: Appointment = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      date: newAppointment.date,
      time: newAppointment.time,
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

  const updateStatus = (id: number, status: Appointment["status"]) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700"><Clock className="mr-1 h-3 w-3"/>Planlandi</Badge>
      case "completed": return <Badge className="bg-green-900/50 text-green-300 border-green-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Tamamlandi</Badge>
      case "cancelled": return <Badge className="bg-red-900/50 text-red-300 border-red-700"><X className="mr-1 h-3 w-3"/>Iptal</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Randevular</h1>
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <label className="text-sm font-medium text-slate-300">Musteri</label>
                <div className="flex gap-2">
                  <Select value={String(newAppointment.customerId)} onValueChange={(v) => setNewAppointment({...newAppointment, customerId: Number(v)})}>
                    <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Musteri secin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {customers.map(c => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-white">
                          {c.name} - {c.phone}
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
                  <label className="text-sm font-medium text-slate-300">Tarih *</label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Saat *</label>
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

              <Button onClick={handleAddAppointment} disabled={!newAppointment.customerId || !newAppointment.date || !newAppointment.time}>
                <Save className="mr-2 h-4 w-4" />
                Randevu Olustur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bugun</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{todayAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bu Hafta</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{weekAppointments}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{appointments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Randevu Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Musteri veya hizmet ara..."
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
                placeholder="Baslangic"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40 bg-slate-800 border-slate-700 text-white"
                placeholder="Bitis"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white text-lg">{appointment.customerName}</span>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-2">
                      <div><span className="text-slate-500">Telefon:</span> {appointment.customerPhone}</div>
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
                  <div className="flex gap-2">
                    {appointment.status === "scheduled" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(appointment.id, "completed")}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(appointment.id, "cancelled")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
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
            <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
              <Save className="mr-2 h-4 w-4" />
              Musteri Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
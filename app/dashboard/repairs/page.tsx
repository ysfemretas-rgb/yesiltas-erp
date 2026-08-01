"use client"

import { useState } from "react"
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
  Wrench, 
  Plus, 
  Search, 
  UserPlus,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Phone
} from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
  phone2?: string
}

interface Device {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  deviceName: string
  imei: string
  problem: string
  status: "waiting" | "in_progress" | "ready" | "delivered"
  technician: string
  price?: number
  notes: string
  dateReceived: string
  dateReady?: string
}

const initialCustomers: Customer[] = [
  { id: 1, name: "Ahmet Yilmaz", phone: "0555 123 4567" },
  { id: 2, name: "Mehmet Kaya", phone: "0555 234 5678" },
  { id: 3, name: "Ayse Demir", phone: "0555 345 6789" },
]

const technicians = ["Ahmet Teknisyen", "Mehmet Teknisyen", "Ali Teknisyen"]

const initialDevices: Device[] = [
  {
    id: 1,
    customerId: 1,
    customerName: "Ahmet Yilmaz",
    customerPhone: "0555 123 4567",
    deviceName: "iPhone 14 Pro",
    imei: "123456789012345",
    problem: "Ekran kirildi",
    status: "waiting",
    technician: "Ahmet Teknisyen",
    notes: "Orijinal ekran takilacak",
    dateReceived: "2024-08-01"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Mehmet Kaya",
    customerPhone: "0555 234 5678",
    deviceName: "Samsung S23",
    imei: "987654321098765",
    problem: "Batarya sorunu",
    status: "in_progress",
    technician: "Mehmet Teknisyen",
    price: 800,
    notes: "Batarya degisimi yapiliyor",
    dateReceived: "2024-07-31"
  }
]

export default function DevicesPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isNewDeviceOpen, setIsNewDeviceOpen] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  
  const [newDevice, setNewDevice] = useState<Partial<Device>>({
    status: "waiting",
    technician: technicians[0],
    dateReceived: new Date().toISOString().split("T")[0]
  })
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: ""
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700"><Clock className="mr-1 h-3 w-3"/>Bekliyor</Badge>
      case "in_progress": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700"><Wrench className="mr-1 h-3 w-3"/>Devam Ediyor</Badge>
      case "ready": return <Badge className="bg-green-900/50 text-green-300 border-green-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Hazir</Badge>
      case "delivered": return <Badge className="bg-slate-700 text-slate-300">Teslim Edildi</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.imei.includes(searchTerm)
    const matchesStatus = filterStatus === "all" || d.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const waitingCount = devices.filter(d => d.status === "waiting").length
  const inProgressCount = devices.filter(d => d.status === "in_progress").length
  const readyCount = devices.filter(d => d.status === "ready").length

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

  const handleAddDevice = () => {
    if (!newDevice.deviceName || !newDevice.imei || !newDevice.customerId) return
    
    const customer = customers.find(c => c.id === Number(newDevice.customerId))
    if (!customer) return

    const device: Device = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deviceName: newDevice.deviceName,
      imei: newDevice.imei,
      problem: newDevice.problem || "",
      status: "waiting",
      technician: newDevice.technician || technicians[0],
      price: newDevice.price ? Number(newDevice.price) : undefined,
      notes: newDevice.notes || "",
      dateReceived: newDevice.dateReceived || new Date().toISOString().split("T")[0]
    }

    setDevices([device, ...devices])
    setNewDevice({
      status: "waiting",
      technician: technicians[0],
      dateReceived: new Date().toISOString().split("T")[0]
    })
    setIsNewDeviceOpen(false)
  }

  const updateStatus = (deviceId: number, newStatus: Device["status"]) => {
    setDevices(devices.map(d => 
      d.id === deviceId 
        ? { ...d, status: newStatus, dateReady: newStatus === "ready" ? new Date().toISOString().split("T")[0] : d.dateReady }
        : d
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Teknik Servis</h1>
        <Dialog open={isNewDeviceOpen} onOpenChange={setIsNewDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Cihaz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Cihaz Kaydi</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Musteri</label>
                <div className="flex gap-2">
                  <Select value={String(newDevice.customerId)} onValueChange={(v) => setNewDevice({...newDevice, customerId: Number(v)})}>
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
                  <label className="text-sm font-medium text-slate-300">Cihaz Adi *</label>
                  <Input
                    value={newDevice.deviceName || ""}
                    onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="iPhone 14 Pro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">IMEI *</label>
                  <Input
                    value={newDevice.imei || ""}
                    onChange={(e) => setNewDevice({...newDevice, imei: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="123456789012345"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Sorun Aciklamasi</label>
                <Input
                  value={newDevice.problem || ""}
                  onChange={(e) => setNewDevice({...newDevice, problem: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ekran kirildi, batarya sorunu..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Teknisyen</label>
                  <Select value={newDevice.technician} onValueChange={(v) => setNewDevice({...newDevice, technician: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {technicians.map(t => (
                        <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ucret (Belirli degilse bos birakin)</label>
                  <Input
                    type="number"
                    value={newDevice.price || ""}
                    onChange={(e) => setNewDevice({...newDevice, price: Number(e.target.value)})}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={newDevice.notes || ""}
                  onChange={(e) => setNewDevice({...newDevice, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ek notlar..."
                />
              </div>

              <Button onClick={handleAddDevice} disabled={!newDevice.deviceName || !newDevice.imei || !newDevice.customerId}>
                <Save className="mr-2 h-4 w-4" />
                Cihaz Kaydet
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
            <div className="text-2xl font-bold text-yellow-500">{waitingCount}</div>
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
            <CardTitle className="text-sm font-medium text-slate-300">Hazir</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{readyCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{devices.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Cihaz Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Cihaz, musteri veya IMEI ara..."
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
                <SelectItem value="all" className="text-white">Tumu</SelectItem>
                <SelectItem value="waiting" className="text-white">Bekliyor</SelectItem>
                <SelectItem value="in_progress" className="text-white">Devam Ediyor</SelectItem>
                <SelectItem value="ready" className="text-white">Hazir</SelectItem>
                <SelectItem value="delivered" className="text-white">Teslim Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredDevices.map((device) => (
              <div key={device.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white text-lg">{device.deviceName}</span>
                      {getStatusBadge(device.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-2">
                      <div><span className="text-slate-500">Musteri:</span> {device.customerName}</div>
                      <div><span className="text-slate-500">Telefon:</span> {device.customerPhone}</div>
                      <div><span className="text-slate-500">IMEI:</span> {device.imei}</div>
                      <div><span className="text-slate-500">Teknisyen:</span> {device.technician}</div>
                    </div>
                    <div className="text-sm text-slate-300 mb-1">
                      <span className="text-slate-500">Sorun:</span> {device.problem}
                    </div>
                    {device.price && (
                      <div className="text-sm font-medium text-green-400">
                        Ucret: ₺{device.price}
                      </div>
                    )}
                    {device.notes && (
                      <div className="text-sm text-slate-500 mt-1">
                        Not: {device.notes}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 mt-2">
                      Giris: {device.dateReceived} {device.dateReady && `| Hazir: ${device.dateReady}`}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {device.status === "waiting" && (
                      <Button size="sm" onClick={() => updateStatus(device.id, "in_progress")}>
                        Baslat
                      </Button>
                    )}
                    {device.status === "in_progress" && (
                      <Button size="sm" onClick={() => updateStatus(device.id, "ready")}>
                        Hazir
                      </Button>
                    )}
                    {device.status === "ready" && (
                      <Button size="sm" onClick={() => updateStatus(device.id, "delivered")}>
                        Teslim Et
                      </Button>
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
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
import { Plus, Shield, AlertTriangle, Search, Calendar, Clock } from "lucide-react"
import { format, differenceInDays, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

interface Warranty {
  id: number
  deviceName: string
  customerName: string
  customerPhone: string
  warrantyType: string
  startDate: string
  endDate: string
  status: "active" | "expired" | "expiring"
  notes: string
}

const initialWarranties: Warranty[] = [
  { id: 1, deviceName: "iPhone 14 Pro", customerName: "Ahmet Yılmaz", customerPhone: "0555 123 4567", warrantyType: "Ekran Değişimi", startDate: "2024-01-15", endDate: "2024-07-15", status: "active", notes: "Orijinal parça kullanıldı" },
  { id: 2, deviceName: "Samsung S23", customerName: "Mehmet Kaya", customerPhone: "0555 234 5678", warrantyType: "Batarya Değişimi", startDate: "2023-08-01", endDate: "2024-02-01", status: "expired", notes: "" },
  { id: 3, deviceName: "iPad Air 5", customerName: "Ayşe Demir", customerPhone: "0555 345 6789", warrantyType: "Ekran Değişimi", startDate: "2024-06-20", endDate: "2024-12-20", status: "active", notes: "" },
  { id: 4, deviceName: "MacBook Air M2", customerName: "Fatma Şahin", customerPhone: "0555 456 7890", warrantyType: "Anakart Tamir", startDate: "2024-01-10", endDate: "2024-07-10", status: "expiring", notes: "Anakart değişimi yapıldı" },
  { id: 5, deviceName: "iPhone 13", customerName: "Ali Veli", customerPhone: "0555 567 8901", warrantyType: "Arka Kapak", startDate: "2024-05-01", endDate: "2024-11-01", status: "active", notes: "" },
]

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>(initialWarranties)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWarranty, setNewWarranty] = useState<Partial<Warranty>>({
    warrantyType: "Ekran Değişimi",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  })

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date())
    return days
  }

  const getStatusBadge = (warranty: Warranty) => {
    const days = getDaysRemaining(warranty.endDate)
    if (days < 0) return <Badge variant="destructive">Süresi Doldu</Badge>
    if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-800">Bitiyor ({days} gün)</Badge>
    return <Badge className="bg-green-100 text-green-800">Aktif ({days} gün)</Badge>
  }

  const filteredWarranties = warranties.filter((w) => {
    const matchesSearch = w.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || w.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const activeCount = warranties.filter(w => w.status === "active").length
  const expiringCount = warranties.filter(w => w.status === "expiring").length
  const expiredCount = warranties.filter(w => w.status === "expired").length

  const handleAddWarranty = () => {
    if (!newWarranty.deviceName || !newWarranty.customerName) return
    const warranty: Warranty = {
      id: Date.now(),
      deviceName: newWarranty.deviceName,
      customerName: newWarranty.customerName,
      customerPhone: newWarranty.customerPhone || "",
      warrantyType: newWarranty.warrantyType || "Genel",
      startDate: newWarranty.startDate || new Date().toISOString().split("T")[0],
      endDate: newWarranty.endDate || new Date().toISOString().split("T")[0],
      status: "active",
      notes: newWarranty.notes || "",
    }
    setWarranties([warranty, ...warranties])
    setNewWarranty({ warrantyType: "Ekran Değişimi", status: "active", startDate: new Date().toISOString().split("T")[0] })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Garanti Takibi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Garanti
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Garanti Kaydı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cihaz Adı</label>
                  <Input
                    value={newWarranty.deviceName || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, deviceName: e.target.value })}
                    placeholder="iPhone 14 Pro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Müşteri Adı</label>
                  <Input
                    value={newWarranty.customerName || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, customerName: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={newWarranty.customerPhone || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, customerPhone: e.target.value })}
                    placeholder="0555 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Garanti Tipi</label>
                  <Select
                    value={newWarranty.warrantyType}
                    onValueChange={(value) => setNewWarranty({ ...newWarranty, warrantyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ekran Değişimi">Ekran Değişimi</SelectItem>
                      <SelectItem value="Batarya Değişimi">Batarya Değişimi</SelectItem>
                      <SelectItem value="Anakart Tamir">Anakart Tamir</SelectItem>
                      <SelectItem value="Arka Kapak">Arka Kapak</SelectItem>
                      <SelectItem value="Genel">Genel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <Input
                    type="date"
                    value={newWarranty.startDate}
                    onChange={(e) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş Tarihi</label>
                  <Input
                    type="date"
                    value={newWarranty.endDate || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notlar</label>
                <Input
                  value={newWarranty.notes || ""}
                  onChange={(e) => setNewWarranty({ ...newWarranty, notes: e.target.value })}
                  placeholder="Ek notlar..."
                />
              </div>
              <Button onClick={handleAddWarranty} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Garanti</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warranties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitmek Üzere</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolmuş</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garanti Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cihaz veya müşteri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="expiring">Bitmek Üzere</SelectItem>
                <SelectItem value="expired">Süresi Dolmuş</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredWarranties.map((warranty) => (
              <div key={warranty.id} className="rounded-lg border p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">{warranty.deviceName}</span>
                      {getStatusBadge(warranty)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Müşteri:</span> {warranty.customerName}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Telefon:</span> {warranty.customerPhone}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Tip:</span> {warranty.warrantyType}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(warranty.startDate), "dd MMM yyyy", { locale: tr })} - {format(parseISO(warranty.endDate), "dd MMM yyyy", { locale: tr })}</span>
                      </div>
                    </div>
                    {warranty.notes && (
                      <div className="mt-2 text-sm bg-muted p-2 rounded">
                        <span className="font-medium">Not:</span> {warranty.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
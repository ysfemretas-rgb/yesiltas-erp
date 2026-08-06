"use client"

import { Toast, useToast } from "@/components/toast"

import { useState, useEffect } from "react"
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
import { Plus, Shield, AlertTriangle, Search, Calendar, Clock, Pencil, Trash2, Save, MessageCircle } from "lucide-react"
import { format, differenceInDays, parseISO, addMonths } from "date-fns"
import { tr } from "date-fns/locale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Warranty, fetchWarranties, createWarranty, updateWarranty, deleteWarranty } from "@/lib/warranties"

export default function WarrantiesPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Garantiler")
  const isManager = useIsManager()
  const [warranties, setWarranties] = useState<Warranty[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const [newWarranty, setNewWarranty] = useState<Partial<Warranty>>({
    warrantyType: "Ekran Değişimi",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  })

  // Supabase'den yükle (eski localStorage verisi varsa bir kere otomatik aktarılır)
  useEffect(() => {
    let cancelled = false
    fetchWarranties()
      .then((data) => {
        if (!cancelled) setWarranties(data)
      })
      .catch((e) => {
        console.error("Load error:", e)
        if (!cancelled) showToast("Garantiler yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date())
    return days
  }

  const getStatusBadge = (warranty: Warranty) => {
    const days = getDaysRemaining(warranty.endDate)
    if (days < 0) return <Badge className="bg-red-900/50 text-red-300 border-red-700">Süresi Doldu</Badge>
    if (days <= 30) return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Bitiyor ({days} gün)</Badge>
    return <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Aktif ({days} gün)</Badge>
  }

  const filteredWarranties = warranties.filter((w) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = w.deviceName.toLowerCase().includes(search) ||
      w.customerName.toLowerCase().includes(search) ||
      w.customerPhone.includes(search)
    const matchesStatus = filterStatus === "all" || w.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const activeCount = warranties.filter(w => w.status === "active").length
  const expiringCount = warranties.filter(w => w.status === "expiring").length
  const expiredCount = warranties.filter(w => w.status === "expired").length

  const handleAddWarranty = async () => {
    if (!newWarranty.deviceName || !newWarranty.customerName) {
      showToast("Lütfen cihaz adı ve müşteri adı girin!", "error")
      return
    }
    try {
      const warranty = await createWarranty({
        deviceName: newWarranty.deviceName,
        customerName: newWarranty.customerName,
        customerPhone: newWarranty.customerPhone || "",
        warrantyType: newWarranty.warrantyType || "Genel",
        startDate: newWarranty.startDate || new Date().toISOString().split("T")[0],
        endDate: newWarranty.endDate || new Date().toISOString().split("T")[0],
        status: "active",
        notes: newWarranty.notes || "",
      })
      setWarranties([warranty, ...warranties])
      setNewWarranty({ warrantyType: "Ekran Değişimi", status: "active", startDate: new Date().toISOString().split("T")[0] })
      setIsDialogOpen(false)
      showToast("Garanti kaydı eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Garanti eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateWarranty = async () => {
    if (!editingWarranty) return
    if (!editingWarranty.deviceName || !editingWarranty.customerName) {
      showToast("Lütfen cihaz adı ve müşteri adı girin!", "error")
      return
    }
    try {
      const updated = await updateWarranty(editingWarranty.id, editingWarranty)
      setWarranties(warranties.map(w => w.id === updated.id ? updated : w))
      setIsEditOpen(false)
      setEditingWarranty(null)
      showToast("Garanti kaydı güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Garanti güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteWarranty = async (id: string) => {
    const w = warranties.find(item => item.id === id)
    if (!w) return
    if (!confirm(`\u{26A0} *${w.deviceName}* garanti kaydını silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    try {
      await deleteWarranty(id)
      setWarranties(warranties.filter(item => item.id !== id))
      showToast("Garanti kaydı silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Garanti silinirken bir sorun oluştu.", "error")
    }
  }

  const openEditDialog = (warranty: Warranty) => {
    setEditingWarranty({ ...warranty })
    setIsEditOpen(true)
  }

  const sendWhatsApp = (warranty: Warranty) => {
    const cleanPhone = warranty.customerPhone.replace(/\D/g, "")
    const days = getDaysRemaining(warranty.endDate)
    const dateStr = format(parseISO(warranty.endDate), "dd.MM.yyyy", { locale: tr })

    let message = `\u{1F44B} Merhaba *${warranty.customerName}*,\n\n`
    message += `\u{2705} *Yeşiltaş Teknoloji*'den garanti bilgilendirmesidir.\n\n`
    message += `\u{1F4C5} *${warranty.deviceName}* cihazınızın *${warranty.warrantyType}* garantisi *${dateStr}* tarihinde `
    if (days < 0) {
      message += `*sona ermiştir*.\n\n`
      message += `\u{26A0} Garanti kapsamında bir sorun yaşıyorsanız lütfen bizimle iletişime geçiniz.\n`
    } else if (days <= 30) {
      message += `*sona erecektir*.\n\n`
      message += `\u{23F0} Garanti süreniz dolmadan herhangi bir sorun varsa lütfen başvurunuz.\n`
    } else {
      message += `*sona erecektir*.\n\n`
      message += `\u{2705} Garantiniz aktif durumdadır. Herhangi bir sorun yaşarsanız bizimle iletişime geçebilirsiniz.\n`
    }
    message += `\n\u{1F3EA} *Yeşiltaş Teknoloji*\n`
    message += `\u{1F4DE} Bizi tercih ettiğiniz için teşekkür ederiz! \u{1F64F}`

    window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  // Auto-calculate end date from start date + warranty duration
  const autoCalculateEndDate = (startDate: string, months: number) => {
    if (!startDate) return ""
    const end = addMonths(parseISO(startDate), months)
    return end.toISOString().split("T")[0]
  }


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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">🛡️ Garanti Takibi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Garanti
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Garanti Kaydı</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Cihaz Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={newWarranty.deviceName || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, deviceName: e.target.value })}
                    placeholder="iPhone 14 Pro"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Müşteri Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={newWarranty.customerName || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, customerName: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input
                    value={newWarranty.customerPhone || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, customerPhone: e.target.value })}
                    placeholder="0555 123 4567"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Garanti Tipi</label>
                  <Select
                    value={newWarranty.warrantyType}
                    onValueChange={(value) => setNewWarranty({ ...newWarranty, warrantyType: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Ekran Değişimi" className="text-white">Ekran Değişimi</SelectItem>
                      <SelectItem value="Batarya Değişimi" className="text-white">Batarya Değişimi</SelectItem>
                      <SelectItem value="Anakart Tamiri" className="text-white">Anakart Tamiri</SelectItem>
                      <SelectItem value="Arka Kapak" className="text-white">Arka Kapak</SelectItem>
                      <SelectItem value="Genel" className="text-white">Genel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newWarranty.customerPhone && newWarranty.customerPhone.trim().length >= 6 && (() => {
                const pastWarranties = warranties.filter(w => w.customerPhone && w.customerPhone.replace(/\D/g, "") === newWarranty.customerPhone!.replace(/\D/g, ""))
                if (pastWarranties.length === 0) return null
                return (
                  <div className="rounded-lg border border-indigo-700/50 bg-indigo-900/10 p-3 text-xs text-slate-400">
                    🕘 Bu müşterinin daha önce {pastWarranties.length} garanti kaydı var (son: {pastWarranties[0]?.deviceName})
                  </div>
                )
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Başlangıç Tarihi</label>
                  <Input
                    type="date"
                    value={newWarranty.startDate}
                    onChange={(e) => {
                      const start = e.target.value
                      setNewWarranty({
                        ...newWarranty,
                        startDate: start,
                        endDate: autoCalculateEndDate(start, 6)
                      })
                    }}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Bitiş Tarihi</label>
                  <Input
                    type="date"
                    value={newWarranty.endDate || ""}
                    onChange={(e) => setNewWarranty({ ...newWarranty, endDate: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <div className="text-xs text-slate-500">
                    Başlangıç tarihinden otomatik +6 ay
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={newWarranty.notes || ""}
                  onChange={(e) => setNewWarranty({ ...newWarranty, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleAddWarranty} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Garanti</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{warranties.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Aktif</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Bitmek Üzere</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{expiringCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Süresi Dolmuş</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Garanti Listesi</span>
            <span className="text-sm text-slate-400">{filteredWarranties.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Cihaz, müşteri veya telefon ara..."
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
                <SelectItem value="active" className="text-white">Aktif</SelectItem>
                <SelectItem value="expiring" className="text-white">Bitmek Üzere</SelectItem>
                <SelectItem value="expired" className="text-white">Süresi Dolmuş</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredWarranties.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Garanti kaydı bulunamadı.</p>
              </div>
            )}
            {filteredWarranties.map((warranty) => (
              <div key={warranty.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white text-lg">{warranty.deviceName}</span>
                      {getStatusBadge(warranty)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                      <div>
                        <span className="font-medium text-slate-300">Müşteri:</span> {warranty.customerName}
                      </div>
                      <div>
                        <span className="font-medium text-slate-300">Telefon:</span> {warranty.customerPhone}
                      </div>
                      <div>
                        <span className="font-medium text-slate-300">Tip:</span> {warranty.warrantyType}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(warranty.startDate), "dd MMM yyyy", { locale: tr })} - {format(parseISO(warranty.endDate), "dd MMM yyyy", { locale: tr })}</span>
                      </div>
                    </div>
                    {warranty.notes && (
                      <div className="mt-2 text-sm bg-slate-800 p-2 rounded text-slate-300">
                        <span className="font-medium">Not:</span> {warranty.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendWhatsApp(warranty)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(warranty)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      <Pencil className="w-3 h-3 mr-1" />Düzenle
                    </Button>
                    {isManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWarranty(warranty.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Sil
                    </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Garanti Düzenle</DialogTitle>
          </DialogHeader>
          {editingWarranty && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Cihaz Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={editingWarranty.deviceName}
                    onChange={(e) => setEditingWarranty({ ...editingWarranty, deviceName: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Müşteri Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={editingWarranty.customerName}
                    onChange={(e) => setEditingWarranty({ ...editingWarranty, customerName: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input
                    value={editingWarranty.customerPhone}
                    onChange={(e) => setEditingWarranty({ ...editingWarranty, customerPhone: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Garanti Tipi</label>
                  <Select
                    value={editingWarranty.warrantyType}
                    onValueChange={(value) => setEditingWarranty({ ...editingWarranty, warrantyType: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Ekran Değişimi" className="text-white">Ekran Değişimi</SelectItem>
                      <SelectItem value="Batarya Değişimi" className="text-white">Batarya Değişimi</SelectItem>
                      <SelectItem value="Anakart Tamiri" className="text-white">Anakart Tamiri</SelectItem>
                      <SelectItem value="Arka Kapak" className="text-white">Arka Kapak</SelectItem>
                      <SelectItem value="Genel" className="text-white">Genel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Başlangıç Tarihi</label>
                  <Input
                    type="date"
                    value={editingWarranty.startDate}
                    onChange={(e) => setEditingWarranty({ ...editingWarranty, startDate: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Bitiş Tarihi</label>
                  <Input
                    type="date"
                    value={editingWarranty.endDate}
                    onChange={(e) => setEditingWarranty({ ...editingWarranty, endDate: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Notlar</label>
                <Input
                  value={editingWarranty.notes}
                  onChange={(e) => setEditingWarranty({ ...editingWarranty, notes: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleUpdateWarranty} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Güncelle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
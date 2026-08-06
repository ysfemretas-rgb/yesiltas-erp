"use client"

import { Toast, useToast } from "@/components/toast"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Search, Phone, Mail, Shield, Pencil, Trash2, Save, X, Check, MessageCircle } from "lucide-react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { StaffMember, fetchStaff, createStaffMember, updateStaffMember, deleteStaffMember } from "@/lib/staff"

const ALL_PERMISSIONS = [
  { key: "Tamir", label: "Teknik Servis" },
  { key: "Randevular", label: "Randevular" },
  { key: "Satışlar", label: "Satışlar" },
  { key: "Envanter", label: "Envanter" },
  { key: "Sarf Malzemeler", label: "Sarf Malzemeler" },
  { key: "Finans", label: "Finans" },
  { key: "Garantiler", label: "Garantiler" },
  { key: "Müşteriler", label: "Müşteriler" },
  { key: "Görevler", label: "Görevler" },
  { key: "Personel", label: "Personel Yönetimi" },
  { key: "Raporlar", label: "Raporlar" },
  { key: "Ayarlar", label: "Ayarlar" },
]

const ROLES = ["Teknisyen", "Muhasebeci", "Satış Temsilcisi", "Yönetici"]
const DEPARTMENTS = ["Tamir", "Muhasebe", "Satış", "Yönetim"]

const defaultPermissions: Record<string, string[]> = {
  "Teknisyen": ["Tamir", "Randevular", "Envanter", "Sarf Malzemeler"],
  "Muhasebeci": ["Finans", "Raporlar", "Müşteriler"],
  "Satış Temsilcisi": ["Satışlar", "Müşteriler", "Envanter", "Randevular"],
  "Yönetici": ALL_PERMISSIONS.map(p => p.key),
}

// Özel Checkbox component
function CustomCheckbox({ 
  id, 
  checked, 
  onChange, 
  label 
}: { 
  id: string
  checked: boolean
  onChange: () => void
  label: string 
}) {
  return (
    <div 
      className="flex items-center space-x-2 cursor-pointer"
      onClick={onChange}
    >
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked 
            ? "bg-blue-600 border-blue-600" 
            : "bg-slate-700 border-slate-500 hover:border-slate-400"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <label htmlFor={id} className="text-sm text-slate-300 cursor-pointer select-none">
        {label}
      </label>
    </div>
  )
}

export default function StaffPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Personel")
  const isManager = useIsManager()

  const [isLoaded, setIsLoaded] = useState(false)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [newMember, setNewMember] = useState<Partial<StaffMember>>({
    role: "Teknisyen",
    department: "Tamir",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
    permissions: defaultPermissions["Teknisyen"],
    salary: 18500,
  })

  // Supabase'den yükle (eski localStorage verisi varsa bir kere otomatik aktarılır)
  useEffect(() => {
    let cancelled = false
    fetchStaff()
      .then((data) => {
        if (!cancelled) setStaff(data)
      })
      .catch((e) => {
        console.error("Load error:", e)
        if (!cancelled) showToast("Personel yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Aktif</Badge>
      case "inactive": return <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
      case "on_leave": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">İzinde</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    const matchesRole = filterRole === "all" || s.role === filterRole
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const activeCount = staff.filter(s => s.status === "active").length
  const onLeaveCount = staff.filter(s => s.status === "on_leave").length
  const inactiveCount = staff.filter(s => s.status === "inactive").length
  const totalSalary = staff.filter(s => s.status === "active").reduce((sum, s) => sum + (Number(s.salary) || 0), 0)

  const handleRoleChange = (role: string) => {
    setNewMember(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions[role] || [],
    }))
  }

  const handleAddMember = async () => {
    if (!newMember.name?.trim() || !newMember.email?.trim()) {
      showToast("Lütfen ad soyad ve e-posta alanlarını doldurun!", "error")
      return
    }
    try {
      const member = await createStaffMember({
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone?.trim() || "",
        role: newMember.role || "Teknisyen",
        department: newMember.department || "Tamir",
        joinDate: newMember.joinDate || new Date().toISOString().split("T")[0],
        status: "active",
        permissions: newMember.permissions || defaultPermissions[newMember.role || "Teknisyen"] || [],
        salary: Number(newMember.salary) || 0,
      })
      setStaff([member, ...staff])
      setNewMember({
        role: "Teknisyen",
        department: "Tamir",
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
        permissions: defaultPermissions["Teknisyen"],
        salary: 18500,
      })
      setIsDialogOpen(false)
      showToast("Personel eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Personel eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleEditMember = (member: StaffMember) => {
    setEditingMember({ ...member })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMember) return
    if (!editingMember.name?.trim() || !editingMember.email?.trim()) {
      showToast("Lütfen ad soyad ve e-posta alanlarını doldurun!", "error")
      return
    }
    try {
      const updated = await updateStaffMember(editingMember.id, editingMember)
      setStaff(prev => prev.map(s => s.id === updated.id ? updated : s))
      setEditingMember(null)
      setIsEditDialogOpen(false)
      showToast("Personel güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Personel güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteStaffMember(id)
      setStaff(prev => prev.filter(s => s.id !== id))
      setShowDeleteConfirm(null)
      showToast("Personel silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Personel silinirken bir sorun oluştu.", "error")
    }
  }

  const togglePermission = (perm: string, isNew: boolean = true) => {
    if (isNew) {
      setNewMember(prev => {
        const current = prev.permissions || []
        const updated = current.includes(perm)
          ? current.filter(p => p !== perm)
          : [...current, perm]
        return { ...prev, permissions: updated }
      })
    } else if (editingMember) {
      const current = editingMember.permissions || []
      const updated = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm]
      setEditingMember({ ...editingMember, permissions: updated })
    }
  }

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\s/g, "").replace(/^0/, "+90")
    const message = `Merhaba ${name}, 👋\n\n*Yeşiltaş Teknoloji* olarak sizinle iletişime geçmek istedik.\n\nMüsait olduğunuzda dönüş yapabilir misiniz?\n\n🏪 *Yeşiltaş Teknoloji*`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`
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
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Başlık */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Personel Yönetimi</h1>
            <p className="text-slate-400 mt-1">Ekip üyelerini yönetin ve yetkilendirin</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Personel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Yeni Personel Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ad Soyad <span className="text-red-400">*</span></label>
                  <Input
                    value={newMember.name || ""}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Ad Soyad"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">E-posta <span className="text-red-400">*</span></label>
                    <Input
                      type="email"
                      value={newMember.email || ""}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="ornek@yesiltas.com"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Telefon</label>
                    <Input
                      value={newMember.phone || ""}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="0555 123 4567"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Rol <span className="text-red-400">*</span></label>
                    <Select value={newMember.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role} className="text-white">{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Departman</label>
                    <Select
                      value={newMember.department}
                      onValueChange={(value) => setNewMember({ ...newMember, department: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="text-white">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Maaş (₺)</label>
                    <Input
                      type="number"
                      value={newMember.salary || ""}
                      onChange={(e) => setNewMember({ ...newMember, salary: Number(e.target.value) })}
                      placeholder="18500"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Başlangıç Tarihi</label>
                    <Input
                      type="date"
                      value={newMember.joinDate}
                      onChange={(e) => setNewMember({ ...newMember, joinDate: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Erişim İzinleri</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-700/50 rounded-lg">
                    {ALL_PERMISSIONS.map((perm) => (
                      <CustomCheckbox
                        key={perm.key}
                        id={`perm-new-${perm.key}`}
                        checked={(newMember.permissions || []).includes(perm.key)}
                        onChange={() => togglePermission(perm.key, true)}
                        label={perm.label}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddMember} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Toplam Personel</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{staff.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Aktif</CardTitle>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">İzinde</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{onLeaveCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pasif</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-400">{inactiveCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700 col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Aylık Maaş Gideri</CardTitle>
              <Shield className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">₺{totalSalary.toLocaleString("tr-TR")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Personel Listesi */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Personel Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Personel ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">Tüm Roller</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="text-white">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white">Tümü</SelectItem>
                    <SelectItem value="active" className="text-white">Aktif</SelectItem>
                    <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                    <SelectItem value="on_leave" className="text-white">İzinde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <div key={member.id} className="flex items-start gap-4 rounded-lg border border-slate-600 bg-slate-700/50 p-4 hover:bg-slate-700 transition-colors">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white text-lg">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-white text-lg">{member.name}</span>
                        {getStatusBadge(member.status)}
                        <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">{member.role}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Departman:</span> {member.department}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Maaş:</span> ₺{(Number(member.salary) || 0).toLocaleString("tr-TR")}
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Başlangıç:</span> {member.joinDate}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(member.permissions || []).map((perm) => (
                          <Badge key={perm} variant="outline" className="border-slate-500 text-slate-400 text-xs">
                            {ALL_PERMISSIONS.find(p => p.key === perm)?.label || perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                        onClick={() => handleCall(member.phone)}
                      >
                        <Phone className="w-3 h-3 mr-1" />📞 Ara
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
                        onClick={() => handleWhatsApp(member.phone, member.name)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />📱 WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                        onClick={() => handleEditMember(member)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />✏️ Düzenle
                      </Button>
                      {isManager && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-900/30"
                        onClick={() => setShowDeleteConfirm(member.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />🗑️ Sil
                      </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">Personel bulunamadı.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Düzenleme Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Personel Düzenle</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ad Soyad <span className="text-red-400">*</span></label>
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">E-posta <span className="text-red-400">*</span></label>
                    <Input
                      type="email"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Telefon</label>
                    <Input
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Rol</label>
                    <Select
                      value={editingMember.role}
                      onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role} className="text-white">{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Departman</label>
                    <Select
                      value={editingMember.department}
                      onValueChange={(value) => setEditingMember({ ...editingMember, department: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="text-white">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Maaş (₺)</label>
                    <Input
                      type="number"
                      value={editingMember.salary || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, salary: Number(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Durum</label>
                    <Select
                      value={editingMember.status}
                      onValueChange={(value: "active" | "inactive" | "on_leave") => setEditingMember({ ...editingMember, status: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="active" className="text-white">Aktif</SelectItem>
                        <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                        <SelectItem value="on_leave" className="text-white">İzinde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Erişim İzinleri</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-700/50 rounded-lg">
                    {ALL_PERMISSIONS.map((perm) => (
                      <CustomCheckbox
                        key={perm.key}
                        id={`perm-edit-${perm.key}`}
                        checked={(editingMember.permissions || []).includes(perm.key)}
                        onChange={() => togglePermission(perm.key, false)}
                        label={perm.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </Button>
                  <Button onClick={() => setIsEditDialogOpen(false)} variant="outline" className="border-slate-600 text-slate-300">
                    <X className="w-4 h-4 mr-2" />
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        {showDeleteConfirm && (
          <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">⚠️ Personel Sil</DialogTitle>
              </DialogHeader>
              <p className="text-slate-300 py-4">
                <strong>{staff.find(s => s.id === showDeleteConfirm)?.name}</strong> isimli personeli silmek istediğinize emin misiniz?
                <br />
                <span className="text-red-400 text-sm">Bu işlem geri alınamaz!</span>
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDeleteMember(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Evet, Sil
                </Button>
                <Button onClick={() => setShowDeleteConfirm(null)} variant="outline" className="border-slate-600 text-slate-300">
                  İptal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
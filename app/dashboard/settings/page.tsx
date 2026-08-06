"use client"

import { Toast, useToast } from "@/components/toast"

import { useState, useEffect, useRef } from "react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { SupabaseHealthCheck } from "@/components/SupabaseHealthCheck"
import { ActivityLogViewer } from "@/components/ActivityLogViewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Building, User, Bell, Shield, Mail, Phone, MapPin, KeyRound, Plus, Trash2, Eye, EyeOff, CheckCircle2, Pencil, X, LogIn, LogOut, Download, Upload } from "lucide-react"
import { exportBackup, readBackupFile, restoreBackup } from "@/lib/backup"

interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  taxNumber: string
  iban: string
  accountName: string
}

interface AppUser {
  id: number
  username: string
  name: string
  role: string
  permissions: string[]
  status: "active" | "inactive"
  password: string
}

interface LoginRecord {
  id: number
  userId: number
  username: string
  name: string
  action: "login" | "logout"
  timestamp: string
  ip?: string
}

const getInitialCompany = (): CompanySettings => ({
  name: "Yeşiltaş Teknik Servis",
  address: "İstanbul, Kadıköy, Caferağa Mah. Örnek Sok. No:15",
  phone: "0216 123 4567",
  email: "info@yesiltas.com",
  taxNumber: "123 456 7890",
  iban: "TR00 1234 5678 9012 3456 7890 12",
  accountName: "Yeşiltaş Teknik Servis",
})

const getInitialUsers = (): AppUser[] => [
  { id: 1, username: "admin", name: "Yönetici", role: "Yönetici", permissions: ["Tüm Yetkiler"], status: "active", password: "admin123" },
  { id: 2, username: "teknisyen", name: "Teknisyen", role: "Teknisyen", permissions: ["Tamir", "Envanter", "Müşteriler"], status: "active", password: "tek123" },
  { id: 3, username: "kasa", name: "Kasiyer", role: "Kasiyer", permissions: ["Satış", "Finans", "Müşteriler"], status: "active", password: "kasa123" },
]

const getInitialLoginRecords = (): LoginRecord[] => [
  { id: 1, userId: 1, username: "admin", name: "Yönetici", action: "login", timestamp: "2026-08-04 08:30", ip: "192.168.1.1" },
  { id: 2, userId: 2, username: "teknisyen", name: "Teknisyen", action: "login", timestamp: "2026-08-04 09:15", ip: "192.168.1.2" },
  { id: 3, userId: 1, username: "admin", name: "Yönetici", action: "logout", timestamp: "2026-08-04 12:00", ip: "192.168.1.1" },
]

const ALL_ROLES = ["Yönetici", "Teknisyen", "Kasiyer", "Muhasebeci"]
const ALL_PERMISSIONS = ["Tamir", "Finans", "Envanter", "Personel", "Raporlar", "Ayarlar", "Satış", "Müşteriler", "Randevular", "Tedarikçiler", "Garantiler", "Sarf Malzemeler"]

export default function SettingsPage() {
  const { toast, showToast, hideToast } = useToast()

  const { authorized, checking } = usePageAccess("Ayarlar")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [company, setCompany] = useState<CompanySettings>(getInitialCompany())
  const [users, setUsers] = useState<AppUser[]>([])
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([])
  const [saved, setSaved] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  const [newUser, setNewUser] = useState<Partial<AppUser>>({
    role: "Teknisyen",
    status: "active",
    permissions: []
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [editPasswordData, setEditPasswordData] = useState({
    userId: 0,
    newPassword: "",
    confirmPassword: ""
  })

  // localStorage'dan yükle
  useEffect(() => {
    try {
      const companySaved = localStorage.getItem("yt_company")
      if (companySaved) setCompany(JSON.parse(companySaved))

      const usersSaved = localStorage.getItem("yt_app_users")
      if (usersSaved) {
        setUsers(JSON.parse(usersSaved))
      } else {
        const initial = getInitialUsers()
        setUsers(initial)
        localStorage.setItem("yt_app_users", JSON.stringify(initial))
      }

      const recordsSaved = localStorage.getItem("yt_login_records")
      if (recordsSaved) {
        setLoginRecords(JSON.parse(recordsSaved))
      } else {
        const initial = getInitialLoginRecords()
        setLoginRecords(initial)
        localStorage.setItem("yt_login_records", JSON.stringify(initial))
      }

      const userData = localStorage.getItem("yt_user")
      if (userData) setCurrentUser(JSON.parse(userData))
    } catch (e) {
      console.error("Yükleme hatası:", e)
    }
    setIsLoaded(true)
  }, [])

  // localStorage'a kaydet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("yt_company", JSON.stringify(company))
    }
  }, [company, isLoaded])

  useEffect(() => {
    if (isLoaded && users.length > 0) {
      localStorage.setItem("yt_app_users", JSON.stringify(users))
    }
  }, [users, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("yt_login_records", JSON.stringify(loginRecords))
    }
  }, [loginRecords, isLoaded])

  const handleSaveCompany = () => {
    localStorage.setItem("yt_company", JSON.stringify(company))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAddUser = () => {
    if (!newUser.username?.trim() || !newUser.name?.trim()) {
      showToast("Lütfen kullanıcı adı ve ad soyad alanlarını doldurun!", "error")
      return
    }
    const user: AppUser = {
      id: Date.now(),
      username: newUser.username.trim(),
      name: newUser.name.trim(),
      role: newUser.role || "Teknisyen",
      permissions: newUser.permissions || [],
      status: "active",
      password: "123456",
    }
    setUsers([user, ...users])
    setNewUser({ role: "Teknisyen", status: "active", permissions: [] })
    setIsNewUserOpen(false)
  }

  const handleEditUser = (user: AppUser) => {
    setEditingUser({ ...user })
    setIsEditUserOpen(true)
  }

  const handleSaveEditUser = () => {
    if (!editingUser) return
    if (!editingUser.username?.trim() || !editingUser.name?.trim()) {
      showToast("Lütfen kullanıcı adı ve ad soyad alanlarını doldurun!", "error")
      return
    }
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...editingUser } : u))
    setEditingUser(null)
    setIsEditUserOpen(false)
  }

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id))
    setShowDeleteConfirm(null)
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword.length < 6) {
      showToast("Şifre en az 6 karakter olmalı!", "error")
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Şifreler eşleşmiyor!", "error")
      return
    }
    showToast("Şifreniz başarıyla değiştirildi!", "success")
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setIsPasswordOpen(false)
  }

  const handleEditUserPassword = () => {
    if (editPasswordData.newPassword.length < 6) {
      showToast("Şifre en az 6 karakter olmalı!", "error")
      return
    }
    if (editPasswordData.newPassword !== editPasswordData.confirmPassword) {
      showToast("Şifreler eşleşmiyor!", "error")
      return
    }
    setUsers(prev => prev.map(u => u.id === editPasswordData.userId ? { ...u, password: editPasswordData.newPassword } : u))
    showToast("Kullanıcı şifresi başarıyla değiştirildi!", "success")
    setEditPasswordData({ userId: 0, newPassword: "", confirmPassword: "" })
    setIsEditPasswordOpen(false)
  }

  const openEditPassword = (userId: number) => {
    setEditPasswordData({ userId, newPassword: "", confirmPassword: "" })
    setIsEditPasswordOpen(true)
  }

  const togglePermission = (perm: string, isNew: boolean = true) => {
    if (isNew) {
      const currentPerms = newUser.permissions || []
      if (currentPerms.includes(perm)) {
        setNewUser({ ...newUser, permissions: currentPerms.filter(p => p !== perm) })
      } else {
        setNewUser({ ...newUser, permissions: [...currentPerms, perm] })
      }
    } else if (editingUser) {
      const currentPerms = editingUser.permissions || []
      if (currentPerms.includes(perm)) {
        setEditingUser({ ...editingUser, permissions: currentPerms.filter(p => p !== perm) })
      } else {
        setEditingUser({ ...editingUser, permissions: [...currentPerms, perm] })
      }
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Yönetici": return <Badge className="bg-red-900/50 text-red-300 border-red-700">{role}</Badge>
      case "Teknisyen": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">{role}</Badge>
      case "Kasiyer": return <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">{role}</Badge>
      default: return <Badge className="bg-slate-700 text-slate-300">{role}</Badge>
    }
  }

  const getActionBadge = (action: string) => {
    return action === "login"
      ? <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700 flex items-center gap-1"><LogIn className="w-3 h-3" /> Giriş</Badge>
      : <Badge className="bg-orange-900/50 text-orange-300 border-orange-700 flex items-center gap-1"><LogOut className="w-3 h-3" /> Çıkış</Badge>
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


  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Yetkisiz erişim</div>
          <p className="text-slate-400">Bu sayfaya erişim izniniz yok. Yönlendiriliyor...</p>
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
            <h1 className="text-3xl font-bold text-white">Ayarlar</h1>
            <p className="text-slate-400 mt-1">Sistem ve şirket ayarlarını yönetin</p>
          </div>
          <Button onClick={handleSaveCompany} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>

        {saved && (
          <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-200 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Ayarlar başarıyla kaydedildi!
          </div>
        )}

        <Tabs defaultValue="company">
          <TabsList className="flex w-full gap-1 overflow-x-auto lg:w-[600px] bg-slate-800 p-1">
            <TabsTrigger value="company" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Şirket</TabsTrigger>
            <TabsTrigger value="user" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Kullanıcı</TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="logins" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Giriş/Çıkış</TabsTrigger>
            <TabsTrigger value="system" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sistem</TabsTrigger>
            <TabsTrigger value="status" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">🔌 Bağlantı Durumu</TabsTrigger>
            <TabsTrigger value="activity" className="flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white">📋 Aktivite Logu</TabsTrigger>
          </TabsList>

          {/* Şirket Bilgileri */}
          <TabsContent value="company" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-400" />
                  Şirket Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Şirket Adı <span className="text-red-400">*</span></label>
                    <Input
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Vergi Numarası</label>
                    <Input
                      value={company.taxNumber}
                      onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Adres</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      className="pl-9 bg-slate-700 border-slate-600 text-white"
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Telefon</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        className="pl-9 bg-slate-700 border-slate-600 text-white"
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">E-posta</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        className="pl-9 bg-slate-700 border-slate-600 text-white"
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <Separator className="bg-slate-600" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">IBAN</label>
                  <Input
                    value={company.iban}
                    onChange={(e) => setCompany({ ...company, iban: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Hesap Adı</label>
                  <Input
                    value={company.accountName}
                    onChange={(e) => setCompany({ ...company, accountName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mevcut Kullanıcı */}
          <TabsContent value="user" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-400" />
                  Mevcut Kullanıcı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-700 border border-slate-600">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {currentUser?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">{currentUser?.name || "Admin"}</div>
                    <div className="text-sm text-slate-400">{currentUser?.role || "Yönetici"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Ad Soyad</label>
                    <Input value={currentUser?.name || ""} disabled className="bg-slate-700 border-slate-600 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Rol</label>
                    <Input value={currentUser?.role || ""} disabled className="bg-slate-700 border-slate-600 text-slate-400" />
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <Button onClick={() => setIsPasswordOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Şifre Değiştir
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kullanıcı Yönetimi */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  Kullanıcı Yönetimi
                </CardTitle>
                <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni Kullanıcı
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl">Yeni Kullanıcı Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Kullanıcı Adı <span className="text-red-400">*</span></label>
                        <Input
                          value={newUser.username || ""}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="kullaniciadi"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Ad Soyad <span className="text-red-400">*</span></label>
                        <Input
                          value={newUser.name || ""}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Ahmet Yılmaz"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Rol</label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {ALL_ROLES.map(r => (
                              <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">İzinler</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_PERMISSIONS.map((perm) => (
                            <Button
                              key={perm}
                              size="sm"
                              variant={newUser.permissions?.includes(perm) ? "default" : "outline"}
                              onClick={() => togglePermission(perm)}
                              className={newUser.permissions?.includes(perm) ? "bg-blue-600" : "border-slate-600 text-slate-400"}
                            >
                              {perm}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button onClick={handleAddUser} disabled={!newUser.username || !newUser.name} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="mr-2 h-4 w-4" />
                        Kullanıcı Ekle
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-600 bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-sm text-slate-400">@{user.username}</div>
                          <div className="flex gap-1 mt-1">
                            {getRoleBadge(user.role)}
                            {user.status === "active" ? (
                              <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Aktif</Badge>
                            ) : (
                              <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30" onClick={() => openEditPassword(user.id)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30" onClick={() => handleEditUser(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/30" onClick={() => setShowDeleteConfirm(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Giriş/Çıkış Kayıtları */}
          <TabsContent value="logins" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-emerald-400" />
                  Personel Giriş/Çıkış Kayıtları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loginRecords.length > 0 ? (
                    loginRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-600 bg-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                            {record.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{record.name}</div>
                            <div className="text-sm text-slate-400">@{record.username}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {getActionBadge(record.action)}
                          <div className="text-sm text-slate-400 mt-1">{record.timestamp}</div>
                          {record.ip && <div className="text-xs text-slate-500">IP: {record.ip}</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">Henüz giriş/çıkış kaydı bulunmuyor.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistem Ayarları */}
          <TabsContent value="system" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  Sistem Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-600 bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Bildirimler</div>
                      <div className="text-sm text-slate-400">Stok, garanti ve borç uyarıları — sağ üstteki zil ikonundan takip edilir</div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div className="space-y-2">
                  <h3 className="font-medium text-white">Sistem Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">Versiyon:</div>
                    <div className="text-slate-300">v1.0.0</div>
                    <div className="text-slate-500">Son Güncelleme:</div>
                    <div className="text-slate-300">04.08.2026</div>
                    <div className="text-slate-500">Lisans:</div>
                    <div className="text-slate-300">Yeşiltaş ERP Pro</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💾 Yedekleme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400">
                  Tüm iş verinizi (müşteriler, tamirler, satışlar, envanter, garantiler, finans, tedarikçiler, personel, randevular) tek bir dosyaya indirin. Düzenli aralıklarla yedek almanızı öneririz.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      exportBackup()
                      showToast("Yedek indirildi.", "success")
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Yedeği İndir
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Yedekten Geri Yükle
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ""
                      if (!file) return
                      if (!window.confirm("Bu, mevcut tüm verilerin üzerine yazacak. Devam etmek istiyor musunuz?")) return
                      try {
                        const backup = await readBackupFile(file)
                        restoreBackup(backup)
                        showToast("Yedek geri yüklendi. Sayfa yenileniyor...", "success")
                        setTimeout(() => window.location.reload(), 1200)
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Geri yükleme başarısız.", "error")
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🔌 Supabase Bağlantı Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SupabaseHealthCheck />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📋 Aktivite Logu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityLogViewer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Şifre Değiştir Dialog */}
        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent className="sm:max-w-[400px] bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Şifre Değiştir</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mevcut Şifre</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="pl-9 pr-10 bg-slate-700 border-slate-600 text-white"
                    placeholder="Mevcut şifreniz"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yeni Şifre</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Şifre Tekrar</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Yeni şifreyi tekrar girin"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="bg-blue-600 hover:bg-blue-700">
                <KeyRound className="mr-2 h-4 w-4" />
                Şifreyi Değiştir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Kullanıcı Düzenle Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Kullanıcı Düzenle</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kullanıcı Adı <span className="text-red-400">*</span></label>
                  <Input
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ad Soyad <span className="text-red-400">*</span></label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Rol</label>
                  <Select value={editingUser.role} onValueChange={(v) => setEditingUser({...editingUser, role: v})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {ALL_ROLES.map(r => (
                        <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Durum</label>
                  <Select value={editingUser.status} onValueChange={(v: "active" | "inactive") => setEditingUser({...editingUser, status: v})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="active" className="text-white">Aktif</SelectItem>
                      <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">İzinler</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PERMISSIONS.map((perm) => (
                      <Button
                        key={perm}
                        size="sm"
                        variant={editingUser.permissions?.includes(perm) ? "default" : "outline"}
                        onClick={() => togglePermission(perm, false)}
                        className={editingUser.permissions?.includes(perm) ? "bg-blue-600" : "border-slate-600 text-slate-400"}
                      >
                        {perm}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEditUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                  <Button onClick={() => setIsEditUserOpen(false)} variant="outline" className="border-slate-600 text-slate-300">
                    <X className="mr-2 h-4 w-4" />
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Kullanıcı Şifre Değiştir Dialog */}
        <Dialog open={isEditPasswordOpen} onOpenChange={setIsEditPasswordOpen}>
          <DialogContent className="sm:max-w-[400px] bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Kullanıcı Şifresini Değiştir</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-sm text-slate-400 mb-2">
                Kullanıcı: <strong className="text-white">{users.find(u => u.id === editPasswordData.userId)?.name}</strong>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yeni Şifre</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={editPasswordData.newPassword}
                    onChange={(e) => setEditPasswordData({...editPasswordData, newPassword: e.target.value})}
                    className="pr-10 bg-slate-700 border-slate-600 text-white"
                    placeholder="En az 6 karakter"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Şifre Tekrar</label>
                <Input
                  type="password"
                  value={editPasswordData.confirmPassword}
                  onChange={(e) => setEditPasswordData({...editPasswordData, confirmPassword: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Yeni şifreyi tekrar girin"
                />
              </div>
              <Button onClick={handleEditUserPassword} disabled={!editPasswordData.newPassword || !editPasswordData.confirmPassword} className="bg-blue-600 hover:bg-blue-700">
                <KeyRound className="mr-2 h-4 w-4" />
                Şifreyi Değiştir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        {showDeleteConfirm && (
          <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">⚠️ Kullanıcı Sil</DialogTitle>
              </DialogHeader>
              <p className="text-slate-300 py-4">
                <strong>{users.find(u => u.id === showDeleteConfirm)?.name}</strong> isimli kullanıcıyı silmek istediğinize emin misiniz?
                <br />
                <span className="text-red-400 text-sm">Bu işlem geri alınamaz!</span>
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleDeleteUser(showDeleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">
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
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Save, Building, User, Bell, Shield, Palette, Mail, Phone, MapPin, KeyRound, Plus, Trash2, Moon, Sun, Eye, EyeOff, CheckCircle2 } from "lucide-react"

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
}

const initialCompany: CompanySettings = {
  name: "Yesiltas Teknik Servis",
  address: "Istanbul, Kadikoy, Caferaga Mah. Ornek Sok. No:15",
  phone: "0216 123 4567",
  email: "info@yesiltas.com",
  taxNumber: "123 456 7890",
  iban: "TR00 1234 5678 9012 3456 7890 12",
  accountName: "Yesiltas Teknik Servis",
}

const initialUsers: AppUser[] = [
  { id: 1, username: "admin", name: "Yonetici", role: "Yonetici", permissions: ["Tum Yetkiler"], status: "active" },
  { id: 2, username: "teknisyen", name: "Teknisyen", role: "Teknisyen", permissions: ["Tamir", "Envanter", "Musteriler"], status: "active" },
  { id: 3, username: "kasa", name: "Kasiyer", role: "Kasiyer", permissions: ["Satis", "Finans", "Musteriler"], status: "active" },
]

const allRoles = ["Yonetici", "Teknisyen", "Kasiyer", "Muhasebeci"]
const allPermissions = ["Tamir", "Finans", "Envanter", "Personel", "Raporlar", "Ayarlar", "Satis", "Musteriler", "Randevular", "Tedarikciler"]

export default function SettingsPage() {
  const router = useRouter()
  const [company, setCompany] = useState<CompanySettings>(initialCompany)
  const [users, setUsers] = useState<AppUser[]>(initialUsers)
  const [saved, setSaved] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
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

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleAddUser = () => {
    if (!newUser.username || !newUser.name) return
    const user: AppUser = {
      id: Date.now(),
      username: newUser.username,
      name: newUser.name,
      role: newUser.role || "Teknisyen",
      permissions: newUser.permissions || [],
      status: "active"
    }
    setUsers([user, ...users])
    setNewUser({ role: "Teknisyen", status: "active", permissions: [] })
    setIsNewUserOpen(false)
  }

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id))
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword.length < 6) {
      alert("Sifre en az 6 karakter olmali!")
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Sifreler eslesmiyor!")
      return
    }
    alert("Sifreniz basariyla degistirildi!")
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setIsPasswordOpen(false)
  }

  const togglePermission = (perm: string) => {
    const currentPerms = newUser.permissions || []
    if (currentPerms.includes(perm)) {
      setNewUser({ ...newUser, permissions: currentPerms.filter(p => p !== perm) })
    } else {
      setNewUser({ ...newUser, permissions: [...currentPerms, perm] })
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Yonetici": return <Badge className="bg-red-900/50 text-red-300 border-red-700">{role}</Badge>
      case "Teknisyen": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">{role}</Badge>
      case "Kasiyer": return <Badge className="bg-green-900/50 text-green-300 border-green-700">{role}</Badge>
      default: return <Badge className="bg-slate-700 text-slate-300">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Ayarlar</h1>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
      </div>

      {saved && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Ayarlar basariyla kaydedildi!
        </div>
      )}

      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px] bg-slate-800">
          <TabsTrigger value="company" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sirket</TabsTrigger>
          <TabsTrigger value="user" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Kullanici</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Kullanicilar</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Sirket Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Sirket Adi</label>
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Vergi Numarasi</label>
                  <Input
                    value={company.taxNumber}
                    onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Adres</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    className="pl-9 bg-slate-800 border-slate-700 text-white"
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
                      className="pl-9 bg-slate-800 border-slate-700 text-white"
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
                      className="pl-9 bg-slate-800 border-slate-700 text-white"
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-slate-700" />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">IBAN</label>
                <Input
                  value={company.iban}
                  onChange={(e) => setCompany({ ...company, iban: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Hesap Adi</label>
                <Input
                  value={company.accountName}
                  onChange={(e) => setCompany({ ...company, accountName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                Mevcut Kullanici
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {currentUser?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <div className="font-semibold text-white text-lg">{currentUser?.name || "Admin"}</div>
                  <div className="text-sm text-slate-400">{currentUser?.role || "Yonetici"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Ad Soyad</label>
                  <Input value={currentUser?.name || ""} disabled className="bg-slate-800 border-slate-700 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Rol</label>
                  <Input value={currentUser?.role || ""} disabled className="bg-slate-800 border-slate-700 text-slate-400" />
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <Button onClick={() => setIsPasswordOpen(true)} className="w-full">
                <KeyRound className="mr-2 h-4 w-4" />
                Sifre Degistir
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Kullanici Yonetimi
              </CardTitle>
              <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Kullanici
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Yeni Kullanici Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Kullanici Adi *</label>
                      <Input
                        value={newUser.username || ""}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="kullaniciadi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Ad Soyad *</label>
                      <Input
                        value={newUser.name || ""}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Ahmet Yilmaz"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Rol</label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {allRoles.map(r => (
                            <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Izinler</label>
                      <div className="flex flex-wrap gap-2">
                        {allPermissions.map((perm) => (
                          <Button
                            key={perm}
                            size="sm"
                            variant={newUser.permissions?.includes(perm) ? "default" : "outline"}
                            onClick={() => togglePermission(perm)}
                            className={newUser.permissions?.includes(perm) ? "" : "border-slate-600 text-slate-400"}
                          >
                            {perm}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddUser} disabled={!newUser.username || !newUser.name}>
                      <Save className="mr-2 h-4 w-4" />
                      Kullanici Ekle
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-sm text-slate-400">@{user.username}</div>
                        <div className="flex gap-1 mt-1">
                          {getRoleBadge(user.role)}
                          {user.status === "active" ? (
                            <Badge className="bg-green-900/50 text-green-300 border-green-700">Aktif</Badge>
                          ) : (
                            <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-500" />
                Sistem Ayarlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-white">Bildirimler</div>
                    <div className="text-sm text-slate-400">E-posta ve uygulama bildirimlerini al</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:text-white"
                >
                  Acik
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium text-white">Karanlik Mod</div>
                    <div className="text-sm text-slate-400">Koyu tema kullan</div>
                  </div>
                </div>
                <Button
                  variant={darkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className={darkMode ? "" : "border-slate-600 text-slate-300 hover:text-white"}
                >
                  {darkMode ? <Moon className="h-4 w-4 mr-1" /> : <Sun className="h-4 w-4 mr-1" />}
                  {darkMode ? "Acik" : "Kapali"}
                </Button>
              </div>

              <Separator className="bg-slate-700" />

              <div className="space-y-2">
                <h3 className="font-medium text-white">Sistem Bilgileri</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-500">Versiyon:</div>
                  <div className="text-slate-300">v1.0.0</div>
                  <div className="text-slate-500">Son Guncelleme:</div>
                  <div className="text-slate-300">01.08.2026</div>
                  <div className="text-slate-500">Lisans:</div>
                  <div className="text-slate-300">Yesiltas ERP Pro</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sifre Degistir Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Sifre Degistir</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mevcut Sifre</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="pl-9 pr-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="Mevcut sifreniz"
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
              <label className="text-sm font-medium text-slate-300">Yeni Sifre</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="En az 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sifre Tekrar</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Yeni sifreyi tekrar girin"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Sifreyi Degistir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
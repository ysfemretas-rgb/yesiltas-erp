"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Building, User, Bell, Shield, Palette, Mail, Phone, MapPin } from "lucide-react"

interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  taxNumber: string
  logo: string
}

interface UserSettings {
  name: string
  email: string
  phone: string
  role: string
  notifications: boolean
  darkMode: boolean
}

const initialCompany: CompanySettings = {
  name: "Yeşiltaş Teknik Servis",
  address: "İstanbul, Kadıköy, Caferağa Mah. Örnek Sok. No:15",
  phone: "0216 123 4567",
  email: "info@yesiltas.com",
  taxNumber: "123 456 7890",
  logo: "",
}

const initialUser: UserSettings = {
  name: "Admin Kullanıcı",
  email: "admin@yesiltas.com",
  phone: "0555 123 4567",
  role: "Yönetici",
  notifications: true,
  darkMode: false,
}

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings>(initialCompany)
  const [user, setUser] = useState<UserSettings>(initialUser)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
      </div>

      {saved && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm font-medium">
          Ayarlar başarıyla kaydedildi!
        </div>
      )}

      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="company">Şirket</TabsTrigger>
          <TabsTrigger value="user">Kullanıcı</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Şirket Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Şirket Adı</label>
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vergi Numarası</label>
                  <Input
                    value={company.taxNumber}
                    onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adres</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kullanıcı Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad Soyad</label>
                  <Input
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Input value={user.role} disabled className="bg-muted" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sistem Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Bildirimler</div>
                    <div className="text-sm text-muted-foreground">E-posta ve uygulama bildirimlerini al</div>
                  </div>
                </div>
                <Button
                  variant={user.notifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUser({ ...user, notifications: !user.notifications })}
                >
                  {user.notifications ? "Açık" : "Kapalı"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Karanlık Mod</div>
                    <div className="text-sm text-muted-foreground">Koyu tema kullan</div>
                  </div>
                </div>
                <Button
                  variant={user.darkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUser({ ...user, darkMode: !user.darkMode })}
                >
                  {user.darkMode ? "Açık" : "Kapalı"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Sistem Bilgileri</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Versiyon:</div>
                  <div>v1.0.0</div>
                  <div className="text-muted-foreground">Son Güncelleme:</div>
                  <div>31.07.2024</div>
                  <div className="text-muted-foreground">Lisans:</div>
                  <div>Yeşiltaş ERP Pro</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
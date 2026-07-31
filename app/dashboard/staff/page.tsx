"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Plus, Users, Search, Phone, Mail, Shield } from "lucide-react"

interface StaffMember {
  id: number
  name: string
  email: string
  phone: string
  role: string
  department: string
  joinDate: string
  status: "active" | "inactive" | "on_leave"
  permissions: string[]
}

const initialStaff: StaffMember[] = [
  { id: 1, name: "Ahmet Yılmaz", email: "ahmet@yesiltas.com", phone: "0555 123 4567", role: "Teknisyen", department: "Tamir", joinDate: "2023-01-15", status: "active", permissions: ["Tamir", "Envanter"] },
  { id: 2, name: "Mehmet Kaya", email: "mehmet@yesiltas.com", phone: "0555 234 5678", role: "Teknisyen", department: "Tamir", joinDate: "2023-03-20", status: "active", permissions: ["Tamir"] },
  { id: 3, name: "Ayşe Demir", email: "ayse@yesiltas.com", phone: "0555 345 6789", role: "Muhasebeci", department: "Muhasebe", joinDate: "2023-06-01", status: "active", permissions: ["Finans", "Raporlar"] },
  { id: 4, name: "Fatma Şahin", email: "fatma@yesiltas.com", phone: "0555 456 7890", role: "Yönetici", department: "Yönetim", joinDate: "2022-01-10", status: "active", permissions: ["Tamir", "Finans", "Envanter", "Personel", "Raporlar", "Ayarlar"] },
  { id: 5, name: "Ali Veli", email: "ali@yesiltas.com", phone: "0555 567 8901", role: "Teknisyen", department: "Tamir", joinDate: "2024-01-05", status: "on_leave", permissions: ["Tamir", "Envanter"] },
]

const roles = Array.from(new Set(initialStaff.map(s => s.role)))
const departments = Array.from(new Set(initialStaff.map(s => s.department)))

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMember, setNewMember] = useState<Partial<StaffMember>>({
    role: "Teknisyen",
    department: "Tamir",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case "inactive": return <Badge variant="secondary">Pasif</Badge>
      case "on_leave": return <Badge className="bg-yellow-100 text-yellow-800">İzinde</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || s.role === filterRole
    const matchesStatus = filterStatus === "all" || s.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const activeCount = staff.filter(s => s.status === "active").length
  const onLeaveCount = staff.filter(s => s.status === "on_leave").length

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) return
    const member: StaffMember = {
      id: Date.now(),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone || "",
      role: newMember.role || "Teknisyen",
      department: newMember.department || "Tamir",
      joinDate: newMember.joinDate || new Date().toISOString().split("T")[0],
      status: "active",
      permissions: newMember.permissions || ["Tamir"],
    }
    setStaff([member, ...staff])
    setNewMember({ role: "Teknisyen", department: "Tamir", status: "active", joinDate: new Date().toISOString().split("T")[0] })
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Personel Yönetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Personel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yeni Personel Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input
                  value={newMember.name || ""}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={newMember.email || ""}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="ornek@yesiltas.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    value={newMember.phone || ""}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="0555 123 4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departman</label>
                  <Select
                    value={newMember.department}
                    onValueChange={(value) => setNewMember({ ...newMember, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={newMember.joinDate}
                  onChange={(e) => setNewMember({ ...newMember, joinDate: e.target.value })}
                />
              </div>
              <Button onClick={handleAddMember} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İzinde</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{onLeaveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departman</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="on_leave">İzinde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{member.name}</span>
                    {getStatusBadge(member.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {member.phone}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Rol:</span> {member.role}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Departman:</span> {member.department}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                    ))}
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
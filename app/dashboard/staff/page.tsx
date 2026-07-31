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
  { id: 1, name: "Ahmet Yilmaz", email: "ahmet@yesiltas.com", phone: "0555 123 4567", role: "Teknisyen", department: "Tamir", joinDate: "2023-01-15", status: "active", permissions: ["Tamir", "Envanter"] },
  { id: 2, name: "Mehmet Kaya", email: "mehmet@yesiltas.com", phone: "0555 234 5678", role: "Teknisyen", department: "Tamir", joinDate: "2023-03-20", status: "active", permissions: ["Tamir"] },
  { id: 3, name: "Ayse Demir", email: "ayse@yesiltas.com", phone: "0555 345 6789", role: "Muhasebeci", department: "Muhasebe", joinDate: "2023-06-01", status: "active", permissions: ["Finans", "Raporlar"] },
  { id: 4, name: "Fatma Sahin", email: "fatma@yesiltas.com", phone: "0555 456 7890", role: "Yonetici", department: "Yonetim", joinDate: "2022-01-10", status: "active", permissions: ["Tamir", "Finans", "Envanter", "Personel", "Raporlar", "Ayarlar"] },
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
      case "active": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Aktif</Badge>
      case "inactive": return <Badge className="bg-slate-700 text-slate-300">Pasif</Badge>
      case "on_leave": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Izinde</Badge>
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Personel Yonetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Personel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Personel Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Ad Soyad</label>
                <Input
                  value={newMember.name || ""}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Ad Soyad"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">E-posta</label>
                  <Input
                    type="email"
                    value={newMember.email || ""}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="ornek@yesiltas.com"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefon</label>
                  <Input
                    value={newMember.phone || ""}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="0555 123 4567"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Rol</label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {roles.map((role) => (
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
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-white">{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Baslangic Tarihi</label>
                <Input
                  type="date"
                  value={newMember.joinDate}
                  onChange={(e) => setNewMember({ ...newMember, joinDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
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
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Personel</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{staff.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aktif</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Izinde</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{onLeaveCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Departman</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
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
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tum Roller</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role} className="text-white">{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tumu</SelectItem>
                  <SelectItem value="active" className="text-white">Aktif</SelectItem>
                  <SelectItem value="inactive" className="text-white">Pasif</SelectItem>
                  <SelectItem value="on_leave" className="text-white">Izinde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-lg">{member.name}</span>
                    {getStatusBadge(member.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {member.phone}
                    </div>
                    <div>
                      <span className="font-medium text-slate-300">Rol:</span> {member.role}
                    </div>
                    <div>
                      <span className="font-medium text-slate-300">Departman:</span> {member.department}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="border-slate-600 text-slate-400 text-xs">{perm}</Badge>
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
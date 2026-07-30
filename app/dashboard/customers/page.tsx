"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Search, Plus, Trash2, Edit, Phone, MessageCircle, Eye } from "lucide-react"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  created_at: string
}

interface Debt {
  id: string
  customer_id: string
  customer_name: string
  amount: number
  remaining: number
  type: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" })
  const [editForm, setEditForm] = useState({ id: "", name: "", phone: "", email: "", address: "" })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = customers
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, customers])

  async function loadData() {
    setLoading(true)
    const { data: customersData } = await supabase.from("customers").select("*").order("created_at", { ascending: false })
    const { data: debtsData } = await supabase.from("debts").select("*")
    if (customersData) setCustomers(customersData)
    if (debtsData) setDebts(debtsData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from("customers").insert([{
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address
    }])

    if (error) {
      toast.error("Müşteri eklenirken hata: " + error.message)
      return
    }

    toast.success("Müşteri başarıyla eklendi")
    setShowAddModal(false)
    setForm({ name: "", phone: "", email: "", address: "" })
    loadData()
  }

  const openEditModal = (customer: Customer) => {
    setEditForm({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || ""
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from("customers").update({
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      address: editForm.address
    }).eq("id", editForm.id)

    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }

    toast.success("Müşteri güncellendi")
    setShowEditModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("customers").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("Müşteri silindi")
    loadData()
  }

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const getCustomerDebts = (customerId: string) => {
    return debts.filter(d => d.customer_id === customerId)
  }

  const getTotalDebt = (customerId: string) => {
    return getCustomerDebts(customerId).reduce((sum, d) => sum + (d.remaining || 0), 0)
  }

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    window.open(`https://wa.me/90${cleanPhone}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Müşteri</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <Input
              placeholder="Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Borç</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(customer => {
                  const totalDebt = getTotalDebt(customer.id)
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        {totalDebt > 0 ? (
                          <span className="text-red-600 font-medium">{totalDebt.toLocaleString("tr-TR")} ₺</span>
                        ) : (
                          <span className="text-green-600">Borç yok</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDetailModal(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {customer.phone && (
                            <Button variant="outline" size="sm" onClick={() => handleWhatsApp(customer.phone)}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Müşteri Detayı</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ad Soyad</Label>
                  <div className="font-medium">{selectedCustomer.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Telefon</Label>
                  <div className="font-medium">{selectedCustomer.phone}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">E-posta</Label>
                  <div className="font-medium">{selectedCustomer.email || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Adres</Label>
                  <div className="font-medium">{selectedCustomer.address || "-"}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Borçlar</Label>
                {getCustomerDebts(selectedCustomer.id).length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {getCustomerDebts(selectedCustomer.id).map(debt => (
                      <div key={debt.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{debt.type === "sale" ? "Satış" : "Servis"} Borcu</span>
                        <span className="font-medium text-red-600">{debt.remaining?.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded font-bold">
                      <span>Toplam Borç</span>
                      <span className="text-red-600">{getTotalDebt(selectedCustomer.id).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-green-600 mt-2">Borç bulunmuyor</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

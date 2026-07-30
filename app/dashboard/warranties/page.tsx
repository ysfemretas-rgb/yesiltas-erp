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
import { Search, Plus, Trash2, Shield, CheckCircle, XCircle } from "lucide-react"

interface Warranty {
  id: string
  sale_id: string
  customer_name: string
  item_name: string
  warranty_months: number
  warranty_end_date: string
  status: string
  created_at: string
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Warranty[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  const [form, setForm] = useState({
    customer_name: "",
    item_name: "",
    warranty_months: "12",
    warranty_end_date: "",
    status: "Aktif"
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = warranties
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(w =>
        w.customer_name?.toLowerCase().includes(term) ||
        w.item_name?.toLowerCase().includes(term) ||
        w.status?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, warranties])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from("warranties").select("*").order("created_at", { ascending: false })
    if (data) setWarranties(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const months = parseInt(form.warranty_months) || 12

    let endDate = form.warranty_end_date
    if (!endDate) {
      const d = new Date()
      d.setMonth(d.getMonth() + months)
      endDate = d.toISOString().split("T")[0]
    }

    const { error } = await supabase.from("warranties").insert([{
      customer_name: form.customer_name,
      item_name: form.item_name,
      warranty_months: months,
      warranty_end_date: endDate,
      status: form.status
    }])

    if (error) {
      toast.error("Garanti eklenirken hata: " + error.message)
      return
    }

    toast.success("Garanti başarıyla eklendi")
    setShowAddModal(false)
    setForm({ customer_name: "", item_name: "", warranty_months: "12", warranty_end_date: "", status: "Aktif" })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu garantiyi silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("warranties").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("Garanti silindi")
    loadData()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("warranties").update({ status: newStatus }).eq("id", id)
    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }
    toast.success("Durum güncellendi")
    loadData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aktif": return "bg-green-100 text-green-800"
      case "Süresi Dolmuş": return "bg-red-100 text-red-800"
      case "İptal": return "bg-gray-100 text-gray-800"
      default: return "bg-blue-100 text-blue-800"
    }
  }

  const activeWarranties = warranties.filter(w => w.status === "Aktif" && new Date(w.warranty_end_date) > new Date())
  const expiredWarranties = warranties.filter(w => w.status === "Aktif" && new Date(w.warranty_end_date) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Garantiler</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Garanti</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Garanti Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Müşteri Adı</Label>
                <Input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Garanti Süresi (Ay)</Label>
                <Input type="number" value={form.warranty_months} onChange={e => setForm({...form, warranty_months: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bitiş Tarihi (Opsiyonel)</Label>
                <Input type="date" value={form.warranty_end_date} onChange={e => setForm({...form, warranty_end_date: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Garanti</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeWarranties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolmuş</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredWarranties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warranties.length}</div>
          </CardContent>
        </Card>
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
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(warranty => {
                  const isExpired = new Date(warranty.warranty_end_date) <= new Date() && warranty.status === "Aktif"
                  return (
                    <TableRow key={warranty.id} className={isExpired ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{warranty.customer_name}</TableCell>
                      <TableCell>{warranty.item_name}</TableCell>
                      <TableCell>{warranty.warranty_months} ay</TableCell>
                      <TableCell>
                        {new Date(warranty.warranty_end_date).toLocaleDateString("tr-TR")}
                        {isExpired && <span className="text-red-600 text-xs ml-2">(Süresi Doldu)</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warranty.status)}`}>
                          {warranty.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {warranty.status === "Aktif" && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(warranty.id, "İptal")}>
                              İptal
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(warranty.id)}>
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
    </div>
  )
}

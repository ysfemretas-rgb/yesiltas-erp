"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Search, Plus, Trash2, Edit, ArrowDown, ArrowUp, Filter } from "lucide-react"

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  date: string
  created_at: string
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [dateFilter, setDateFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const [form, setForm] = useState({
    type: "income",
    category: "Satış",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  })

  const [editForm, setEditForm] = useState({
    id: "",
    type: "income",
    category: "Satış",
    amount: "",
    description: "",
    date: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = transactions
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(t =>
        t.description?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      )
    }
    if (dateFilter) {
      result = result.filter(t => t.date === dateFilter)
    }
    if (typeFilter) {
      result = result.filter(t => t.type === typeFilter)
    }
    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter)
    }
    setFiltered(result)
  }, [search, dateFilter, typeFilter, categoryFilter, transactions])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount) || 0

    const { error } = await supabase.from("transactions").insert([{
      type: form.type,
      category: form.category,
      amount: amount,
      description: form.description,
      date: form.date
    }])

    if (error) {
      toast.error("İşlem eklenirken hata: " + error.message)
      return
    }

    toast.success("İşlem başarıyla eklendi")
    setShowAddModal(false)
    setForm({ type: "income", category: "Satış", amount: "", description: "", date: new Date().toISOString().split("T")[0] })
    loadData()
  }

  const openEditModal = (transaction: Transaction) => {
    setEditForm({
      id: transaction.id,
      type: transaction.type || "income",
      category: transaction.category || "Satış",
      amount: transaction.amount?.toString() || "",
      description: transaction.description || "",
      date: transaction.date || ""
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(editForm.amount) || 0

    const { error } = await supabase.from("transactions").update({
      type: editForm.type,
      category: editForm.category,
      amount: amount,
      description: editForm.description,
      date: editForm.date
    }).eq("id", editForm.id)

    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }

    toast.success("İşlem güncellendi")
    setShowEditModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("İşlem silindi")
    loadData()
  }

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0)
  const balance = totalIncome - totalExpense

  const categories = [...new Set(transactions.map(t => t.category))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Kasa</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni İşlem</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İşlem Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tip</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tutar</Label>
                <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
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
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString("tr-TR")} ₺</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString("tr-TR")} ₺</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bakiye</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {balance.toLocaleString("tr-TR")} ₺
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tip</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ara</Label>
              <Input
                placeholder="Ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {transaction.type === "income" ? "Gelir" : "Gider"}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.amount?.toLocaleString("tr-TR")} ₺
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(transaction)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşlem Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tip</Label>
              <Select value={editForm.type} onValueChange={v => setEditForm({...editForm, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Tutar</Label>
              <Input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

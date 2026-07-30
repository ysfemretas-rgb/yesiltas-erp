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
import { Search, Plus, Trash2, Edit, DollarSign, Package, Smartphone } from "lucide-react"

interface Sale {
  id: string
  customer_id: string
  customer_name: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string
  installments: number
  remaining_amount: number
  warranty_months: number
  warranty_end_date: string
  cash: boolean
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface Inventory {
  id: string
  name: string
  quantity: number
  unit_price: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ sale_id: "", payment_amount: "" })
  const [activeTab, setActiveTab] = useState<"sales" | "sold">("sales")

  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    item_name: "",
    item_type: "Cihaz",
    quantity: "1",
    unit_price: "",
    payment_method: "Nakit",
    installments: "1",
    warranty_months: "12",
    selected_inventory: "",
    cash: true
  })

  const [editForm, setEditForm] = useState({
    id: "",
    customer_id: "",
    customer_name: "",
    item_name: "",
    item_type: "Cihaz",
    quantity: "1",
    unit_price: "",
    payment_method: "Nakit",
    installments: "1",
    remaining_amount: "",
    warranty_months: "12",
    cash: true
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = sales
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(s =>
        s.item_name?.toLowerCase().includes(term) ||
        s.customer_name?.toLowerCase().includes(term) ||
        s.item_type?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, sales])

  async function loadData() {
    setLoading(true)
    const { data: salesData } = await supabase.from("sales").select("*").order("created_at", { ascending: false })
    const { data: customersData } = await supabase.from("customers").select("id, name, phone")
    const { data: inventoryData } = await supabase.from("inventory").select("id, name, quantity, unit_price")
    if (salesData) setSales(salesData)
    if (customersData) setCustomers(customersData)
    if (inventoryData) setInventory(inventoryData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(form.quantity) || 1
    const price = parseFloat(form.unit_price) || 0
    const total = qty * price
    const installments = parseInt(form.installments) || 1
    const warrantyMonths = parseInt(form.warranty_months) || 12
    const cash = form.cash
    const remaining = !cash ? total : 0

    const warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

    const { data: saleData, error } = await supabase.from("sales").insert([{
      customer_id: form.customer_id || null,
      customer_name: form.customer_name,
      item_name: form.item_name,
      item_type: form.item_type,
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_method: form.payment_method,
      installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split("T")[0],
      cash
    }]).select()

    if (error) {
      toast.error("Satış eklenirken hata: " + error.message)
      return
    }

    // Stok düş
    if (form.selected_inventory) {
      const inv = inventory.find(i => i.id === form.selected_inventory)
      if (inv) {
        const newQty = inv.quantity - qty
        if (newQty >= 0) {
          await supabase.from("inventory").update({ quantity: newQty }).eq("id", form.selected_inventory)
        }
      }
    }

    // Kasa kaydı (peşin ise)
    if (cash) {
      await supabase.from("transactions").insert([{
        type: "income",
        category: "Satış",
        amount: total,
        description: `${form.customer_name} - ${form.item_name}`,
        date: new Date().toISOString().split("T")[0]
      }])
    } else {
      // Taksitli ise debts tablosuna kaydet
      await supabase.from("debts").insert([{
        customer_id: form.customer_id || null,
        customer_name: form.customer_name,
        amount: total,
        remaining: remaining,
        installments,
        paid_installments: 0,
        sale_id: saleData?.[0]?.id,
        type: "sale"
      }])
    }

    // Garanti kaydı
    await supabase.from("warranties").insert([{
      sale_id: saleData?.[0]?.id,
      customer_name: form.customer_name,
      item_name: form.item_name,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split("T")[0],
      status: "Aktif"
    }])

    toast.success("Satış başarıyla eklendi")
    setShowAddModal(false)
    setForm({
      customer_id: "", customer_name: "", item_name: "", item_type: "Cihaz",
      quantity: "1", unit_price: "", payment_method: "Nakit", installments: "1",
      warranty_months: "12", selected_inventory: "", cash: true
    })
    loadData()
  }

  const openEditModal = (sale: Sale) => {
    setEditForm({
      id: sale.id,
      customer_id: sale.customer_id || "",
      customer_name: sale.customer_name || "",
      item_name: sale.item_name || "",
      item_type: sale.item_type || "Cihaz",
      quantity: sale.quantity?.toString() || "1",
      unit_price: sale.unit_price?.toString() || "",
      payment_method: sale.payment_method || "Nakit",
      installments: sale.installments?.toString() || "1",
      remaining_amount: sale.remaining_amount?.toString() || "",
      warranty_months: sale.warranty_months?.toString() || "12",
      cash: sale.cash ?? true
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(editForm.quantity) || 1
    const price = parseFloat(editForm.unit_price) || 0
    const total = qty * price
    const installments = parseInt(editForm.installments) || 1
    const warrantyMonths = parseInt(editForm.warranty_months) || 12
    const cash = editForm.cash
    const remaining = !cash ? total : 0

    const warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

    const { error } = await supabase.from("sales").update({
      customer_id: editForm.customer_id || null,
      customer_name: editForm.customer_name,
      item_name: editForm.item_name,
      item_type: editForm.item_type,
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_method: editForm.payment_method,
      installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split("T")[0],
      cash
    }).eq("id", editForm.id)

    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }

    toast.success("Satış güncellendi")
    setShowEditModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu satışı silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("sales").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("Satış silindi")
    loadData()
  }

  const openPaymentModal = (sale: Sale) => {
    setPaymentForm({ sale_id: sale.id, payment_amount: sale.remaining_amount?.toString() || "" })
    setShowPaymentModal(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(paymentForm.payment_amount) || 0
    if (amount <= 0) {
      toast.error("Geçerli bir tutar girin")
      return
    }

    const sale = sales.find(s => s.id === paymentForm.sale_id)
    if (!sale) return

    const newRemaining = Math.max(0, (sale.remaining_amount || 0) - amount)

    // Kasa kaydı
    const { error: transError } = await supabase.from("transactions").insert([{
      type: "income",
      category: "Taksit Ödeme",
      amount: amount,
      description: `${sale.customer_name} - ${sale.item_name} taksit ödemesi`,
      date: new Date().toISOString().split("T")[0]
    }])

    if (transError) {
      toast.error("Kasa kaydı eklenirken hata: " + transError.message)
      return
    }

    // Satış güncelle
    const { error: updateError } = await supabase.from("sales").update({
      remaining_amount: newRemaining
    }).eq("id", paymentForm.sale_id)

    if (updateError) {
      toast.error("Ödeme güncellenirken hata: " + updateError.message)
      return
    }

    // Debts güncelle
    const { data: debtData } = await supabase.from("debts").select("*").eq("sale_id", paymentForm.sale_id).single()
    if (debtData) {
      const paidInst = (debtData.paid_installments || 0) + 1
      await supabase.from("debts").update({
        remaining: newRemaining,
        paid_installments: paidInst
      }).eq("id", debtData.id)
    }

    toast.success("Ödeme alındı ve kasaya kaydedildi")
    setShowPaymentModal(false)
    loadData()
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setForm(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name
      }))
    }
  }

  const handleInventorySelect = (inventoryId: string) => {
    const inv = inventory.find(i => i.id === inventoryId)
    if (inv) {
      setForm(prev => ({
        ...prev,
        selected_inventory: inventoryId,
        item_name: inv.name,
        unit_price: inv.unit_price?.toString() || ""
      }))
    }
  }

  const soldDevices = sales.filter(s => s.item_type === "Cihaz")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Satış & Satılan Cihazlar</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Satış</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Satış Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Müşteri Seç</Label>
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Müşteri Adı</Label>
                  <Input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Stoktan Seç</Label>
                  <Select onValueChange={handleInventorySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Stoktan ürün seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} adet) - {i.unit_price?.toLocaleString("tr-TR")} ₺</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ürün Adı</Label>
                  <Input value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Ürün Türü</Label>
                  <Select value={form.item_type} onValueChange={v => setForm({...form, item_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cihaz">Cihaz</SelectItem>
                      <SelectItem value="Aksesuar">Aksesuar</SelectItem>
                      <SelectItem value="Yedek Parça">Yedek Parça</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Adet</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Birim Fiyat</Label>
                  <Input type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Ödeme Şekli</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({...form, payment_method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nakit">Nakit</SelectItem>
                      <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                      <SelectItem value="Havale">Havale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peşin / Taksitli</Label>
                  <Select value={form.cash ? "pesin" : "taksitli"} onValueChange={v => setForm({...form, cash: v === "pesin"})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pesin">Peşin</SelectItem>
                      <SelectItem value="taksitli">Taksitli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!form.cash && (
                  <div className="space-y-2">
                    <Label>Taksit Sayısı</Label>
                    <Input type="number" min="2" value={form.installments} onChange={e => setForm({...form, installments: e.target.value})} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Garanti (Ay)</Label>
                  <Input type="number" value={form.warranty_months} onChange={e => setForm({...form, warranty_months: e.target.value})} />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="text-lg font-semibold">
                  Toplam: {(parseInt(form.quantity || "0") * parseFloat(form.unit_price || "0")).toLocaleString("tr-TR")} ₺
                </div>
                {!form.cash && (
                  <div className="text-sm text-muted-foreground">
                    Aylık Taksit: {((parseInt(form.quantity || "0") * parseFloat(form.unit_price || "0")) / (parseInt(form.installments) || 1)).toLocaleString("tr-TR")} ₺
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">Satış Yap</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "sales" ? "default" : "outline"}
          onClick={() => setActiveTab("sales")}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Tüm Satışlar
        </Button>
        <Button
          variant={activeTab === "sold" ? "default" : "outline"}
          onClick={() => setActiveTab("sold")}
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Satılan Cihazlar
        </Button>
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
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>Ödeme</TableHead>
                  <TableHead>Kalan</TableHead>
                  <TableHead>Garanti</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "sales" ? filtered : filtered.filter(s => s.item_type === "Cihaz")).map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{sale.customer_name}</div>
                    </TableCell>
                    <TableCell>{sale.item_name}</TableCell>
                    <TableCell>{sale.item_type}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.unit_price?.toLocaleString("tr-TR")} ₺</TableCell>
                    <TableCell className="font-medium">{sale.total_price?.toLocaleString("tr-TR")} ₺</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.cash ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {sale.cash ? "Peşin" : `Taksit (${sale.installments})`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sale.remaining_amount > 0 ? (
                        <span className="text-red-600 font-medium">{sale.remaining_amount?.toLocaleString("tr-TR")} ₺</span>
                      ) : (
                        <span className="text-green-600">Ödendi</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sale.warranty_months} ay
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.warranty_end_date).toLocaleDateString("tr-TR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {sale.remaining_amount > 0 && (
                          <Button variant="outline" size="sm" onClick={() => openPaymentModal(sale)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(sale.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Satış Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Müşteri Adı</Label>
                <Input value={editForm.customer_name} onChange={e => setEditForm({...editForm, customer_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input value={editForm.item_name} onChange={e => setEditForm({...editForm, item_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Ürün Türü</Label>
                <Select value={editForm.item_type} onValueChange={v => setEditForm({...editForm, item_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cihaz">Cihaz</SelectItem>
                    <SelectItem value="Aksesuar">Aksesuar</SelectItem>
                    <SelectItem value="Yedek Parça">Yedek Parça</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input type="number" min="1" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Birim Fiyat</Label>
                <Input type="number" value={editForm.unit_price} onChange={e => setEditForm({...editForm, unit_price: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Ödeme Şekli</Label>
                <Select value={editForm.payment_method} onValueChange={v => setEditForm({...editForm, payment_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nakit">Nakit</SelectItem>
                    <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                    <SelectItem value="Havale">Havale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peşin / Taksitli</Label>
                <Select value={editForm.cash ? "pesin" : "taksitli"} onValueChange={v => setEditForm({...editForm, cash: v === "pesin"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pesin">Peşin</SelectItem>
                    <SelectItem value="taksitli">Taksitli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editForm.cash && (
                <div className="space-y-2">
                  <Label>Taksit Sayısı</Label>
                  <Input type="number" min="2" value={editForm.installments} onChange={e => setEditForm({...editForm, installments: e.target.value})} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Garanti (Ay)</Label>
                <Input type="number" value={editForm.warranty_months} onChange={e => setEditForm({...editForm, warranty_months: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Taksit Ödeme Al</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Ödeme Tutarı</Label>
              <Input
                type="number"
                value={paymentForm.payment_amount}
                onChange={e => setPaymentForm({...paymentForm, payment_amount: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full">Ödeme Al</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

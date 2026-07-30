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
import { Search, Plus, Trash2, Edit, Phone, Wrench, DollarSign } from "lucide-react"

interface Device {
  id: string
  customer_name: string
  customer_phone: string
  device_type: string
  brand: string
  model: string
  serial_number: string
  problem: string
  status: string
  estimated_cost: number
  actual_cost: number
  payment_status: string
  notes: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Device[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ device_id: "", amount: "" })

  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    device_type: "Telefon",
    brand: "",
    model: "",
    serial_number: "",
    problem: "",
    status: "Beklemede",
    estimated_cost: "",
    actual_cost: "",
    payment_status: "Ödenmedi",
    notes: ""
  })

  const [editForm, setEditForm] = useState({
    id: "",
    customer_name: "",
    customer_phone: "",
    device_type: "Telefon",
    brand: "",
    model: "",
    serial_number: "",
    problem: "",
    status: "Beklemede",
    estimated_cost: "",
    actual_cost: "",
    payment_status: "Ödenmedi",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let result = devices
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(d =>
        d.customer_name?.toLowerCase().includes(term) ||
        d.device_type?.toLowerCase().includes(term) ||
        d.brand?.toLowerCase().includes(term) ||
        d.model?.toLowerCase().includes(term) ||
        d.status?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, devices])

  async function loadData() {
    setLoading(true)
    const { data: devicesData } = await supabase.from("devices").select("*").order("created_at", { ascending: false })
    const { data: customersData } = await supabase.from("customers").select("id, name, phone")
    if (devicesData) setDevices(devicesData)
    if (customersData) setCustomers(customersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const estimated = parseFloat(form.estimated_cost) || 0
    const actual = parseFloat(form.actual_cost) || 0

    const { error } = await supabase.from("devices").insert([{
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      device_type: form.device_type,
      brand: form.brand,
      model: form.model,
      serial_number: form.serial_number,
      problem: form.problem,
      status: form.status,
      estimated_cost: estimated,
      actual_cost: actual,
      payment_status: form.payment_status,
      notes: form.notes
    }])

    if (error) {
      toast.error("Cihaz eklenirken hata: " + error.message)
      return
    }

    toast.success("Cihaz başarıyla eklendi")
    setShowAddModal(false)
    setForm({
      customer_id: "", customer_name: "", customer_phone: "", device_type: "Telefon",
      brand: "", model: "", serial_number: "", problem: "", status: "Beklemede",
      estimated_cost: "", actual_cost: "", payment_status: "Ödenmedi", notes: ""
    })
    loadData()
  }

  const openEditModal = (device: Device) => {
    setEditForm({
      id: device.id,
      customer_name: device.customer_name || "",
      customer_phone: device.customer_phone || "",
      device_type: device.device_type || "Telefon",
      brand: device.brand || "",
      model: device.model || "",
      serial_number: device.serial_number || "",
      problem: device.problem || "",
      status: device.status || "Beklemede",
      estimated_cost: device.estimated_cost?.toString() || "",
      actual_cost: device.actual_cost?.toString() || "",
      payment_status: device.payment_status || "Ödenmedi",
      notes: device.notes || ""
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const estimated = parseFloat(editForm.estimated_cost) || 0
    const actual = parseFloat(editForm.actual_cost) || 0

    const { error } = await supabase.from("devices").update({
      customer_name: editForm.customer_name,
      customer_phone: editForm.customer_phone,
      device_type: editForm.device_type,
      brand: editForm.brand,
      model: editForm.model,
      serial_number: editForm.serial_number,
      problem: editForm.problem,
      status: editForm.status,
      estimated_cost: estimated,
      actual_cost: actual,
      payment_status: editForm.payment_status,
      notes: editForm.notes
    }).eq("id", editForm.id)

    if (error) {
      toast.error("Güncellenirken hata: " + error.message)
      return
    }

    toast.success("Cihaz güncellendi")
    setShowEditModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu cihazı silmek istediğinize emin misiniz?")) return
    const { error } = await supabase.from("devices").delete().eq("id", id)
    if (error) {
      toast.error("Silinirken hata: " + error.message)
      return
    }
    toast.success("Cihaz silindi")
    loadData()
  }

  const openPaymentModal = (device: Device) => {
    setPaymentForm({ device_id: device.id, amount: device.actual_cost?.toString() || "" })
    setShowPaymentModal(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(paymentForm.amount) || 0
    if (amount <= 0) {
      toast.error("Geçerli bir tutar girin")
      return
    }

    const device = devices.find(d => d.id === paymentForm.device_id)
    if (!device) return

    // Kasa kaydı ekle
    const { error: transError } = await supabase.from("transactions").insert([{
      type: "income",
      category: "Teknik Servis",
      amount: amount,
      description: `${device.customer_name} - ${device.device_type} ${device.brand} ${device.model}`,
      date: new Date().toISOString().split("T")[0]
    }])

    if (transError) {
      toast.error("Kasa kaydı eklenirken hata: " + transError.message)
      return
    }

    // Cihaz ödeme durumunu güncelle
    const { error: updateError } = await supabase.from("devices").update({
      payment_status: "Ödendi"
    }).eq("id", paymentForm.device_id)

    if (updateError) {
      toast.error("Ödeme durumu güncellenirken hata: " + updateError.message)
      return
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
        customer_name: customer.name,
        customer_phone: customer.phone || ""
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Tamamlandı": return "bg-green-100 text-green-800"
      case "Beklemede": return "bg-yellow-100 text-yellow-800"
      case "İşlemde": return "bg-blue-100 text-blue-800"
      case "İptal": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Ödendi": return "bg-green-100 text-green-800"
      case "Kısmi": return "bg-yellow-100 text-yellow-800"
      case "Ödenmedi": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Teknik Servis</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Cihaz</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Cihaz Ekle</DialogTitle>
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
                  <Label>Telefon</Label>
                  <Input value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cihaz Türü</Label>
                  <Select value={form.device_type} onValueChange={v => setForm({...form, device_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telefon">Telefon</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Bilgisayar">Bilgisayar</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Seri No</Label>
                  <Input value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tahmini Maliyet</Label>
                  <Input type="number" value={form.estimated_cost} onChange={e => setForm({...form, estimated_cost: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Gerçek Maliyet</Label>
                  <Input type="number" value={form.actual_cost} onChange={e => setForm({...form, actual_cost: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beklemede">Beklemede</SelectItem>
                      <SelectItem value="İşlemde">İşlemde</SelectItem>
                      <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                      <SelectItem value="İptal">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ödeme Durumu</Label>
                  <Select value={form.payment_status} onValueChange={v => setForm({...form, payment_status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ödenmedi">Ödenmedi</SelectItem>
                      <SelectItem value="Kısmi">Kısmi</SelectItem>
                      <SelectItem value="Ödendi">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sorun</Label>
                <Input value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead>Marka/Model</TableHead>
                  <TableHead>Sorun</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Ödeme</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(device => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="font-medium">{device.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{device.customer_phone}</div>
                    </TableCell>
                    <TableCell>{device.device_type}</TableCell>
                    <TableCell>{device.brand} {device.model}</TableCell>
                    <TableCell>{device.problem}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Tah: {device.estimated_cost?.toLocaleString("tr-TR")} ₺</div>
                      <div className="text-sm font-medium">Ger: {device.actual_cost?.toLocaleString("tr-TR")} ₺</div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(device.payment_status)}`}>
                        {device.payment_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(device)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {device.payment_status !== "Ödendi" && device.status === "Tamamlandı" && (
                          <Button variant="outline" size="sm" onClick={() => openPaymentModal(device)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(device.id)}>
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
            <DialogTitle>Cihaz Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Müşteri Adı</Label>
                <Input value={editForm.customer_name} onChange={e => setEditForm({...editForm, customer_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={editForm.customer_phone} onChange={e => setEditForm({...editForm, customer_phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cihaz Türü</Label>
                <Select value={editForm.device_type} onValueChange={v => setEditForm({...editForm, device_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telefon">Telefon</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Bilgisayar">Bilgisayar</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marka</Label>
                <Input value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Seri No</Label>
                <Input value={editForm.serial_number} onChange={e => setEditForm({...editForm, serial_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tahmini Maliyet</Label>
                <Input type="number" value={editForm.estimated_cost} onChange={e => setEditForm({...editForm, estimated_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Gerçek Maliyet</Label>
                <Input type="number" value={editForm.actual_cost} onChange={e => setEditForm({...editForm, actual_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beklemede">Beklemede</SelectItem>
                    <SelectItem value="İşlemde">İşlemde</SelectItem>
                    <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                    <SelectItem value="İptal">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Durumu</Label>
                <Select value={editForm.payment_status} onValueChange={v => setEditForm({...editForm, payment_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ödenmedi">Ödenmedi</SelectItem>
                    <SelectItem value="Kısmi">Kısmi</SelectItem>
                    <SelectItem value="Ödendi">Ödendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sorun</Label>
              <Input value={editForm.problem} onChange={e => setEditForm({...editForm, problem: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Güncelle</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Al</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Ödeme Tutarı</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
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

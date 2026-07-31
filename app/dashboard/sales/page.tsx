"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface Sale {
  id: string
  customer_name: string
  customer_phone: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  cash: number
  remaining_amount: number
  warranty_months: number
  warranty_end_date: string
  created_at: string
  imei: string
  brand: string
  model: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  price: number
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const [search, setSearch] = useState("")
  const [editSale, setEditSale] = useState<Sale | null>(null)

  // Form state
  const [customerId, setCustomerId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [cash, setCash] = useState(0)
  const [warrantyMonths, setWarrantyMonths] = useState(12)
  const [imei, setImei] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")

  useEffect(function() {
    fetchSales()
    fetchCustomers()
    fetchInventory()
  }, [])

  async function fetchSales() {
    setLoading(true)
    var result = await supabase.from("sales").select("*").order("created_at", { ascending: false })
    if (result.data) setSales(result.data)
    setLoading(false)
  }

  async function fetchCustomers() {
    var result = await supabase.from("customers").select("id, name, phone").order("name")
    if (result.data) setCustomers(result.data)
  }

  async function fetchInventory() {
    var result = await supabase.from("inventory").select("id, name, stock, price").order("name")
    if (result.data) setInventory(result.data)
  }

  function handleCustomerChange(id: string) {
    setCustomerId(id)
    for (var i = 0; i < customers.length; i++) {
      if (customers[i].id === id) {
        setCustomerName(customers[i].name)
        setCustomerPhone(customers[i].phone)
        break
      }
    }
  }

  function handleItemChange(name: string) {
    setItemName(name)
    for (var i = 0; i < inventory.length; i++) {
      if (inventory[i].name === name) {
        setUnitPrice(inventory[i].price)
        break
      }
    }
  }

  function calculateTotal() {
    return quantity * unitPrice
  }

  function calculateRemaining() {
    return calculateTotal() - cash
  }

  function calculateWarrantyEnd() {
    var date = new Date()
    date.setMonth(date.getMonth() + warrantyMonths)
    return date.toISOString().split("T")[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    var total = calculateTotal()
    var remaining = calculateRemaining()
    var warrantyEnd = calculateWarrantyEnd()

    var saleData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      item_name: itemName,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: total,
      cash: cash,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd,
      imei: imei,
      brand: brand,
      model: model,
    }

    if (editSale) {
      await supabase.from("sales").update(saleData).eq("id", editSale.id)
    } else {
      await supabase.from("sales").insert([saleData])
    }

    // Stok düş
    if (!editSale) {
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i].name === itemName) {
          await supabase.from("inventory").update({ stock: inventory[i].stock - quantity }).eq("id", inventory[i].id)
          break
        }
      }
    }

    // Borç kaydet
    if (remaining > 0) {
      await supabase.from("debts").insert([{
        customer_name: customerName,
        customer_phone: customerPhone,
        amount: remaining,
        description: itemName + " satışı borcu",
        status: "unpaid",
      }])
    }

    // Garanti kaydet
    await supabase.from("warranties").insert([{
      customer_name: customerName,
      customer_phone: customerPhone,
      item_name: itemName,
      imei: imei,
      brand: brand,
      model: model,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd,
      status: "active",
    }])

    resetForm()
    setShowForm(false)
    fetchSales()
    fetchInventory()
  }

  function resetForm() {
    setCustomerId("")
    setCustomerName("")
    setCustomerPhone("")
    setItemName("")
    setQuantity(1)
    setUnitPrice(0)
    setCash(0)
    setWarrantyMonths(12)
    setImei("")
    setBrand("")
    setModel("")
    setEditSale(null)
  }

  function handleEdit(sale: Sale) {
    setEditSale(sale)
    setCustomerName(sale.customer_name)
    setCustomerPhone(sale.customer_phone)
    setItemName(sale.item_name)
    setQuantity(sale.quantity)
    setUnitPrice(sale.unit_price)
    setCash(sale.cash)
    setWarrantyMonths(sale.warranty_months)
    setImei(sale.imei || "")
    setBrand(sale.brand || "")
    setModel(sale.model || "")
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await supabase.from("sales").delete().eq("id", id)
    fetchSales()
  }

  function getFilteredSales() {
    if (!search) return sales
    var filtered: Sale[] = []
    var lowerSearch = search.toLowerCase()
    for (var i = 0; i < sales.length; i++) {
      var s = sales[i]
      if (
        (s.customer_name && s.customer_name.toLowerCase().indexOf(lowerSearch) !== -1) ||
        (s.customer_phone && s.customer_phone.indexOf(search) !== -1) ||
        (s.item_name && s.item_name.toLowerCase().indexOf(lowerSearch) !== -1) ||
        (s.imei && s.imei.indexOf(search) !== -1) ||
        (s.brand && s.brand.toLowerCase().indexOf(lowerSearch) !== -1) ||
        (s.model && s.model.toLowerCase().indexOf(lowerSearch) !== -1)
      ) {
        filtered.push(s)
      }
    }
    return filtered
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    var d = new Date(dateStr)
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
  }

  function formatPrice(price: number) {
    return price.toLocaleString("tr-TR") + " TL"
  }

  var filteredSales = getFilteredSales()
  var totalRevenue = 0
  var totalRemaining = 0
  for (var i = 0; i < sales.length; i++) {
    totalRevenue = totalRevenue + sales[i].total_price
    totalRemaining = totalRemaining + sales[i].remaining_amount
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Satış Yönetimi</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={function() { setShowDevices(!showDevices) }}
          >
            {showDevices ? "Satışları Göster" : "Satılan Cihazlar"}
          </button>
          <button
            className="btn btn-primary"
            onClick={function() { resetForm(); setShowForm(true) }}
          >
            + Yeni Satış
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Toplam Satış</h3>
          </div>
          <div className="card-content">
            <p className="text-2xl font-bold">{sales.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Toplam Ciro</h3>
          </div>
          <div className="card-content">
            <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Toplam Borç</h3>
          </div>
          <div className="card-content">
            <p className="text-2xl font-bold text-red-600">{formatPrice(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="mb-4">
        <input
          type="text"
          className="input w-full md:w-96"
          placeholder="Müşteri, ürün, IMEI, marka veya model ara..."
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
        />
      </div>

      {/* Satış Formu */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editSale ? "Satış Düzenle" : "Yeni Satış"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Müşteri Seç</label>
                  <select
                    className="input"
                    value={customerId}
                    onChange={function(e) { handleCustomerChange(e.target.value) }}
                  >
                    <option value="">Yeni Müşteri / Seç</option>
                    {customers.map(function(c) {
                      return <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Müşteri Adı</label>
                  <input
                    type="text"
                    className="input"
                    value={customerName}
                    onChange={function(e) { setCustomerName(e.target.value) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Telefon</label>
                  <input
                    type="text"
                    className="input"
                    value={customerPhone}
                    onChange={function(e) { setCustomerPhone(e.target.value) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Ürün Seç</label>
                  <select
                    className="input"
                    value={itemName}
                    onChange={function(e) { handleItemChange(e.target.value) }}
                  >
                    <option value="">Ürün Seç</option>
                    {inventory.map(function(item) {
                      return <option key={item.id} value={item.name}>{item.name} (Stok: {item.stock})</option>
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Ürün Adı</label>
                  <input
                    type="text"
                    className="input"
                    value={itemName}
                    onChange={function(e) { setItemName(e.target.value) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Adet</label>
                  <input
                    type="number"
                    className="input"
                    value={quantity}
                    min={1}
                    onChange={function(e) { setQuantity(Number(e.target.value)) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Birim Fiyat (TL)</label>
                  <input
                    type="number"
                    className="input"
                    value={unitPrice}
                    min={0}
                    onChange={function(e) { setUnitPrice(Number(e.target.value)) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Peşinat (TL)</label>
                  <input
                    type="number"
                    className="input"
                    value={cash}
                    min={0}
                    onChange={function(e) { setCash(Number(e.target.value)) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Toplam</label>
                  <input
                    type="text"
                    className="input bg-gray-100"
                    value={formatPrice(calculateTotal())}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="label">Kalan Borç</label>
                  <input
                    type="text"
                    className="input bg-gray-100"
                    value={formatPrice(calculateRemaining())}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="label">Garanti (Ay)</label>
                  <input
                    type="number"
                    className="input"
                    value={warrantyMonths}
                    min={0}
                    onChange={function(e) { setWarrantyMonths(Number(e.target.value)) }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Garanti Bitiş</label>
                  <input
                    type="text"
                    className="input bg-gray-100"
                    value={formatDate(calculateWarrantyEnd())}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="label">IMEI</label>
                  <input
                    type="text"
                    className="input"
                    value={imei}
                    onChange={function(e) { setImei(e.target.value) }}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Marka</label>
                  <input
                    type="text"
                    className="input"
                    value={brand}
                    onChange={function(e) { setBrand(e.target.value) }}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Model</label>
                  <input
                    type="text"
                    className="input"
                    value={model}
                    onChange={function(e) { setModel(e.target.value) }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>İptal</button>
                <button type="submit" className="btn btn-primary">{editSale ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Satılan Cihazlar Görünümü */}
      {showDevices ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Satılan Cihazlar</h2>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredSales.length === 0 ? (
            <div className="empty-state">Satılan cihaz bulunamadı.</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Marka</th>
                    <th>Model</th>
                    <th>IMEI</th>
                    <th>Müşteri</th>
                    <th>Telefon</th>
                    <th>Garanti Bitiş</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(function(sale) {
                    var isExpired = false
                    if (sale.warranty_end_date) {
                      isExpired = new Date(sale.warranty_end_date) < new Date()
                    }
                    return (
                      <tr key={sale.id}>
                        <td>{sale.brand || "-"}</td>
                        <td>{sale.model || "-"}</td>
                        <td>{sale.imei || "-"}</td>
                        <td>{sale.customer_name}</td>
                        <td>{sale.customer_phone}</td>
                        <td>{formatDate(sale.warranty_end_date)}</td>
                        <td>
                          <span className={"badge " + (isExpired ? "badge-red" : "badge-green")}>
                            {isExpired ? "Süresi Doldu" : "Aktif"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Satış Listesi */
        <div>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredSales.length === 0 ? (
            <div className="empty-state">Satış bulunamadı.</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Müşteri</th>
                    <th>Telefon</th>
                    <th>Ürün</th>
                    <th>Adet</th>
                    <th>Birim Fiyat</th>
                    <th>Toplam</th>
                    <th>Peşinat</th>
                    <th>Borç</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(function(sale) {
                    return (
                      <tr key={sale.id}>
                        <td>{formatDate(sale.created_at)}</td>
                        <td>{sale.customer_name}</td>
                        <td>{sale.customer_phone}</td>
                        <td>{sale.item_name}</td>
                        <td>{sale.quantity}</td>
                        <td>{formatPrice(sale.unit_price)}</td>
                        <td className="font-bold">{formatPrice(sale.total_price)}</td>
                        <td className="text-green-600">{formatPrice(sale.cash)}</td>
                        <td className={sale.remaining_amount > 0 ? "text-red-600 font-bold" : ""}>
                          {formatPrice(sale.remaining_amount)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(sale) }}>Düzenle</button>
                            <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(sale.id) }}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

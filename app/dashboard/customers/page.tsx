"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

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
  customer_name: string
  customer_phone: string
  amount: number
  paid_amount: number
  status: string
}

export default function CustomersPage() {
  var [customers, setCustomers] = useState<Customer[]>([])
  var [debts, setDebts] = useState<Debt[]>([])
  var [loading, setLoading] = useState(true)
  var [showForm, setShowForm] = useState(false)
  var [search, setSearch] = useState("")
  var [editCustomer, setEditCustomer] = useState<Customer | null>(null)

  // Form state
  var [name, setName] = useState("")
  var [phone, setPhone] = useState("")
  var [email, setEmail] = useState("")
  var [address, setAddress] = useState("")

  useEffect(function() {
    fetchCustomers()
    fetchDebts()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    var result = await supabase.from("customers").select("*").order("name")
    if (result.data) setCustomers(result.data)
    setLoading(false)
  }

  async function fetchDebts() {
    var result = await supabase.from("debts").select("*")
    if (result.data) setDebts(result.data)
  }

  function resetForm() {
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setEditCustomer(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    var data = { name: name, phone: phone, email: email, address: address }
    if (editCustomer) {
      await supabase.from("customers").update(data).eq("id", editCustomer.id)
    } else {
      await supabase.from("customers").insert([data])
    }
    resetForm()
    setShowForm(false)
    fetchCustomers()
  }

  function handleEdit(customer: Customer) {
    setEditCustomer(customer)
    setName(customer.name)
    setPhone(customer.phone || "")
    setEmail(customer.email || "")
    setAddress(customer.address || "")
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await supabase.from("customers").delete().eq("id", id)
    fetchCustomers()
  }

  function getCustomerDebt(phone: string) {
    var total = 0
    for (var i = 0; i < debts.length; i++) {
      if (debts[i].customer_phone === phone && debts[i].status === "unpaid") {
        total = total + debts[i].amount - (debts[i].paid_amount || 0)
      }
    }
    return total
  }

  function getFilteredCustomers() {
    if (!search) return customers
    var filtered: Customer[] = []
    var lowerSearch = search.toLowerCase()
    for (var i = 0; i < customers.length; i++) {
      var c = customers[i]
      if (
        (c.name && c.name.toLowerCase().indexOf(lowerSearch) !== -1) ||
        (c.phone && c.phone.indexOf(search) !== -1) ||
        (c.email && c.email.toLowerCase().indexOf(lowerSearch) !== -1)
      ) {
        filtered.push(c)
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

  function openWhatsApp(phone: string) {
    var clean = phone.replace(/[^0-9]/g, "")
    if (clean.startsWith("0")) clean = "9" + clean
    if (!clean.startsWith("9")) clean = "90" + clean
    window.open("https://wa.me/" + clean, "_blank")
  }

  var filtered = getFilteredCustomers()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Müşteriler</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni Müşteri
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="input w-full md:w-96"
          placeholder="Müşteri ara..."
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editCustomer ? "Müşteri Düzenle" : "Yeni Müşteri"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Ad Soyad *</label>
                  <input type="text" className="input" value={name} onChange={function(e) { setName(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Telefon *</label>
                  <input type="text" className="input" value={phone} onChange={function(e) { setPhone(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">E-posta</label>
                  <input type="email" className="input" value={email} onChange={function(e) { setEmail(e.target.value) }} />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Adres</label>
                  <textarea className="input" rows={2} value={address} onChange={function(e) { setAddress(e.target.value) }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>İptal</button>
                <button type="submit" className="btn btn-primary">{editCustomer ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Müşteri bulunamadı.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Borç</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(customer) {
                var debt = getCustomerDebt(customer.phone)
                return (
                  <tr key={customer.id}>
                    <td className="font-medium">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || "-"}</td>
                    <td>
                      {debt > 0 ? (
                        <span className="badge badge-red">{formatPrice(debt)}</span>
                      ) : (
                        <span className="badge badge-green">Borç Yok</span>
                      )}
                    </td>
                    <td>{formatDate(customer.created_at)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(customer) }}>Düzenle</button>
                        <button className="btn btn-sm btn-success" onClick={function() { openWhatsApp(customer.phone) }}>WhatsApp</button>
                        <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(customer.id) }}>Sil</button>
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
  )
}

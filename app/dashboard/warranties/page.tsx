"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Warranty {
  id: string
  customer_name: string
  customer_phone: string
  item_name: string
  imei: string
  brand: string
  model: string
  warranty_months: number
  warranty_end_date: string
  status: string
  created_at: string
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [editWarranty, setEditWarranty] = useState<Warranty | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [itemName, setItemName] = useState("")
  const [imei, setImei] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [warrantyMonths, setWarrantyMonths] = useState(12)
  const [status, setStatus] = useState("active")

  useEffect(function() {
    fetchWarranties()
  }, [])

  async function fetchWarranties() {
    setLoading(true)
    const result = await supabase.from("warranties").select("*").order("created_at", { ascending: false })
    if (result.data) setWarranties(result.data)
    setLoading(false)
  }

  function resetForm() {
    setCustomerName("")
    setCustomerPhone("")
    setItemName("")
    setImei("")
    setBrand("")
    setModel("")
    setWarrantyMonths(12)
    setStatus("active")
    setEditWarranty(null)
  }

  function calculateWarrantyEnd() {
    const date = new Date()
    date.setMonth(date.getMonth() + warrantyMonths)
    return date.toISOString().split("T")[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      customer_name: customerName,
      customer_phone: customerPhone,
      item_name: itemName,
      imei: imei,
      brand: brand,
      model: model,
      warranty_months: warrantyMonths,
      warranty_end_date: calculateWarrantyEnd(),
      status: status,
    }
    if (editWarranty) {
      await supabase.from("warranties").update(data).eq("id", editWarranty.id)
    } else {
      await supabase.from("warranties").insert([data])
    }
    resetForm()
    setShowForm(false)
    fetchWarranties()
  }

  function handleEdit(w: Warranty) {
    setEditWarranty(w)
    setCustomerName(w.customer_name)
    setCustomerPhone(w.customer_phone)
    setItemName(w.item_name)
    setImei(w.imei || "")
    setBrand(w.brand || "")
    setModel(w.model || "")
    setWarrantyMonths(w.warranty_months)
    setStatus(w.status)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediginize emin misiniz?")) return
    await supabase.from("warranties").delete().eq("id", id)
    fetchWarranties()
  }

  async function handleChangeStatus(id: string, newStatus: string) {
    await supabase.from("warranties").update({ status: newStatus }).eq("id", id)
    fetchWarranties()
  }

  function getFilteredWarranties() {
    const filtered: Warranty[] = []
    for (let i = 0; i < warranties.length; i++) {
      const w = warranties[i]
      if (filterStatus !== "all" && w.status !== filterStatus) continue
      if (search) {
        const lowerSearch = search.toLowerCase()
        let match = false
        if (w.customer_name && w.customer_name.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (w.customer_phone && w.customer_phone.indexOf(search) !== -1) match = true
        if (w.item_name && w.item_name.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (w.imei && w.imei.indexOf(search) !== -1) match = true
        if (w.brand && w.brand.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (w.model && w.model.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (!match) continue
      }
      filtered.push(w)
    }
    return filtered
  }

  function isExpired(w: Warranty) {
    if (!w.warranty_end_date) return false
    return new Date(w.warranty_end_date) < new Date()
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
  }

  const filtered = getFilteredWarranties()
  let activeCount = 0
  let expiredCount = 0
  for (let i = 0; i < warranties.length; i++) {
    if (warranties[i].status === "active" && !isExpired(warranties[i])) activeCount++
    if (isExpired(warranties[i])) expiredCount++
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Garanti Takibi</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni Garanti
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Garanti</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{warranties.length}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Aktif</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-green-600">{activeCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Suresi Dolan</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-red-600">{expiredCount}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" className="input w-full md:w-64" placeholder="Ara" value={search} onChange={function(e) { setSearch(e.target.value) }} />
        <select className="input" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value) }}>
          <option value="all">Tumu</option>
          <option value="active">Aktif</option>
          <option value="expired">Suresi Dolan</option>
          <option value="cancelled">Iptal</option>
        </select>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editWarranty ? "Garanti Duzenle" : "Yeni Garanti"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>X</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Musteri Adi *</label>
                  <input type="text" className="input" value={customerName} onChange={function(e) { setCustomerName(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Telefon *</label>
                  <input type="text" className="input" value={customerPhone} onChange={function(e) { setCustomerPhone(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Urun Adi *</label>
                  <input type="text" className="input" value={itemName} onChange={function(e) { setItemName(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">IMEI</label>
                  <input type="text" className="input" value={imei} onChange={function(e) { setImei(e.target.value) }} />
                </div>
                <div className="form-group">
                  <label className="label">Marka</label>
                  <input type="text" className="input" value={brand} onChange={function(e) { setBrand(e.target.value) }} />
                </div>
                <div className="form-group">
                  <label className="label">Model</label>
                  <input type="text" className="input" value={model} onChange={function(e) { setModel(e.target.value) }} />
                </div>
                <div className="form-group">
                  <label className="label">Garanti Suresi (Ay)</label>
                  <input type="number" className="input" value={warrantyMonths} min={1} onChange={function(e) { setWarrantyMonths(Number(e.target.value)) }} />
                </div>
                <div className="form-group">
                  <label className="label">Garanti Bitis</label>
                  <input type="text" className="input bg-gray-100" value={formatDate(calculateWarrantyEnd())} readOnly />
                </div>
                <div className="form-group">
                  <label className="label">Durum</label>
                  <select className="input" value={status} onChange={function(e) { setStatus(e.target.value) }}>
                    <option value="active">Aktif</option>
                    <option value="expired">Suresi Doldu</option>
                    <option value="cancelled">Iptal</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>Iptal</button>
                <button type="submit" className="btn btn-primary">{editWarranty ? "Guncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Garanti bulunamadi.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Musteri</th>
                <th>Urun</th>
                <th>Marka/Model</th>
                <th>IMEI</th>
                <th>Garanti Suresi</th>
                <th>Bitis Tarihi</th>
                <th>Durum</th>
                <th>Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(w) {
                const expired = isExpired(w)
                return (
                  <tr key={w.id}>
                    <td>{w.customer_name}<br/><small>{w.customer_phone}</small></td>
                    <td>{w.item_name}</td>
                    <td>{w.brand || "-"} {w.model || "-"}</td>
                    <td>{w.imei || "-"}</td>
                    <td>{w.warranty_months} ay</td>
                    <td>{formatDate(w.warranty_end_date)}</td>
                    <td>
                      <span className={"badge " + (expired ? "badge-red" : w.status === "active" ? "badge-green" : "badge-gray")}>
                        {expired ? "Suresi Doldu" : w.status === "active" ? "Aktif" : w.status === "cancelled" ? "Iptal" : w.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(w) }}>Duzenle</button>
                        {w.status === "active" && !expired && (
                          <button className="btn btn-sm btn-warning" onClick={function() { handleChangeStatus(w.id, "expired") }}>Bitir</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(w.id) }}>Sil</button>
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

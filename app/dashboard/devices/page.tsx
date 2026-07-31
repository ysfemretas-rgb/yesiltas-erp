"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Device {
  id: string
  customer_name: string
  customer_phone: string
  brand: string
  model: string
  imei: string
  problem: string
  status: string
  cost: number
  price: number
  notes: string
  created_at: string
  completed_at: string
}

export default function DevicesPage() {
  var [devices, setDevices] = useState<Device[]>([])
  var [loading, setLoading] = useState(true)
  var [showForm, setShowForm] = useState(false)
  var [search, setSearch] = useState("")
  var [editDevice, setEditDevice] = useState<Device | null>(null)
  var [filterStatus, setFilterStatus] = useState("all")

  // Form state
  var [customerName, setCustomerName] = useState("")
  var [customerPhone, setCustomerPhone] = useState("")
  var [brand, setBrand] = useState("")
  var [model, setModel] = useState("")
  var [imei, setImei] = useState("")
  var [problem, setProblem] = useState("")
  var [status, setStatus] = useState("waiting")
  var [cost, setCost] = useState(0)
  var [price, setPrice] = useState(0)
  var [notes, setNotes] = useState("")

  useEffect(function() {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    setLoading(true)
    var result = await supabase.from("devices").select("*").order("created_at", { ascending: false })
    if (result.data) setDevices(result.data)
    setLoading(false)
  }

  function resetForm() {
    setCustomerName("")
    setCustomerPhone("")
    setBrand("")
    setModel("")
    setImei("")
    setProblem("")
    setStatus("waiting")
    setCost(0)
    setPrice(0)
    setNotes("")
    setEditDevice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    var deviceData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      brand: brand,
      model: model,
      imei: imei,
      problem: problem,
      status: status,
      cost: cost,
      price: price,
      notes: notes,
    }
    if (status === "completed" && editDevice && !editDevice.completed_at) {
      (deviceData as any).completed_at = new Date().toISOString()
    }
    if (editDevice) {
      await supabase.from("devices").update(deviceData).eq("id", editDevice.id)
    } else {
      await supabase.from("devices").insert([deviceData])
    }
    resetForm()
    setShowForm(false)
    fetchDevices()
  }

  function handleEdit(device: Device) {
    setEditDevice(device)
    setCustomerName(device.customer_name)
    setCustomerPhone(device.customer_phone)
    setBrand(device.brand || "")
    setModel(device.model || "")
    setImei(device.imei || "")
    setProblem(device.problem || "")
    setStatus(device.status)
    setCost(device.cost || 0)
    setPrice(device.price || 0)
    setNotes(device.notes || "")
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await supabase.from("devices").delete().eq("id", id)
    fetchDevices()
  }

  function getStatusBadgeClass(s: string) {
    if (s === "waiting") return "badge-yellow"
    if (s === "in_progress") return "badge-blue"
    if (s === "completed") return "badge-green"
    if (s === "cancelled") return "badge-red"
    return "badge-gray"
  }

  function getStatusText(s: string) {
    if (s === "waiting") return "Bekliyor"
    if (s === "in_progress") return "Devam Ediyor"
    if (s === "completed") return "Tamamlandı"
    if (s === "cancelled") return "İptal"
    return s
  }

  function getFilteredDevices() {
    var filtered: Device[] = []
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i]
      if (filterStatus !== "all" && d.status !== filterStatus) continue
      if (search) {
        var lowerSearch = search.toLowerCase()
        var match = false
        if (d.customer_name && d.customer_name.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (d.customer_phone && d.customer_phone.indexOf(search) !== -1) match = true
        if (d.brand && d.brand.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (d.model && d.model.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (d.imei && d.imei.indexOf(search) !== -1) match = true
        if (!match) continue
      }
      filtered.push(d)
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

  var filteredDevices = getFilteredDevices()
  var waitingCount = 0
  var inProgressCount = 0
  var completedCount = 0
  var totalRevenue = 0
  for (var i = 0; i < devices.length; i++) {
    if (devices[i].status === "waiting") waitingCount++
    if (devices[i].status === "in_progress") inProgressCount++
    if (devices[i].status === "completed") completedCount++
    totalRevenue = totalRevenue + devices[i].price
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teknik Servis</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni Cihaz
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Bekleyen</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-yellow-600">{waitingCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Devam Eden</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-blue-600">{inProgressCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Tamamlanan</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-green-600">{completedCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Gelir</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p></div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="input w-full md:w-64"
          placeholder="Ara..."
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
        />
        <select className="input" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value) }}>
          <option value="all">Tümü</option>
          <option value="waiting">Bekliyor</option>
          <option value="in_progress">Devam Ediyor</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editDevice ? "Cihaz Düzenle" : "Yeni Cihaz"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Müşteri Adı</label>
                  <input type="text" className="input" value={customerName} onChange={function(e) { setCustomerName(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Telefon</label>
                  <input type="text" className="input" value={customerPhone} onChange={function(e) { setCustomerPhone(e.target.value) }} required />
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
                  <label className="label">IMEI</label>
                  <input type="text" className="input" value={imei} onChange={function(e) { setImei(e.target.value) }} />
                </div>
                <div className="form-group">
                  <label className="label">Durum</label>
                  <select className="input" value={status} onChange={function(e) { setStatus(e.target.value) }}>
                    <option value="waiting">Bekliyor</option>
                    <option value="in_progress">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Maliyet (TL)</label>
                  <input type="number" className="input" value={cost} min={0} onChange={function(e) { setCost(Number(e.target.value)) }} />
                </div>
                <div className="form-group">
                  <label className="label">Fiyat (TL)</label>
                  <input type="number" className="input" value={price} min={0} onChange={function(e) { setPrice(Number(e.target.value)) }} />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Arıza</label>
                  <textarea className="input" rows={3} value={problem} onChange={function(e) { setProblem(e.target.value) }} />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Notlar</label>
                  <textarea className="input" rows={2} value={notes} onChange={function(e) { setNotes(e.target.value) }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>İptal</button>
                <button type="submit" className="btn btn-primary">{editDevice ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="spinner"></div>
      ) : filteredDevices.length === 0 ? (
        <div className="empty-state">Cihaz bulunamadı.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Müşteri</th>
                <th>Marka/Model</th>
                <th>IMEI</th>
                <th>Arıza</th>
                <th>Durum</th>
                <th>Fiyat</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(function(device) {
                return (
                  <tr key={device.id}>
                    <td>{formatDate(device.created_at)}</td>
                    <td>{device.customer_name}<br/><small>{device.customer_phone}</small></td>
                    <td>{device.brand} {device.model}</td>
                    <td>{device.imei || "-"}</td>
                    <td>{device.problem || "-"}</td>
                    <td><span className={"badge " + getStatusBadgeClass(device.status)}>{getStatusText(device.status)}</span></td>
                    <td>{formatPrice(device.price)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(device) }}>Düzenle</button>
                        <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(device.id) }}>Sil</button>
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

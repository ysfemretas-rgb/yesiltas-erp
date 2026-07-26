'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Device {
  id: string
  customer_id: string
  brand: string
  model: string
  imei: string
  complaint: string
  diagnosis: string
  status: string
  estimated_cost: number
  final_cost: number
  paid_amount: number
  payment_status: string
  received_date: string
  started_date: string
  completed_date: string
  delivered_date: string
  technician: string
  notes: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface DeviceHistory {
  id: string
  imei: string
  customer_name: string
  brand: string
  model: string
  complaint: string
  diagnosis: string
  final_cost: number
  status: string
  service_date: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filtered, setFiltered] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [deviceHistory, setDeviceHistory] = useState<DeviceHistory[]>([])

  const [form, setForm] = useState({
    customer_id: '', brand: '', model: '', imei: '', complaint: '', diagnosis: '',
    status: 'Beklemede', estimated_cost: '', final_cost: '', paid_amount: '',
    payment_status: 'beklemede', technician: '', notes: ''
  })
  const [quickCustomer, setQuickCustomer] = useState({ name: '', phone: '', email: '', address: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = devices
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(d =>
        d.brand.toLowerCase().includes(term) ||
        d.model.toLowerCase().includes(term) ||
        d.imei?.includes(term) ||
        d.complaint.toLowerCase().includes(term)
      )
    }
    if (statusFilter) result = result.filter(d => d.status === statusFilter)
    setFiltered(result)
  }, [search, statusFilter, devices])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [devicesRes, customersRes] = await Promise.all([
      supabase.from('devices').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name')
    ])
    if (devicesRes.data) setDevices(devicesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    setLoading(false)
  }

  const openModal = (device?: Device) => {
    if (device) {
      setForm({
        customer_id: device.customer_id || '', brand: device.brand, model: device.model,
        imei: device.imei || '', complaint: device.complaint, diagnosis: device.diagnosis || '',
        status: device.status, estimated_cost: device.estimated_cost?.toString() || '',
        final_cost: device.final_cost?.toString() || '', paid_amount: device.paid_amount?.toString() || '',
        payment_status: device.payment_status || 'beklemede', technician: device.technician || '', notes: device.notes || ''
      })
      setEditingId(device.id)
    } else {
      setForm({
        customer_id: '', brand: '', model: '', imei: '', complaint: '', diagnosis: '',
        status: 'Beklemede', estimated_cost: '', final_cost: '', paid_amount: '',
        payment_status: 'beklemede', technician: '', notes: ''
      })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickCustomer.name || !quickCustomer.phone) {
      showToast('Ad ve telefon zorunlu', 'error')
      return
    }
    const { data, error } = await supabase.from('customers').insert([quickCustomer]).select()
    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }
    if (data && data[0]) {
      setCustomers([...customers, { id: data[0].id, name: data[0].name, phone: data[0].phone }])
      setForm({ ...form, customer_id: data[0].id })
      setShowQuickCustomer(false)
      setQuickCustomer({ name: '', phone: '', email: '', address: '' })
      showToast('Musteri kaydedildi ve secildi')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    const payload: any = {
      customer_id: form.customer_id || null,
      brand: form.brand,
      model: form.model,
      imei: form.imei || null,
      complaint: form.complaint,
      diagnosis: form.diagnosis || null,
      status: form.status,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      final_cost: parseFloat(form.final_cost) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
      payment_status: form.payment_status,
      technician: form.technician || null,
      notes: form.notes || null
    }

    // Date tracking
    if (form.status === 'Tamiri Basladi' && !editingId) payload.started_date = now
    if (form.status === 'Tamamlandi' && !editingId) payload.completed_date = now
    if (form.status === 'Teslim Edildi') {
      payload.delivered_date = now
      // Auto cash register entry
      const finalCost = parseFloat(form.final_cost) || 0
      const paidAmount = parseFloat(form.paid_amount) || 0
      if (finalCost > 0 && paidAmount >= finalCost) {
        await supabase.from('transactions').insert([{
          type: 'gelir',
          category: 'Teknik Servis',
          amount: finalCost,
          description: `${form.brand} ${form.model} - Teslim edildi`,
          related_id: editingId,
          related_table: 'devices'
        }])
        payload.payment_status = 'tamamlandi'
      }
      // Add to device history
      if (form.imei) {
        const customer = customers.find(c => c.id === form.customer_id)
        await supabase.from('device_history').insert([{
          imei: form.imei,
          device_id: editingId,
          customer_name: customer?.name || '',
          brand: form.brand,
          model: form.model,
          complaint: form.complaint,
          diagnosis: form.diagnosis || '',
          final_cost: finalCost,
          status: 'Tamamlandi'
        }])
      }
    }

    if (editingId) {
      await supabase.from('devices').update(payload).eq('id', editingId)
      showToast('Cihaz guncellendi')
    } else {
      await supabase.from('devices').insert([payload])
      showToast('Cihaz eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu cihazi silmek istediginize emin misiniz?')) return
    await supabase.from('devices').delete().eq('id', id)
    showToast('Cihaz silindi')
    loadData()
  }

  const loadDeviceHistory = async (imei: string) => {
    if (!imei) return
    const { data } = await supabase.from('device_history').select('*').eq('imei', imei).order('service_date', { ascending: false })
    setDeviceHistory(data || [])
    setShowHistory(imei)
  }

  const statusColors: Record<string, string> = {
    'Beklemede': 'badge-yellow',
    'Tamiri Basladi': 'badge-blue',
    'Parca Bekleniyor': 'badge-purple',
    'Tamamlandi': 'badge-green',
    'Teslim Edildi': 'badge-green',
    'Iptal Edildi': 'badge-red'
  }

  const paymentColors: Record<string, string> = {
    'beklemede': 'badge-yellow',
    'kismi': 'badge-blue',
    'tamamlandi': 'badge-green',
    'ucretsiz': 'badge-gray'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Teknik Servis</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Cihaz</button>
      </div>

      <div className="flex gap-2">
        <input type="text" className="input flex-1" placeholder="Ara (marka, model, IMEI, sikayet)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tum Durumlar</option>
          <option>Beklemede</option>
          <option>Tamiri Basladi</option>
          <option>Parca Bekleniyor</option>
          <option>Tamamlandi</option>
          <option>Teslim Edildi</option>
          <option>Iptal Edildi</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Marka/Model</th>
              <th>IMEI</th>
              <th>Sikayet</th>
              <th>Durum</th>
              <th>Ucret</th>
              <th>Odeme</th>
              <th>Teknisyen</th>
              <th>Tarihler</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((device) => {
              const customer = customers.find(c => c.id === device.customer_id)
              const remaining = (device.final_cost || 0) - (device.paid_amount || 0)
              return (
                <tr key={device.id}>
                  <td>
                    <div className="font-medium text-white">{device.brand} {device.model}</div>
                    <div className="text-xs text-slate-500">{customer?.name || 'Bilinmiyor'}</div>
                  </td>
                  <td>
                    {device.imei ? (
                      <button onClick={() => loadDeviceHistory(device.imei)} className="text-emerald-400 hover:underline text-sm">
                        {device.imei}
                      </button>
                    ) : '-'}
                  </td>
                  <td className="text-slate-300 max-w-xs truncate">{device.complaint}</td>
                  <td><span className={`badge ${statusColors[device.status] || 'badge-gray'}`}>{device.status}</span></td>
                  <td className="text-slate-300">
                    <div>{device.final_cost?.toLocaleString('tr-TR')} TL</div>
                    {device.estimated_cost > 0 && <div className="text-xs text-slate-500">Tahmin: {device.estimated_cost?.toLocaleString('tr-TR')} TL</div>}
                  </td>
                  <td>
                    <span className={`badge ${paymentColors[device.payment_status] || 'badge-gray'}`}>
                      {device.payment_status === 'beklemede' ? 'Beklemede' :
                       device.payment_status === 'kismi' ? `Kismi (Kalan: ${remaining.toLocaleString('tr-TR')} TL)` :
                       device.payment_status === 'tamamlandi' ? 'Tamamlandi' : 'Ucretsiz'}
                    </span>
                  </td>
                  <td className="text-slate-300">{device.technician || '-'}</td>
                  <td className="text-xs text-slate-400">
                    <div>Alindi: {device.received_date ? new Date(device.received_date).toLocaleDateString('tr-TR') : '-'}</div>
                    {device.started_date && <div>Basladi: {new Date(device.started_date).toLocaleDateString('tr-TR')}</div>}
                    {device.completed_date && <div>Tamamlandi: {new Date(device.completed_date).toLocaleDateString('tr-TR')}</div>}
                    {device.delivered_date && <div>Teslim: {new Date(device.delivered_date).toLocaleDateString('tr-TR')}</div>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(device)} className="btn btn-secondary btn-sm">Duzenle</button>
                      <button onClick={() => handleDelete(device.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henuz cihaz kaydi yok</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Cihaz Duzenle' : 'Yeni Cihaz'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri *</label>
                  <div className="flex gap-2">
                    <select className="select flex-1" value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})} required>
                      <option value="">Musteri secin...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowQuickCustomer(true)} className="btn btn-secondary btn-sm whitespace-nowrap">Yeni Musteri</button>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Marka *</label>
                    <input className="input" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Model *</label>
                    <input className="input" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>IMEI</label>
                  <input className="input" value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} placeholder="353456789012345" />
                </div>
                <div className="form-group">
                  <label>Sikayet *</label>
                  <textarea className="input" rows={2} value={form.complaint} onChange={(e) => setForm({...form, complaint: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Teshis</label>
                  <textarea className="input" rows={2} value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Durum</label>
                    <select className="select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option>Beklemede</option>
                      <option>Tamiri Basladi</option>
                      <option>Parca Bekleniyor</option>
                      <option>Tamamlandi</option>
                      <option>Teslim Edildi</option>
                      <option>Iptal Edildi</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Teknisyen</label>
                    <input className="input" value={form.technician} onChange={(e) => setForm({...form, technician: e.target.value})} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Tahmini Ucret</label>
                    <input className="input" type="number" value={form.estimated_cost} onChange={(e) => setForm({...form, estimated_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Gercek Ucret</label>
                    <input className="input" type="number" value={form.final_cost} onChange={(e) => setForm({...form, final_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Odenen</label>
                    <input className="input" type="number" value={form.paid_amount} onChange={(e) => setForm({...form, paid_amount: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Odeme Durumu</label>
                  <select className="select" value={form.payment_status} onChange={(e) => setForm({...form, payment_status: e.target.value})}>
                    <option value="beklemede">Beklemede</option>
                    <option value="kismi">Kismi Odeme</option>
                    <option value="tamamlandi">Tamamlandi</option>
                    <option value="ucretsiz">Ucretsiz</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Customer Modal */}
      {showQuickCustomer && (
        <div className="modal-overlay" onClick={() => setShowQuickCustomer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Hizli Musteri Ekle</h2>
              <button onClick={() => setShowQuickCustomer(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleQuickCustomer}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ad Soyad *</label>
                  <input className="input" value={quickCustomer.name} onChange={(e) => setQuickCustomer({...quickCustomer, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Telefon *</label>
                  <input className="input" value={quickCustomer.phone} onChange={(e) => setQuickCustomer({...quickCustomer, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input className="input" type="email" value={quickCustomer.email} onChange={(e) => setQuickCustomer({...quickCustomer, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <textarea className="input" rows={2} value={quickCustomer.address} onChange={(e) => setQuickCustomer({...quickCustomer, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowQuickCustomer(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Musteriyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Cihaz Gecmisi - IMEI: {showHistory}</h2>
              <button onClick={() => setShowHistory(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body">
              {deviceHistory.length > 0 ? (
                <table className="table text-sm">
                  <thead><tr><th>Tarih</th><th>Musteri</th><th>Sikayet</th><th>Teshis</th><th>Ucret</th><th>Durum</th></tr></thead>
                  <tbody>
                    {deviceHistory.map(h => (
                      <tr key={h.id}>
                        <td>{new Date(h.service_date).toLocaleDateString('tr-TR')}</td>
                        <td>{h.customer_name}</td>
                        <td>{h.complaint}</td>
                        <td>{h.diagnosis || '-'}</td>
                        <td>{h.final_cost?.toLocaleString('tr-TR')} TL</td>
                        <td><span className="badge badge-green">{h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-slate-500">Bu IMEI ile daha once servis kaydi bulunmuyor.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function InlineToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
    }`}>
      <div className="flex items-center gap-2">
        <span>{type === 'success' ? '✅' : '❌'}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">&times;</button>
      </div>
    </div>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [form, setForm] = useState({
    customer_id: '', customer_name: '', customer_phone: '', device_type: 'Telefon',
    brand: '', model: '', serial_number: '', problem: '', status: 'Beklemede',
    estimated_cost: '', actual_cost: '', payment_status: 'Ödenmedi', notes: ''
  })

  const [editForm, setEditForm] = useState({
    id: '', customer_name: '', customer_phone: '', device_type: 'Telefon',
    brand: '', model: '', serial_number: '', problem: '', status: 'Beklemede',
    estimated_cost: '', actual_cost: '', payment_status: 'Ödenmedi', notes: ''
  })

  const [paymentForm, setPaymentForm] = useState({ device_id: '', amount: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: devicesData }, { data: customersData }] = await Promise.all([
      supabase.from('devices').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name')
    ])
    if (devicesData) setDevices(devicesData)
    if (customersData) setCustomers(customersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const estimated = parseFloat(form.estimated_cost) || 0
      const actual = parseFloat(form.actual_cost) || 0

      const { error } = await supabase.from('devices').insert([{
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

      if (error) throw error
      setToast({ message: 'Cihaz başarıyla eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({
        customer_id: '', customer_name: '', customer_phone: '', device_type: 'Telefon',
        brand: '', model: '', serial_number: '', problem: '', status: 'Beklemede',
        estimated_cost: '', actual_cost: '', payment_status: 'Ödenmedi', notes: ''
      })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (device: any) => {
    setEditForm({
      id: device.id,
      customer_name: device.customer_name || '',
      customer_phone: device.customer_phone || '',
      device_type: device.device_type || 'Telefon',
      brand: device.brand || '',
      model: device.model || '',
      serial_number: device.serial_number || '',
      problem: device.problem || '',
      status: device.status || 'Beklemede',
      estimated_cost: device.estimated_cost?.toString() || '',
      actual_cost: device.actual_cost?.toString() || '',
      payment_status: device.payment_status || 'Ödenmedi',
      notes: device.notes || ''
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const estimated = parseFloat(editForm.estimated_cost) || 0
      const actual = parseFloat(editForm.actual_cost) || 0

      const { error } = await supabase.from('devices').update({
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
      }).eq('id', editForm.id)

      if (error) throw error
      setToast({ message: 'Cihaz güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu cihazı silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('devices').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'Cihaz silindi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openPaymentModal = (device: any) => {
    setPaymentForm({ device_id: device.id, amount: device.actual_cost?.toString() || '' })
    setShowPaymentModal(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const amount = parseFloat(paymentForm.amount) || 0
      if (amount <= 0) {
        setToast({ message: 'Geçerli bir tutar girin', type: 'error' })
        return
      }

      const device = devices.find(d => d.id === paymentForm.device_id)
      if (!device) return

      const { error: transError } = await supabase.from('transactions').insert([{
        type: 'income',
        category: 'Teknik Servis',
        amount: amount,
        description: `${device.customer_name} - ${device.device_type} ${device.brand} ${device.model}`,
        date: new Date().toISOString().split('T')[0]
      }])

      if (transError) throw transError

      const { error: updateError } = await supabase.from('devices').update({
        payment_status: 'Ödendi'
      }).eq('id', paymentForm.device_id)

      if (updateError) throw updateError

      setToast({ message: 'Ödeme alındı ve kasaya kaydedildi!', type: 'success' })
      setShowPaymentModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setForm(prev => ({ ...prev, customer_id: customerId, customer_name: customer.name, customer_phone: customer.phone || '' }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return 'badge-green'
      case 'Beklemede': return 'badge-yellow'
      case 'İşlemde': return 'badge-blue'
      case 'İptal': return 'badge-red'
      default: return 'badge-gray'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Ödendi': return 'badge-green'
      case 'Kısmi': return 'badge-yellow'
      case 'Ödenmedi': return 'badge-red'
      default: return 'badge-gray'
    }
  }

  const filtered = devices.filter(d =>
    d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.device_type?.toLowerCase().includes(search.toLowerCase()) ||
    d.brand?.toLowerCase().includes(search.toLowerCase()) ||
    d.model?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading && devices.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Teknik Servis</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni Cihaz</button>
      </div>

      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Müşteri</th><th>Cihaz</th><th>Marka/Model</th><th>Sorun</th>
              <th>Durum</th><th>Maliyet</th><th>Ödeme</th><th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((device) => (
              <tr key={device.id}>
                <td>
                  <div className="font-medium">{device.customer_name}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{device.customer_phone}</div>
                </td>
                <td>{device.device_type}</td>
                <td>{device.brand} {device.model}</td>
                <td>{device.problem}</td>
                <td><span className={`badge ${getStatusColor(device.status)}`}>{device.status}</span></td>
                <td>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Tah: ₺{device.estimated_cost?.toLocaleString('tr-TR')}</div>
                  <div className="text-sm font-medium">Ger: ₺{device.actual_cost?.toLocaleString('tr-TR')}</div>
                </td>
                <td><span className={`badge ${getPaymentStatusColor(device.payment_status)}`}>{device.payment_status}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(device)} className="btn btn-sm btn-secondary">Düzenle</button>
                    {device.payment_status !== 'Ödendi' && device.status === 'Tamamlandı' && (
                      <button onClick={() => openPaymentModal(device)} className="btn btn-sm btn-primary">Ödeme Al</button>
                    )}
                    <button onClick={() => handleDelete(device.id)} className="btn btn-sm btn-danger">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Cihaz bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Cihaz Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Müşteri Seç</label>
                    <select className="input" value={form.customer_id} onChange={(e) => handleCustomerSelect(e.target.value)}>
                      <option value="">Seçin</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Müşteri Adı</label>
                    <input className="input" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input className="input" value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Cihaz Türü</label>
                    <select className="input" value={form.device_type} onChange={(e) => setForm({...form, device_type: e.target.value})}>
                      <option value="Telefon">Telefon</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Bilgisayar">Bilgisayar</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marka</label>
                    <input className="input" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <input className="input" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Seri No</label>
                    <input className="input" value={form.serial_number} onChange={(e) => setForm({...form, serial_number: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Tahmini Maliyet</label>
                    <input className="input" type="number" value={form.estimated_cost} onChange={(e) => setForm({...form, estimated_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Gerçek Maliyet</label>
                    <input className="input" type="number" value={form.actual_cost} onChange={(e) => setForm({...form, actual_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Durum</label>
                    <select className="input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="Beklemede">Beklemede</option>
                      <option value="İşlemde">İşlemde</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                      <option value="İptal">İptal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ödeme Durumu</label>
                    <select className="input" value={form.payment_status} onChange={(e) => setForm({...form, payment_status: e.target.value})}>
                      <option value="Ödenmedi">Ödenmedi</option>
                      <option value="Kısmi">Kısmi</option>
                      <option value="Ödendi">Ödendi</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Sorun</label>
                  <input className="input" value={form.problem} onChange={(e) => setForm({...form, problem: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cihaz Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Müşteri Adı</label>
                    <input className="input" value={editForm.customer_name} onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input className="input" value={editForm.customer_phone} onChange={(e) => setEditForm({...editForm, customer_phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Cihaz Türü</label>
                    <select className="input" value={editForm.device_type} onChange={(e) => setEditForm({...editForm, device_type: e.target.value})}>
                      <option value="Telefon">Telefon</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Bilgisayar">Bilgisayar</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marka</label>
                    <input className="input" value={editForm.brand} onChange={(e) => setEditForm({...editForm, brand: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <input className="input" value={editForm.model} onChange={(e) => setEditForm({...editForm, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Seri No</label>
                    <input className="input" value={editForm.serial_number} onChange={(e) => setEditForm({...editForm, serial_number: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Tahmini Maliyet</label>
                    <input className="input" type="number" value={editForm.estimated_cost} onChange={(e) => setEditForm({...editForm, estimated_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Gerçek Maliyet</label>
                    <input className="input" type="number" value={editForm.actual_cost} onChange={(e) => setEditForm({...editForm, actual_cost: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Durum</label>
                    <select className="input" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                      <option value="Beklemede">Beklemede</option>
                      <option value="İşlemde">İşlemde</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                      <option value="İptal">İptal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ödeme Durumu</label>
                    <select className="input" value={editForm.payment_status} onChange={(e) => setEditForm({...editForm, payment_status: e.target.value})}>
                      <option value="Ödenmedi">Ödenmedi</option>
                      <option value="Kısmi">Kısmi</option>
                      <option value="Ödendi">Ödendi</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Sorun</label>
                  <input className="input" value={editForm.problem} onChange={(e) => setEditForm({...editForm, problem: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea className="input" rows={2} value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ödeme Al</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ödeme Tutarı</label>
                  <input className="input" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Ödeme Al</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

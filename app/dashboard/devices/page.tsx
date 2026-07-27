'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Inline Toast Component
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


function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const intlPhone = cleanPhone.startsWith('0') ? '9' + cleanPhone : cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tümü')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [form, setForm] = useState({ customer_id: '', device_name: '', imei: '', issue: '', price: '', status: 'Beklemede', technician: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: devicesData }, { data: customersData }] = await Promise.all([
      supabase.from('devices').select('*, customers:customer_id(name, phone)').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name')
    ])
    if (devicesData) setDevices(devicesData)
    if (customersData) setCustomers(customersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('devices').insert([{
      customer_id: form.customer_id,
      device_name: form.device_name.trim(),
      imei: form.imei.trim() || null,
      issue: form.issue.trim(),
      price: parseFloat(form.price) || 0,
      status: form.status,
      technician: form.technician.trim() || null
    }])
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Cihaz kaydı eklendi!', type: 'success' })
      setShowModal(false)
      setForm({ customer_id: '', device_name: '', imei: '', issue: '', price: '', status: 'Beklemede', technician: '' })
      loadData()
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('devices').update({ status }).eq('id', id)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Durum güncellendi!', type: 'success' })
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('device_history').delete().eq('device_id', id)
    await supabase.from('devices').delete().eq('id', id)
    setToast({ message: 'Cihaz silindi!', type: 'success' })
    loadData()
  }

  const sendWhatsAppReady = (device: any) => {
    const phone = device.customers?.phone
    if (!phone) {
      setToast({ message: 'HATA: Müşteri telefon numarası bulunamadı!', type: 'error' })
      return
    }
    const message = `Merhaba ${device.customers?.name || 'Sayın Müşterimiz'},\n\n${device.device_name} cihazınızın tamir işlemi tamamlanmıştır. Cihazınızı servisimizden teslim alabilirsiniz.\n\nÜcret: ₺${(device.price || 0).toLocaleString('tr-TR')}\nSorun: ${device.issue}\n\nYeşiltaş Teknoloji`
    window.open(getWhatsAppLink(phone, message), '_blank')
  }

  const filtered = devices.filter(d => {
    const matchesSearch = d.device_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.imei?.includes(search)
    const matchesStatus = statusFilter === 'Tümü' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions = ['Tümü', 'Beklemede', 'İşlemde', 'Tamamlandı', 'Teslim Edildi', 'İptal']

  if (loading && devices.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Teknik Servis</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Cihaz</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-md" placeholder="Ara (cihaz, müşteri, IMEI)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Müşteri</th><th>Cihaz</th><th>IMEI</th><th>Sorun</th><th>Ücret</th><th>Teknisyen</th><th>Durum</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(d.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.customers?.name || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{d.device_name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{d.imei || '-'}</td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: '200px' }} className="truncate">{d.issue}</td>
                <td className="text-emerald-400">₺{(d.price || 0).toLocaleString('tr-TR')}</td>
                <td style={{ color: 'var(--text-muted)' }}>{d.technician || '-'}</td>
                <td>
                  <select className="select text-xs py-1" value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)}>
                    <option>Beklemede</option><option>İşlemde</option><option>Tamamlandı</option><option>Teslim Edildi</option><option>İptal</option>
                  </select>
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {d.status === 'Tamamlandı' && d.customers?.phone && (
                      <button onClick={() => sendWhatsAppReady(d)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="WhatsApp'tan bildirim gönder">
                        📱 WhatsApp
                      </button>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="btn btn-danger btn-sm">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Cihaz bulunamadı</p></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Cihaz Kaydı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri *</label>
                  <select className="select" value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})} required>
                    <option value="">Seçin</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Cihaz Adı *</label><input className="input" value={form.device_name} onChange={(e) => setForm({...form, device_name: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} /></div>
                <div className="form-group"><label>Sorun *</label><textarea className="input" rows={2} value={form.issue} onChange={(e) => setForm({...form, issue: e.target.value})} required /></div>
                <div className="form-group"><label>Ücret (TL)</label><input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} /></div>
                <div className="form-group"><label>Teknisyen</label><input className="input" value={form.technician} onChange={(e) => setForm({...form, technician: e.target.value})} /></div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option>Beklemede</option><option>İşlemde</option><option>Tamamlandı</option><option>Teslim Edildi</option><option>İptal</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

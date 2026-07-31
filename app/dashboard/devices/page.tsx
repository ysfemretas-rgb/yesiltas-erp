'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function InlineToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    var timer = setTimeout(onClose, 4000)
    return function() { clearTimeout(timer) }
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
  var cleanPhone = phone.replace(/\D/g, '')
  var intlPhone = cleanPhone
  if (cleanPhone.startsWith('0')) {
    intlPhone = '9' + cleanPhone
  } else if (!cleanPhone.startsWith('90')) {
    intlPhone = '90' + cleanPhone
  }
  return 'https://wa.me/' + intlPhone + '?text=' + encodeURIComponent(message)
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tumu')
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
    try {
      var { error } = await supabase.from('devices').insert([{
        customer_id: form.customer_id,
        device_name: form.device_name.trim(),
        imei: form.imei.trim() || null,
        issue: form.issue.trim(),
        price: parseFloat(form.price) || 0,
        status: form.status,
        technician: form.technician.trim() || null
      }])
      if (error) {
        console.error('Ekleme hatasi:', error)
        setToast({ message: 'Hata: ' + error.message + ' (Kod: ' + error.code + ')', type: 'error' })
      } else {
        setToast({ message: 'Cihaz kaydi eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ customer_id: '', device_name: '', imei: '', issue: '', price: '', status: 'Beklemede', technician: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: 'Hata: ' + err.message, type: 'error' })
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      console.log('Durum guncelleniyor:', id, '->', newStatus)
      var { data, error } = await supabase
        .from('devices')
        .update({ status: newStatus })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Durum guncelleme hatasi:', error)
        if (error.message && error.message.indexOf('check constraint') !== -1 || error.code === '23514') {
          setToast({ 
            message: "HATA: '" + newStatus + "' durumu veritabaninda izin verilmiyor. Lutfen Supabase SQL Editor'da constraint'i kaldirin: ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;", 
            type: 'error' 
          })
        } else {
          setToast({ message: 'Hata: ' + error.message + ' (Kod: ' + error.code + ')', type: 'error' })
        }
      } else {
        console.log('Durum guncellendi:', data)
        setToast({ message: 'Durum guncellendi!', type: 'success' })
        loadData()
      }
    } catch (err: any) {
      console.error('Beklenmedik hata:', err)
      setToast({ message: 'Hata: ' + err.message, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('device_history').delete().eq('device_id', id)
    await supabase.from('devices').delete().eq('id', id)
    setToast({ message: 'Cihaz silindi!', type: 'success' })
    loadData()
  }

  const sendWhatsAppReady = (device: any) => {
    var phone = device.customers ? device.customers.phone : ''
    if (!phone) {
      setToast({ message: 'HATA: Musteri telefon numarasi bulunamadi!', type: 'error' })
      return
    }
    var message = 'Merhaba ' + (device.customers ? device.customers.name : 'Sayin Musterimiz') + ',\n\n' +
      device.device_name + ' cihazinizin tamir islemi tamamlanmistir. Cihazinizi servisimizden teslim alabilirsiniz.\n\n' +
      'Ucret: &#8378;' + (device.price || 0).toLocaleString('tr-TR') + '\nSorun: ' + device.issue + '\n\nYeşiltaş Teknoloji'
    window.open(getWhatsAppLink(phone, message), '_blank')
  }

  var filtered: any[] = []
  for (var i = 0; i < devices.length; i++) {
    var d = devices[i]
    var matchesSearch = false
    if (!search) {
      matchesSearch = true
    } else {
      var term = search.toLowerCase()
      if (d.device_name && d.device_name.toLowerCase().indexOf(term) !== -1) matchesSearch = true
      if (d.customers && d.customers.name && d.customers.name.toLowerCase().indexOf(term) !== -1) matchesSearch = true
      if (d.imei && d.imei.indexOf(search) !== -1) matchesSearch = true
    }
    var matchesStatus = statusFilter === 'Tumu' || d.status === statusFilter
    if (matchesSearch && matchesStatus) filtered.push(d)
  }

  var statusOptions = ['Tumu', 'Beklemede', 'Islemde', 'Tamamlandi', 'Teslim Edildi', 'Iptal']

  if (loading && devices.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Teknik Servis</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Cihaz</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-md" placeholder="Ara (cihaz, musteri, IMEI)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map(function(s) { return <option key={s}>{s}</option> })}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Musteri</th><th>Cihaz</th><th>IMEI</th><th>Sorun</th><th>Ucret</th><th>Teknisyen</th><th>Durum</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td className="text-slate-400 text-sm whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString('tr-TR') : '-'}</td>
                <td className="font-medium text-white">{d.customers ? d.customers.name : '-'}</td>
                <td className="text-slate-300">{d.device_name}</td>
                <td className="text-slate-400 text-sm">{d.imei || '-'}</td>
                <td className="text-slate-300 truncate" style={{maxWidth: '200px'}}>{d.issue}</td>
                <td className="text-emerald-400">&#8378;{(d.price || 0).toLocaleString('tr-TR')}</td>
                <td className="text-slate-400">{d.technician || '-'}</td>
                <td>
                  <select className="select text-xs py-1" value={d.status || 'Beklemede'} onChange={(e) => updateStatus(d.id, e.target.value)}>
                    <option>Beklemede</option><option>Islemde</option><option>Tamamlandi</option><option>Teslim Edildi</option><option>Iptal</option>
                  </select>
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {d.status === 'Tamamlandi' && d.customers && d.customers.phone && (
                      <button onClick={() => sendWhatsAppReady(d)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        WhatsApp
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
      {filtered.length === 0 && <div className="empty-state"><p>Cihaz bulunamadi</p></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Cihaz Kaydi</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri *</label>
                  <select className="select" value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})} required>
                    <option value="">Secin</option>
                    {customers.map(function(c) { return <option key={c.id} value={c.id}>{c.name} {c.phone ? '(' + c.phone + ')' : ''}</option> })}
                  </select>
                </div>
                <div className="form-group"><label>Cihaz Adi *</label><input className="input" value={form.device_name} onChange={(e) => setForm({...form, device_name: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} /></div>
                <div className="form-group"><label>Sorun *</label><textarea className="input" rows={2} value={form.issue} onChange={(e) => setForm({...form, issue: e.target.value})} required /></div>
                <div className="form-group"><label>Ucret (TL)</label><input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} /></div>
                <div className="form-group"><label>Teknisyen</label><input className="input" value={form.technician} onChange={(e) => setForm({...form, technician: e.target.value})} /></div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option>Beklemede</option><option>Islemde</option><option>Tamamlandi</option><option>Teslim Edildi</option><option>Iptal</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
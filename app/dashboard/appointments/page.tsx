'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Appointment {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  service_type: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string
  created_at: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filtered, setFiltered] = useState<Appointment[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', service_type: '',
    appointment_date: '', appointment_time: '', status: 'Beklemede', notes: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    var result = appointments
    if (search) {
      result = result.filter(function(a) {
        return a.customer_name && a.customer_name.toLowerCase().indexOf(search.toLowerCase()) !== -1
      })
    }
    if (dateFilter) {
      result = result.filter(function(a) { return a.appointment_date === dateFilter })
    }
    setFiltered(result)
  }, [search, dateFilter, appointments])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(function() { setToast(null) }, 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true })
    if (data) { setAppointments(data); setFiltered(data) }
    setLoading(false)
  }

  const openModal = (appt?: Appointment) => {
    if (appt) {
      setForm({
        customer_name: appt.customer_name || '', customer_phone: appt.customer_phone || '',
        service_type: appt.service_type || '', appointment_date: appt.appointment_date || '',
        appointment_time: appt.appointment_time || '', status: appt.status, notes: appt.notes || ''
      })
      setEditingId(appt.id)
    } else {
      setForm({ customer_name: '', customer_phone: '', service_type: '', appointment_date: '', appointment_time: '', status: 'Beklemede', notes: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('appointments').update(form).eq('id', editingId)
      showToast('Randevu guncellendi')
    } else {
      await supabase.from('appointments').insert([form])
      showToast('Randevu eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('appointments').delete().eq('id', id)
    showToast('Silindi')
    loadData()
  }

  const isToday = (date: string) => date === new Date().toISOString().split('T')[0]

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
        <h1 className="text-2xl font-bold text-white">Randevular</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Randevu</button>
      </div>

      <div className="flex gap-2">
        <input type="text" className="input flex-1" placeholder="Musteri ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" className="input w-40" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Musteri</th><th>Servis</th><th>Tarih</th><th>Saat</th><th>Durum</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className={isToday(a.appointment_date) ? 'bg-emerald-500/5' : ''}>
                <td>
                  <div className="font-medium text-white">{a.customer_name}</div>
                  <div className="text-xs text-slate-500">{a.customer_phone}</div>
                </td>
                <td className="text-slate-300">{a.service_type}</td>
                <td className="text-slate-300">
                  {new Date(a.appointment_date).toLocaleDateString('tr-TR')}
                  {isToday(a.appointment_date) && <span className="badge badge-green ml-2">Bugun</span>}
                </td>
                <td className="text-slate-300">{a.appointment_time}</td>
                <td>
                  <span className={`badge ${a.status === 'Tamamlandi' ? 'badge-green' : a.status === 'Iptal Edildi' ? 'badge-red' : a.status === 'Onaylandi' ? 'badge-blue' : 'badge-yellow'}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(a)} className="btn btn-secondary btn-sm">Duzenle</button>
                    <button onClick={() => handleDelete(a.id)} className="btn btn-danger btn-sm">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <div className="empty-state"><p>Henuz randevu kaydi yok</p></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Randevu Duzenle' : 'Yeni Randevu'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Musteri Adi *</label><input className="input" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon</label><input className="input" value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})} /></div>
                <div className="form-group"><label>Servis Turu *</label><input className="input" value={form.service_type} onChange={(e) => setForm({...form, service_type: e.target.value})} required placeholder="Orn: Ekran Degisimi" /></div>
                <div className="grid-2">
                  <div className="form-group"><label>Tarih *</label><input className="input" type="date" value={form.appointment_date} onChange={(e) => setForm({...form, appointment_date: e.target.value})} required /></div>
                  <div className="form-group"><label>Saat</label><input className="input" type="time" value={form.appointment_time} onChange={(e) => setForm({...form, appointment_time: e.target.value})} /></div>
                </div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option>Beklemede</option><option>Onaylandi</option><option>Tamamlandi</option><option>Iptal Edildi</option>
                  </select>
                </div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
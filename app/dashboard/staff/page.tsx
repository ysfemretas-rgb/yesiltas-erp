'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
}

interface Performance {
  id: string
  staff_name: string
  device_count: number
  total_revenue: number
  period_month: string
  period_year: number
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [performance, setPerformance] = useState<Performance[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'performance'>('list')

  const [form, setForm] = useState({ name: '', role: 'Teknisyen', phone: '', email: '' })

  useEffect(() => { loadData() }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [staffRes, perfRes] = await Promise.all([
      supabase.from('staff').select('*').order('created_at', { ascending: false }),
      supabase.from('staff_performance').select('*').order('created_at', { ascending: false })
    ])
    if (staffRes.data) setStaff(staffRes.data)
    if (perfRes.data) setPerformance(perfRes.data)
    setLoading(false)
  }

  const openModal = (member?: StaffMember) => {
    if (member) {
      setForm({ name: member.name, role: member.role, phone: member.phone || '', email: member.email || '' })
      setEditingId(member.id)
    } else {
      setForm({ name: '', role: 'Teknisyen', phone: '', email: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('staff').update(form).eq('id', editingId)
      showToast('Personel guncellendi')
    } else {
      await supabase.from('staff').insert([form])
      showToast('Personel eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('staff').delete().eq('id', id)
    showToast('Silindi')
    loadData()
  }

  const calculatePerformance = async (staffId: string, staffName: string) => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const { data: devices } = await supabase.from('devices').select('final_cost').eq('technician', staffName).eq('status', 'Teslim Edildi')
    const deviceCount = devices?.length || 0
    const totalRevenue = devices?.reduce((s, d) => s + (d.final_cost || 0), 0) || 0

    await supabase.from('staff_performance').insert([{
      staff_id: staffId,
      staff_name: staffName,
      device_count: deviceCount,
      total_revenue: totalRevenue,
      period_month: month,
      period_year: year
    }])
    showToast('Performans hesaplandi')
    loadData()
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
        <h1 className="text-2xl font-bold text-white">Personel</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Personel</button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>Personel Listesi</button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performans</button>
      </div>

      {activeTab === 'list' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Rol</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Durum</th>
                <th>Islemler</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-white">{s.name}</td>
                  <td><span className="badge badge-blue">{s.role}</span></td>
                  <td className="text-slate-300">{s.phone || '-'}</td>
                  <td className="text-slate-300">{s.email || '-'}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'Aktif' : 'Pasif'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => calculatePerformance(s.id, s.name)} className="btn btn-primary btn-sm">Hesapla</button>
                      <button onClick={() => openModal(s)} className="btn btn-secondary btn-sm">Duzenle</button>
                      <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Donem</th>
                <th>Tamir Edilen</th>
                <th>Toplam Ciro</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-white">{p.staff_name}</td>
                  <td className="text-slate-300">{p.period_month}/{p.period_year}</td>
                  <td className="text-emerald-400">{p.device_count} cihaz</td>
                  <td className="text-emerald-400 font-medium">{p.total_revenue?.toLocaleString('tr-TR')} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
          {performance.length === 0 && <div className="empty-state"><p>Henuz performans kaydi yok. Personel listesinden "Hesapla" butonuna basin.</p></div>}
        </div>
      )}

      {staff.length === 0 && activeTab === 'list' && (
        <div className="empty-state">
          <p>Henuz personel kaydi yok</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Personel Duzenle' : 'Yeni Personel'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ad Soyad *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select className="select" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                    <option>Teknisyen</option>
                    <option>Satisci</option>
                    <option>Admin</option>
                    <option>Muhasebe</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
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
    </div>
  )
}

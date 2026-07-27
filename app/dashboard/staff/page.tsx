'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/Toast'

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'performance'>('list')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPerfModal, setShowPerfModal] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', role: 'Teknisyen', salary: '' })
  const [perfForm, setPerfForm] = useState({ staff_id: '', period: '', devices_repaired: '', total_revenue: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: staffData }, { data: perfData }] = await Promise.all([
      supabase.from('staff').select('*').order('name'),
      supabase.from('staff_performance').select('*, staff:staff_id(name)').order('period', { ascending: false })
    ])
    if (staffData) setStaff(staffData)
    if (perfData) setPerformance(perfData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('staff').insert([{
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      role: form.role,
      salary: parseFloat(form.salary) || 0
    }])
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Personel eklendi!', type: 'success' })
      setShowModal(false)
      setForm({ name: '', phone: '', role: 'Teknisyen', salary: '' })
      loadData()
    }
  }

  const handlePerfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('staff_performance').insert([{
      staff_id: perfForm.staff_id,
      period: perfForm.period,
      devices_repaired: parseInt(perfForm.devices_repaired) || 0,
      total_revenue: parseFloat(perfForm.total_revenue) || 0
    }])
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Performans kaydı eklendi!', type: 'success' })
      setShowPerfModal(false)
      setPerfForm({ staff_id: '', period: '', devices_repaired: '', total_revenue: '' })
      loadData()
    }
  }

  // ===== PERFORMANS SİLME =====
  const handleDeletePerformance = async (id: string) => {
    if (!confirm('Bu performans kaydını silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase.from('staff_performance').delete().eq('id', id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Performans kaydı silindi!', type: 'success' })
        setPerformance(prev => prev.filter(p => p.id !== id))
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz? Bağlı performans kayıtları da silinecektir.')) return

    try {
      // Önce bağlı performans kayıtlarını sil
      await supabase.from('staff_performance').delete().eq('staff_id', id)
      // Sonra personeli sil
      const { error } = await supabase.from('staff').delete().eq('id', id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Personel silindi!', type: 'success' })
        setStaff(prev => prev.filter(s => s.id !== id))
        setPerformance(prev => prev.filter(p => p.staff_id !== id))
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  if (loading && staff.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Personel</h1>
        <div className="flex gap-2">
          {activeTab === 'performance' && (
            <button onClick={() => setShowPerfModal(true)} className="btn btn-primary">+ Performans Ekle</button>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Personel</button>
        </div>
      </div>

      {/* Tablar */}
      <div className="flex gap-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-1 font-medium ${activeTab === 'list' ? 'text-emerald-400 border-b-2 border-emerald-400' : ''}`}
          style={{ color: activeTab === 'list' ? undefined : 'var(--text-muted)' }}
        >
          Personel Listesi
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={`pb-2 px-1 font-medium ${activeTab === 'performance' ? 'text-emerald-400 border-b-2 border-emerald-400' : ''}`}
          style={{ color: activeTab === 'performance' ? undefined : 'var(--text-muted)' }}
        >
          Performans
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Ad</th><th>Rol</th><th>Telefon</th><th>Maaş</th><th>İşlemler</th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.role}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.phone || '-'}</td>
                  <td className="text-emerald-400">₺{(s.salary || 0).toLocaleString('tr-TR')}</td>
                  <td>
                    <button onClick={() => handleDeleteStaff(s.id)} className="btn btn-danger btn-sm">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staff.length === 0 && <div className="empty-state"><p>Henüz personel kaydı yok</p></div>}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Dönem</th>
                <th>Tamir Edilen</th>
                <th>Toplam Ciro</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.staff?.name || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.period}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.devices_repaired} cihaz</td>
                  <td className="text-emerald-400">₺{(p.total_revenue || 0).toLocaleString('tr-TR')} TL</td>
                  <td>
                    <button onClick={() => handleDeletePerformance(p.id)} className="btn btn-danger btn-sm">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {performance.length === 0 && <div className="empty-state"><p>Henüz performans kaydı yok</p></div>}
        </div>
      )}

      {/* Personel Ekle Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Personel</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label>Rol</label><select className="select" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}><option>Teknisyen</option><option>Satış</option><option>Yönetici</option></select></div>
                <div className="form-group"><label>Maaş (TL)</label><input className="input" type="number" value={form.salary} onChange={(e) => setForm({...form, salary: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performans Ekle Modal */}
      {showPerfModal && (
        <div className="modal-overlay" onClick={() => setShowPerfModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Performans Ekle</h2>
              <button onClick={() => setShowPerfModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePerfSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Personel *</label>
                  <select className="select" value={perfForm.staff_id} onChange={(e) => setPerfForm({...perfForm, staff_id: e.target.value})} required>
                    <option value="">Seçin</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Dönem (AA/YYYY) *</label><input className="input" value={perfForm.period} onChange={(e) => setPerfForm({...perfForm, period: e.target.value})} placeholder="07/2026" required /></div>
                <div className="form-group"><label>Tamir Edilen Cihaz</label><input className="input" type="number" value={perfForm.devices_repaired} onChange={(e) => setPerfForm({...perfForm, devices_repaired: e.target.value})} /></div>
                <div className="form-group"><label>Toplam Ciro (TL)</label><input className="input" type="number" step="0.01" value={perfForm.total_revenue} onChange={(e) => setPerfForm({...perfForm, total_revenue: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPerfModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

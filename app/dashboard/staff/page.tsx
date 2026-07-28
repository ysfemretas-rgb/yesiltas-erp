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

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'performance'>('list')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPerfModal, setShowPerfModal] = useState(false)
  const [showBulkPerfModal, setShowBulkPerfModal] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', role: 'Teknisyen', salary: '' })
  const [editForm, setEditForm] = useState({ id: '', name: '', phone: '', role: 'Teknisyen', salary: '' })
  const [perfForm, setPerfForm] = useState({ staff_id: '', period: '', devices_repaired: '', total_revenue: '' })
  const [bulkPerfForm, setBulkPerfForm] = useState({ period: '', devices_repaired: '', total_revenue: '' })

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('staff').update({
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || null,
      role: editForm.role,
      salary: parseFloat(editForm.salary) || 0
    }).eq('id', editForm.id)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Personel güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    }
  }

  const openEditModal = (s: any) => {
    setEditForm({ id: s.id, name: s.name, phone: s.phone || '', role: s.role, salary: s.salary?.toString() || '' })
    setShowEditModal(true)
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

  // Toplu performans ekleme
  const handleBulkPerfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (staff.length === 0) {
      setToast({ message: 'Personel listesi boş!', type: 'error' })
      return
    }
    const records = staff.map(s => ({
      staff_id: s.id,
      period: bulkPerfForm.period,
      devices_repaired: parseInt(bulkPerfForm.devices_repaired) || 0,
      total_revenue: parseFloat(bulkPerfForm.total_revenue) || 0
    }))
    const { error } = await supabase.from('staff_performance').insert(records)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: `${staff.length} personel için performans kaydı eklendi!`, type: 'success' })
      setShowBulkPerfModal(false)
      setBulkPerfForm({ period: '', devices_repaired: '', total_revenue: '' })
      loadData()
    }
  }

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
      await supabase.from('staff_performance').delete().eq('staff_id', id)
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

  // CSV Export (Excel açar)
  const exportCSV = () => {
    if (performance.length === 0) {
      setToast({ message: 'Export edilecek veri yok!', type: 'error' })
      return
    }
    const headers = ['Personel', 'Dönem', 'Tamir Edilen Cihaz', 'Toplam Ciro (TL)']
    const rows = performance.map(p => [
      p.staff?.name || '-',
      p.period,
      p.devices_repaired,
      p.total_revenue || 0
    ])
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `personel-performans-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setToast({ message: 'CSV dosyası indirildi!', type: 'success' })
  }

  // PDF Export (Tarayıcı print ile)
  const exportPDF = () => {
    if (performance.length === 0) {
      setToast({ message: 'Export edilecek veri yok!', type: 'error' })
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `
      <html>
        <head>
          <title>Personel Performans Raporu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #0f172a; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Yeşiltaş Teknoloji - Personel Performans Raporu</h1>
          <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
          <table>
            <thead>
              <tr>
                <th>Personel</th>
                <th>Dönem</th>
                <th>Tamir Edilen Cihaz</th>
                <th>Toplam Ciro (TL)</th>
              </tr>
            </thead>
            <tbody>
              ${performance.map(p => `
                <tr>
                  <td>${p.staff?.name || '-'}</td>
                  <td>${p.period}</td>
                  <td>${p.devices_repaired}</td>
                  <td>₺${(p.total_revenue || 0).toLocaleString('tr-TR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Yeşiltaş Teknoloji ERP Sistemi</div>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setToast({ message: 'PDF yazdırma penceresi açıldı!', type: 'success' })
  }

  if (loading && staff.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Personel</h1>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'performance' && (
            <>
              <button onClick={exportCSV} className="btn btn-sm" style={{ backgroundColor: '#217346', color: 'white', border: 'none' }} title="Excel (CSV) olarak indir">📊 Excel</button>
              <button onClick={exportPDF} className="btn btn-sm" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }} title="PDF olarak yazdır">📄 PDF</button>
              <button onClick={() => setShowBulkPerfModal(true)} className="btn btn-primary">📋 Toplu Performans</button>
              <button onClick={() => setShowPerfModal(true)} className="btn btn-primary">+ Performans Ekle</button>
            </>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Personel</button>
        </div>
      </div>

      <div className="flex gap-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-1 font-medium ${activeTab === 'list' ? 'text-emerald-400 border-b-2 border-emerald-400' : ''}`}
          style={{ color: activeTab === 'list' ? undefined : 'var(--text-muted)' }}
        >Personel Listesi</button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={`pb-2 px-1 font-medium ${activeTab === 'performance' ? 'text-emerald-400 border-b-2 border-emerald-400' : ''}`}
          style={{ color: activeTab === 'performance' ? undefined : 'var(--text-muted)' }}
        >Performans</button>
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
                    <button onClick={() => openEditModal(s)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', marginRight: '6px' }}>✏️ Düzenle</button>
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
            <thead><tr><th>Personel</th><th>Dönem</th><th>Tamir Edilen</th><th>Toplam Ciro</th><th>İşlemler</th></tr></thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.staff?.name || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.period}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.devices_repaired} cihaz</td>
                  <td className="text-emerald-400">₺{(p.total_revenue || 0).toLocaleString('tr-TR')} TL</td>
                  <td><button onClick={() => handleDeletePerformance(p.id)} className="btn btn-danger btn-sm">Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {performance.length === 0 && <div className="empty-state"><p>Henüz performans kaydı yok</p></div>}
        </div>
      )}

      {/* Yeni Personel Modal */}
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

      {/* Personel Düzenle Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Personel Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon</label><input className="input" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                <div className="form-group"><label>Rol</label><select className="select" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}><option>Teknisyen</option><option>Satış</option><option>Yönetici</option></select></div>
                <div className="form-group"><label>Maaş (TL)</label><input className="input" type="number" value={editForm.salary} onChange={(e) => setEditForm({...editForm, salary: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tekil Performans Ekle Modal */}
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

      {/* Toplu Performans Ekle Modal */}
      {showBulkPerfModal && (
        <div className="modal-overlay" onClick={() => setShowBulkPerfModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>📋 Toplu Performans Ekle</h2>
              <button onClick={() => setShowBulkPerfModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleBulkPerfSubmit}>
              <div className="modal-body space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Eklenecek Personel Sayısı</div>
                  <div className="text-xl font-bold text-emerald-400">{staff.length} kişi</div>
                </div>
                <div className="form-group"><label>Dönem (AA/YYYY) *</label><input className="input" value={bulkPerfForm.period} onChange={(e) => setBulkPerfForm({...bulkPerfForm, period: e.target.value})} placeholder="07/2026" required /></div>
                <div className="form-group"><label>Tamir Edilen Cihaz (Herkes için aynı)</label><input className="input" type="number" value={bulkPerfForm.devices_repaired} onChange={(e) => setBulkPerfForm({...bulkPerfForm, devices_repaired: e.target.value})} /></div>
                <div className="form-group"><label>Toplam Ciro - TL (Herkes için aynı)</label><input className="input" type="number" step="0.01" value={bulkPerfForm.total_revenue} onChange={(e) => setBulkPerfForm({...bulkPerfForm, total_revenue: e.target.value})} /></div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bu işlem tüm personel için aynı dönem ve değerlerle performans kaydı oluşturur.</p>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBulkPerfModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Tümüne Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
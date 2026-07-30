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

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tümü')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState({ müşteri_kimliği: '', ürün_adı: '', garanti_ayları: '12', garanti_bitiş_tarihi: '' })
  const [editForm, setEditForm] = useState({ id: '', müşteri_kimliği: '', ürün_adı: '', garanti_ayları: '12', garanti_bitiş_tarihi: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = warranties
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(w => w.ürün_adı?.toLowerCase().includes(term) || w.müşteri_adı?.toLowerCase().includes(term))
    }
    if (statusFilter !== 'Tümü') {
      const now = new Date()
      result = result.filter(w => {
        const isActive = w.garanti_bitiş_tarihi ? new Date(w.garanti_bitiş_tarihi) > now : false
        return statusFilter === 'Aktif' ? isActive : !isActive
      })
    }
    setFiltered(result)
  }, [search, statusFilter, warranties])

  const loadData = async () => {
    setLoading(true)
    const [warrantyRes, customerRes] = await Promise.all([
      supabase.from('warranties').select('*').order('oluşturulma_tarihi', { ascending: false }),
      supabase.from('customers').select('id, ad').order('ad')
    ])
    if (warrantyRes.data) setWarranties(warrantyRes.data)
    if (customerRes.data) setCustomers(customerRes.data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const months = parseInt(form.garanti_ayları) || 12
      const endDate = form.garanti_bitiş_tarihi || new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { error } = await supabase.from('warranties').insert([{
        müşteri_kimliği: form.müşteri_kimliği || null,
        müşteri_adı: customers.find(c => c.id === form.müşteri_kimliği)?.ad || '',
        ürün_adı: form.ürün_adı.trim(),
        garanti_ayları: months,
        garanti_bitiş_tarihi: endDate
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Garanti kaydı eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ müşteri_kimliği: '', ürün_adı: '', garanti_ayları: '12', garanti_bitiş_tarihi: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (w: any) => {
    setEditForm({
      id: w.id,
      müşteri_kimliği: w.müşteri_kimliği || '',
      ürün_adı: w.ürün_adı || '',
      garanti_ayları: w.garanti_ayları?.toString() || '12',
      garanti_bitiş_tarihi: w.garanti_bitiş_tarihi || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('warranties').update({
        müşteri_kimliği: editForm.müşteri_kimliği || null,
        müşteri_adı: customers.find(c => c.id === editForm.müşteri_kimliği)?.ad || '',
        ürün_adı: editForm.ürün_adı.trim(),
        garanti_ayları: parseInt(editForm.garanti_ayları) || 12,
        garanti_bitiş_tarihi: editForm.garanti_bitiş_tarihi
      }).eq('id', editForm.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Garanti kaydı güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu garanti kaydını silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('warranties').delete().eq('id', id)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Garanti kaydı silindi!', type: 'success' })
      loadData()
    }
  }

  const isActive = (endDate: string) => endDate ? new Date(endDate) > new Date() : false
  const daysLeft = (endDate: string) => {
    if (!endDate) return 0
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const expiringSoon = warranties.filter(w => {
    const days = daysLeft(w.garanti_bitiş_tarihi)
    return days > 0 && days <= 30
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Garantiler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Garanti</button>
      </div>

      {expiringSoon.length > 0 && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <div className="text-sm font-medium text-yellow-400">⚠️ Süresi Dolmak Üzere</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {expiringSoon.map(w => `${w.ürün_adı} (${daysLeft(w.garanti_bitiş_tarihi)} gün)`).join(', ')}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-md" placeholder="Ara (ürün, müşteri)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>Tümü</option>
          <option value="Aktif">Aktif</option>
          <option value="Sona Erdi">Sona Erdi</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Müşteri</th><th>Ürün</th><th>Garanti Süresi</th><th>Bitiş Tarihi</th><th>Durum</th><th>Kalan Süre</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const active = isActive(w.garanti_bitiş_tarihi)
              const days = daysLeft(w.garanti_bitiş_tarihi)
              return (
                <tr key={w.id}>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(w.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{w.müşteri_adı || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{w.ürün_adı}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{w.garanti_ayları} ay</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(w.garanti_bitiş_tarihi).toLocaleDateString('tr-TR')}</td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Aktif' : 'Sona Erdi'}</span></td>
                  <td className={days < 30 && active ? 'text-red-400' : ''} style={{ color: days >= 30 || !active ? 'var(--text-secondary)' : undefined }}>
                    {active ? `${days} gün` : 'Sona erdi'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(w)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      <button onClick={() => handleDelete(w.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Garanti kaydı bulunamadı</p></div>}

      {/* Yeni Garanti Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Garanti Kaydı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri</label>
                  <select className="select" value={form.müşteri_kimliği} onChange={(e) => setForm({...form, müşteri_kimliği: e.target.value})}>
                    <option value="">Seçin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={form.ürün_adı} onChange={(e) => setForm({...form, ürün_adı: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Garanti Süresi (Ay)</label><input className="input" type="number" min="1" value={form.garanti_ayları} onChange={(e) => setForm({...form, garanti_ayları: e.target.value})} /></div>
                  <div className="form-group"><label>Bitiş Tarihi</label><input className="input" type="date" value={form.garanti_bitiş_tarihi} onChange={(e) => setForm({...form, garanti_bitiş_tarihi: e.target.value})} /></div>
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

      {/* Düzenle Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Garanti Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri</label>
                  <select className="select" value={editForm.müşteri_kimliği} onChange={(e) => setEditForm({...editForm, müşteri_kimliği: e.target.value})}>
                    <option value="">Seçin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={editForm.ürün_adı} onChange={(e) => setEditForm({...editForm, ürün_adı: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Garanti Süresi (Ay)</label><input className="input" type="number" min="1" value={editForm.garanti_ayları} onChange={(e) => setEditForm({...editForm, garanti_ayları: e.target.value})} /></div>
                  <div className="form-group"><label>Bitiş Tarihi</label><input className="input" type="date" value={editForm.garanti_bitiş_tarihi} onChange={(e) => setEditForm({...editForm, garanti_bitiş_tarihi: e.target.value})} /></div>
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
    </div>
  )
}

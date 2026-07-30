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

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tümü')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [form, setForm] = useState({ ad: '', kategori: 'Cihaz', miktar: '', maliyet_fiyatı: '', satış_fiyatı: '', açıklama: '' })
  const [editForm, setEditForm] = useState({ id: '', ad: '', kategori: 'Cihaz', miktar: '', maliyet_fiyatı: '', satış_fiyatı: '', açıklama: '' })

  const categories = ['Cihaz', 'Aksesuar', 'Parça', 'Diğer']

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = items
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(i => i.ad?.toLowerCase().includes(term) || i.açıklama?.toLowerCase().includes(term))
    }
    if (categoryFilter !== 'Tümü') {
      result = result.filter(i => i.kategori === categoryFilter)
    }
    setFiltered(result)
  }, [search, categoryFilter, items])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('ad')
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('inventory').insert([{
        ad: form.ad.trim(),
        kategori: form.kategori,
        miktar: parseInt(form.miktar) || 0,
        maliyet_fiyatı: parseFloat(form.maliyet_fiyatı) || 0,
        satış_fiyatı: parseFloat(form.satış_fiyatı) || 0,
        açıklama: form.açıklama.trim() || null
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Stok kaydı eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ ad: '', kategori: 'Cihaz', miktar: '', maliyet_fiyatı: '', satış_fiyatı: '', açıklama: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (i: any) => {
    setEditForm({
      id: i.id,
      ad: i.ad || '',
      kategori: i.kategori || 'Cihaz',
      miktar: i.miktar?.toString() || '',
      maliyet_fiyatı: i.maliyet_fiyatı?.toString() || '',
      satış_fiyatı: i.satış_fiyatı?.toString() || '',
      açıklama: i.açıklama || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('inventory').update({
        ad: editForm.ad.trim(),
        kategori: editForm.kategori,
        miktar: parseInt(editForm.miktar) || 0,
        maliyet_fiyatı: parseFloat(editForm.maliyet_fiyatı) || 0,
        satış_fiyatı: parseFloat(editForm.satış_fiyatı) || 0,
        açıklama: editForm.açıklama.trim() || null
      }).eq('id', editForm.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Stok kaydı güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu stok kaydını silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Stok kaydı silindi!', type: 'success' })
      loadData()
    }
  }

  const lowStockItems = items.filter(i => (i.miktar || 0) <= 5)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Stok</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Stok</button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <div className="text-sm font-medium text-yellow-400">⚠️ Düşük Stok Uyarısı</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {lowStockItems.map(i => i.ad).join(', ')} - Stokları azaldı!
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option>Tümü</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Ürün</th><th>Kategori</th><th>Miktar</th><th>Maliyet</th><th>Satış Fiyatı</th><th>Kar</th><th>Açıklama</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const profit = (i.satış_fiyatı || 0) - (i.maliyet_fiyatı || 0)
              const isLow = (i.miktar || 0) <= 5
              return (
                <tr key={i.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{i.ad}</td>
                  <td><span className="badge badge-blue">{i.kategori}</span></td>
                  <td className={isLow ? 'text-red-400 font-bold' : ''} style={{ color: isLow ? undefined : 'var(--text-secondary)' }}>{i.miktar}</td>
                  <td style={{ color: 'var(--text-muted)' }}>₺{i.maliyet_fiyatı?.toLocaleString('tr-TR')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{i.satış_fiyatı?.toLocaleString('tr-TR')}</td>
                  <td className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>₺{profit.toLocaleString('tr-TR')}</td>
                  <td style={{ color: 'var(--text-muted)' }} className="max-w-xs truncate">{i.açıklama || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(i)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      <button onClick={() => handleDelete(i.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Stok kaydı bulunamadı</p></div>}

      {/* Yeni Stok Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Stok Kaydı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={form.ad} onChange={(e) => setForm({...form, ad: e.target.value})} required /></div>
                <div className="form-group">
                  <label>Kategori</label>
                  <select className="select" value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" min="0" value={form.miktar} onChange={(e) => setForm({...form, miktar: e.target.value})} /></div>
                  <div className="form-group"><label>Maliyet</label><input className="input" type="number" step="0.01" value={form.maliyet_fiyatı} onChange={(e) => setForm({...form, maliyet_fiyatı: e.target.value})} /></div>
                  <div className="form-group"><label>Satış F.</label><input className="input" type="number" step="0.01" value={form.satış_fiyatı} onChange={(e) => setForm({...form, satış_fiyatı: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Açıklama</label><textarea className="input" rows={2} value={form.açıklama} onChange={(e) => setForm({...form, açıklama: e.target.value})} /></div>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Stok Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={editForm.ad} onChange={(e) => setEditForm({...editForm, ad: e.target.value})} required /></div>
                <div className="form-group">
                  <label>Kategori</label>
                  <select className="select" value={editForm.kategori} onChange={(e) => setEditForm({...editForm, kategori: e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" min="0" value={editForm.miktar} onChange={(e) => setEditForm({...editForm, miktar: e.target.value})} /></div>
                  <div className="form-group"><label>Maliyet</label><input className="input" type="number" step="0.01" value={editForm.maliyet_fiyatı} onChange={(e) => setEditForm({...editForm, maliyet_fiyatı: e.target.value})} /></div>
                  <div className="form-group"><label>Satış F.</label><input className="input" type="number" step="0.01" value={editForm.satış_fiyatı} onChange={(e) => setEditForm({...editForm, satış_fiyatı: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Açıklama</label><textarea className="input" rows={2} value={editForm.açıklama} onChange={(e) => setEditForm({...editForm, açıklama: e.target.value})} /></div>
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

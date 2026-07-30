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

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tümü')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [form, setForm] = useState({ tip: 'gelir', kategori: 'Satış', miktar: '', Tanım: '' })
  const [editForm, setEditForm] = useState({ id: '', tip: 'gelir', kategori: 'Satış', miktar: '', Tanım: '' })

  const categories = ['Satış', 'Teknik Servis', 'Taksit Ödemesi', 'Borç Ödemesi', 'Kira', 'Maaş', 'Fatura', 'Diğer']

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = transactions
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(t => t.Tanım?.toLowerCase().includes(term) || t.kategori?.toLowerCase().includes(term))
    }
    if (typeFilter !== 'Tümü') {
      result = result.filter(t => t.tip === typeFilter)
    }
    if (dateFrom) {
      result = result.filter(t => new Date(t.oluşturulma_tarihi) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(t => new Date(t.oluşturulma_tarihi) <= new Date(dateTo + 'T23:59:59'))
    }
    setFiltered(result)
  }, [search, typeFilter, dateFrom, dateTo, transactions])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('oluşturulma_tarihi', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('transactions').insert([{
        tip: form.tip,
        kategori: form.kategori,
        miktar: parseFloat(form.miktar) || 0,
        Tanım: form.Tanım.trim()
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Kasa kaydı eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ tip: 'gelir', kategori: 'Satış', miktar: '', Tanım: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (t: any) => {
    setEditForm({
      id: t.id,
      tip: t.tip || 'gelir',
      kategori: t.kategori || 'Satış',
      miktar: t.miktar?.toString() || '',
      Tanım: t.Tanım || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('transactions').update({
        tip: editForm.tip,
        kategori: editForm.kategori,
        miktar: parseFloat(editForm.miktar) || 0,
        Tanım: editForm.Tanım.trim()
      }).eq('id', editForm.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Kasa kaydı güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      setToast({ message: `Hata: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Kayıt silindi!', type: 'success' })
      loadData()
    }
  }

  const totalIncome = filtered.filter(t => t.tip === 'gelir').reduce((sum, t) => sum + (t.miktar || 0), 0)
  const totalExpense = filtered.filter(t => t.tip === 'gider').reduce((sum, t) => sum + (t.miktar || 0), 0)
  const balance = totalIncome - totalExpense

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kasa</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Kayıt</button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div className="text-sm" style={{ color: '#4ade80' }}>Toplam Gelir</div>
          <div className="text-2xl font-bold text-emerald-400">₺{totalIncome.toLocaleString('tr-TR')}</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-sm" style={{ color: '#f87171' }}>Toplam Gider</div>
          <div className="text-2xl font-bold text-red-400">₺{totalExpense.toLocaleString('tr-TR')}</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div className="text-sm" style={{ color: '#60a5fa' }}>Bakiye</div>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>₺{balance.toLocaleString('tr-TR')}</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-xs" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>Tümü</option>
          <option value="gelir">Gelir</option>
          <option value="gider">Gider</option>
        </select>
        <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Tip</th><th>Kategori</th><th>Miktar</th><th>Açıklama</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(t.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</td>
                <td><span className={`badge ${t.tip === 'gelir' ? 'badge-green' : 'badge-red'}`}>{t.tip === 'gelir' ? 'Gelir' : 'Gider'}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.kategori}</td>
                <td className={`font-bold ${t.tip === 'gelir' ? 'text-emerald-400' : 'text-red-400'}`}>₺{t.miktar?.toLocaleString('tr-TR')}</td>
                <td style={{ color: 'var(--text-secondary)' }} className="max-w-xs truncate">{t.Tanım}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(t)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Kayıt bulunamadı</p></div>}

      {/* Yeni Kayıt Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Kasa Kaydı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tip</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tip" checked={form.tip === 'gelir'} onChange={() => setForm({...form, tip: 'gelir'})} />
                      <span>Gelir</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tip" checked={form.tip === 'gider'} onChange={() => setForm({...form, tip: 'gider'})} />
                      <span>Gider</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <select className="select" value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Miktar (TL) *</label><input className="input" type="number" step="0.01" value={form.miktar} onChange={(e) => setForm({...form, miktar: e.target.value})} required /></div>
                <div className="form-group"><label>Açıklama</label><textarea className="input" rows={2} value={form.Tanım} onChange={(e) => setForm({...form, Tanım: e.target.value})} /></div>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kasa Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tip</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="editTip" checked={editForm.tip === 'gelir'} onChange={() => setEditForm({...editForm, tip: 'gelir'})} />
                      <span>Gelir</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="editTip" checked={editForm.tip === 'gider'} onChange={() => setEditForm({...editForm, tip: 'gider'})} />
                      <span>Gider</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <select className="select" value={editForm.kategori} onChange={(e) => setEditForm({...editForm, kategori: e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Miktar (TL) *</label><input className="input" type="number" step="0.01" value={editForm.miktar} onChange={(e) => setEditForm({...editForm, miktar: e.target.value})} required /></div>
                <div className="form-group"><label>Açıklama</label><textarea className="input" rows={2} value={editForm.Tanım} onChange={(e) => setEditForm({...editForm, Tanım: e.target.value})} /></div>
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

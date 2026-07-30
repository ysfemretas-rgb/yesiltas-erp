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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [form, setForm] = useState({
    type: 'income', category: 'Satış', amount: '', description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [editForm, setEditForm] = useState({
    id: '', type: 'income', category: '', amount: '', description: '', date: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const amount = parseFloat(form.amount) || 0
      const { error } = await supabase.from('transactions').insert([{
        type: form.type, category: form.category, amount: amount,
        description: form.description, date: form.date
      }])
      if (error) throw error
      setToast({ message: 'İşlem eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({ type: 'income', category: 'Satış', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (transaction: any) => {
    setEditForm({
      id: transaction.id, type: transaction.type || 'income',
      category: transaction.category || '', amount: transaction.amount?.toString() || '',
      description: transaction.description || '', date: transaction.date || ''
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const amount = parseFloat(editForm.amount) || 0
      const { error } = await supabase.from('transactions').update({
        type: editForm.type, category: editForm.category, amount: amount,
        description: editForm.description, date: editForm.date
      }).eq('id', editForm.id)
      if (error) throw error
      setToast({ message: 'İşlem güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'İşlem silindi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
  const balance = totalIncome - totalExpense

  const categories = [...new Set(transactions.map(t => t.category))]

  let filtered = transactions
  if (search) {
    const term = search.toLowerCase()
    filtered = filtered.filter(t => t.description?.toLowerCase().includes(term) || t.category?.toLowerCase().includes(term))
  }
  if (dateFilter) filtered = filtered.filter(t => t.date === dateFilter)
  if (typeFilter) filtered = filtered.filter(t => t.type === typeFilter)
  if (categoryFilter) filtered = filtered.filter(t => t.category === categoryFilter)

  if (loading && transactions.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Kasa</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni İşlem</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-emerald-400">₺{totalIncome.toLocaleString('tr-TR')}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Gelir</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-red-400">₺{totalExpense.toLocaleString('tr-TR')}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Gider</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>₺{balance.toLocaleString('tr-TR')}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bakiye</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <div className="form-group">
          <label>Tarih</label>
          <input className="input" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Tip</label>
          <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tümü</option>
            <option value="income">Gelir</option>
            <option value="expense">Gider</option>
          </select>
        </div>
        <div className="form-group">
          <label>Kategori</label>
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Tümü</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Ara</label>
          <input className="input" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Tip</th><th>Kategori</th><th>Tutar</th><th>Açıklama</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td><span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>{t.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                <td>{t.category}</td>
                <td className={`font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>₺{t.amount?.toLocaleString('tr-TR')}</td>
                <td>{t.description}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(t)} className="btn btn-sm btn-secondary">Düzenle</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-sm btn-danger">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>İşlem bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni İşlem Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tip</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kategori *</label>
                  <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Tutar *</label>
                  <input className="input" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input className="input" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tarih</label>
                  <input className="input" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>İşlem Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tip</label>
                  <select className="input" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kategori *</label>
                  <input className="input" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Tutar *</label>
                  <input className="input" type="number" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input className="input" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tarih</label>
                  <input className="input" type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
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

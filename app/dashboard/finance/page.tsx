'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  created_at: string
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0, todayIncome: 0, todayExpense: 0 })

  const [form, setForm] = useState({ type: 'gelir', category: '', amount: '', description: '' })
  const [editForm, setEditForm] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = transactions
    if (categoryFilter) result = result.filter(t => t.category === categoryFilter)
    if (typeFilter) result = result.filter(t => t.type === typeFilter)
    if (dateFrom) result = result.filter(t => t.created_at >= dateFrom + 'T00:00:00')
    if (dateTo) result = result.filter(t => t.created_at <= dateTo + 'T23:59:59')
    setFiltered(result)
  }, [categoryFilter, typeFilter, dateFrom, dateTo, transactions])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    if (data) {
      setTransactions(data)
      setFiltered(data)
      const income = data.filter((t: Transaction) => t.type === 'gelir').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0)
      const expense = data.filter((t: Transaction) => t.type === 'gider').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0)
      const todayIncome = data.filter((t: Transaction) => t.type === 'gelir' && t.created_at >= today + 'T00:00:00').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0)
      const todayExpense = data.filter((t: Transaction) => t.type === 'gider' && t.created_at >= today + 'T00:00:00').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0)
      setBalance({ income, expense, net: income - expense, todayIncome, todayExpense })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('transactions').insert([{
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      description: form.description
    }])
    showToast('Islem kaydedildi')
    setShowModal(false)
    setForm({ type: 'gelir', category: '', amount: '', description: '' })
    loadData()
  }

  const openEditModal = (t: Transaction) => {
    setEditForm({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount?.toString() || '',
      description: t.description || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('transactions').update({
      type: editForm.type,
      category: editForm.category,
      amount: parseFloat(editForm.amount) || 0,
      description: editForm.description
    }).eq('id', editForm.id)
    if (error) {
      showToast('Hata: ' + error.message, 'error')
    } else {
      showToast('Islem guncellendi!')
      setShowEditModal(false)
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('transactions').delete().eq('id', id)
    showToast('Silindi')
    loadData()
  }

  const categories: string[] = []
  transactions.forEach((t: Transaction) => {
    if (!categories.includes(t.category)) categories.push(t.category)
  })

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
        <h1 className="text-2xl font-bold text-white">Kasa</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">Yeni Islem</button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-sm text-slate-400">Toplam Gelir</h3>
          <p className="text-2xl font-bold text-emerald-400">{balance.income.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-sm text-slate-400">Toplam Gider</h3>
          <p className="text-2xl font-bold text-red-400">{balance.expense.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-sm text-slate-400">Net Bakiye</h3>
          <p className={`text-2xl font-bold ${balance.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{balance.net.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-sm text-slate-400">Bugun</h3>
          <p className="text-lg font-bold text-emerald-400">+{balance.todayIncome.toLocaleString('tr-TR')} TL</p>
          <p className="text-sm text-red-400">-{balance.todayExpense.toLocaleString('tr-TR')} TL</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select className="select w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tum Turler</option>
          <option value="gelir">Gelir</option>
          <option value="gider">Gider</option>
        </select>
        <select className="select w-40" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Tum Kategoriler</option>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" className="input w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" className="input w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button onClick={() => { setTypeFilter(''); setCategoryFilter(''); setDateFrom(''); setDateTo('') }} className="btn btn-secondary btn-sm">Temizle</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tur</th><th>Kategori</th><th>Tutar</th><th>Aciklama</th><th>Tarih</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((t: Transaction) => (
              <tr key={t.id}>
                <td><span className={`badge ${t.type === 'gelir' ? 'badge-green' : 'badge-red'}`}>{t.type === 'gelir' ? 'Gelir' : 'Gider'}</span></td>
                <td className="text-slate-300">{t.category}</td>
                <td className={`font-medium ${t.type === 'gelir' ? 'text-emerald-400' : 'text-red-400'}`}>{t.amount?.toLocaleString('tr-TR')} TL</td>
                <td className="text-slate-300 max-w-xs truncate">{t.description || '-'}</td>
                <td className="text-slate-400 text-sm">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
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

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henuz islem kaydi yok</p>
        </div>
      )}

      {/* Yeni Islem Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Islem</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tur</label>
                  <select className="select" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                    <option value="gelir">Gelir</option>
                    <option value="gider">Gider</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kategori *</label>
                  <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required placeholder="Orn: Teknik Servis, Sarf Malzeme..." />
                </div>
                <div className="form-group">
                  <label>Tutar (TL) *</label>
                  <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Aciklama</label>
                  <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
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

      {/* Duzenle Modal */}
      {showEditModal && editForm && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Islem Duzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Tur</label>
                  <select className="select" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})}>
                    <option value="gelir">Gelir</option>
                    <option value="gider">Gider</option>
                  </select>
                </div>
                <div className="form-group"><label>Kategori *</label><input className="input" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} required /></div>
                <div className="form-group"><label>Tutar (TL) *</label><input className="input" type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} required /></div>
                <div className="form-group"><label>Aciklama</label><textarea className="input" rows={2} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Guncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

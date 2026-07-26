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
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0, todayIncome: 0, todayExpense: 0 })

  const [form, setForm] = useState({ type: 'gelir', category: '', amount: '', description: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = transactions
    if (categoryFilter) result = result.filter(t => t.category === categoryFilter)
    if (typeFilter) result = result.filter(t => t.type === typeFilter)
    setFiltered(result)
  }, [categoryFilter, typeFilter, transactions])

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
      const income = data.filter(t => t.type === 'gelir').reduce((s, t) => s + (t.amount || 0), 0)
      const expense = data.filter(t => t.type === 'gider').reduce((s, t) => s + (t.amount || 0), 0)
      const todayIncome = data.filter(t => t.type === 'gelir' && t.created_at >= today + 'T00:00:00').reduce((s, t) => s + (t.amount || 0), 0)
      const todayExpense = data.filter(t => t.type === 'gider' && t.created_at >= today + 'T00:00:00').reduce((s, t) => s + (t.amount || 0), 0)
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

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('transactions').delete().eq('id', id)
    showToast('Silindi')
    loadData()
  }

  const categories = [...new Set(transactions.map(t => t.category))]

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
        <div className="stat-card">
          <h3 className="text-sm text-slate-400">Toplam Gelir</h3>
          <p className="text-2xl font-bold text-emerald-400">{balance.income.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm text-slate-400">Toplam Gider</h3>
          <p className="text-2xl font-bold text-red-400">{balance.expense.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm text-slate-400">Net Bakiye</h3>
          <p className={`text-2xl font-bold ${balance.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{balance.net.toLocaleString('tr-TR')} TL</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm text-slate-400">Bugun</h3>
          <p className="text-lg font-bold text-emerald-400">+{balance.todayIncome.toLocaleString('tr-TR')} TL</p>
          <p className="text-sm text-red-400">-{balance.todayExpense.toLocaleString('tr-TR')} TL</p>
        </div>
      </div>

      <div className="flex gap-2">
        <select className="select w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tum Turler</option>
          <option value="gelir">Gelir</option>
          <option value="gider">Gider</option>
        </select>
        <select className="select w-40" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Tum Kategoriler</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tur</th>
              <th>Kategori</th>
              <th>Tutar</th>
              <th>Aciklama</th>
              <th>Tarih</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td><span className={`badge ${t.type === 'gelir' ? 'badge-green' : 'badge-red'}`}>{t.type === 'gelir' ? 'Gelir' : 'Gider'}</span></td>
                <td className="text-slate-300">{t.category}</td>
                <td className={`font-medium ${t.type === 'gelir' ? 'text-emerald-400' : 'text-red-400'}`}>{t.amount?.toLocaleString('tr-TR')} TL</td>
                <td className="text-slate-300 max-w-xs truncate">{t.description || '-'}</td>
                <td className="text-slate-400 text-sm">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                  <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">Sil</button>
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
    </div>
  )
}

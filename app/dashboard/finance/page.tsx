'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown, X, Download } from 'lucide-react'
import { useToast } from '@/components/toast'

function ExportCSV({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(';')
    const rows = data.map(row => Object.values(row).map(v => String(v ?? '').replace(/;/g, ',')).join(';'))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
  return (
    <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
      <Download size={16}/> Excel
    </button>
  )
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
  const { showToast, ToastComponent } = useToast()

  const categories = {
    income: ['Satış', 'Servis', 'Diğer Gelir'],
    expense: ['Tedarik', 'Kira', 'Maaş', 'Fatura', 'Vergi', 'Diğer Gider']
  }

  useEffect(() => { fetchTransactions() }, [])

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false })
    setTransactions(data || [])
    const bal = (data || []).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
    setBalance(bal)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }
    const payload = {
      ...form,
      user_id: user.id,
      amount: parseFloat(form.amount)
    }
    const { error } = await supabase.from('transactions').insert([payload])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('İşlem kaydedildi'); setShowModal(false); setForm({ type: 'income', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] }); fetchTransactions() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('İşlem silindi'); fetchTransactions() }
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finans / Kasa</h1>
        <div className="flex gap-2">
          <ExportCSV data={transactions} filename="finans.csv" />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18}/> Yeni İşlem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <Wallet className="text-blue-600" size={28}/>
          <div><div className="text-sm text-gray-500">Kasa Bakiyesi</div><div className="text-2xl font-bold">{balance.toFixed(2)} ₺</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <TrendingUp className="text-green-600" size={28}/>
          <div><div className="text-sm text-gray-500">Toplam Gelir</div><div className="text-2xl font-bold text-green-600">{income.toFixed(2)} ₺</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <TrendingDown className="text-red-600" size={28}/>
          <div><div className="text-sm text-gray-500">Toplam Gider</div><div className="text-2xl font-bold text-red-600">{expense.toFixed(2)} ₺</div></div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr><th className="table-header">Tarih</th><th className="table-header">Tür</th><th className="table-header">Kategori</th><th className="table-header">Açıklama</th><th className="table-header">Tutar</th><th className="table-header">İşlem</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={12}/> : <ArrowDownCircle size={12}/>}
                    {t.type === 'income' ? 'Gelir' : 'Gider'}
                  </span>
                </td>
                <td className="table-cell">{t.category}</td>
                <td className="table-cell">{t.description || '-'}</td>
                <td className={`table-cell font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toFixed(2)} ₺</td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">İşlem bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Yeni İşlem</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" checked={form.type === 'income'} onChange={() => setForm({...form, type: 'income', category: ''})} />
                  <ArrowUpCircle size={18} className="text-green-600"/> Gelir
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" checked={form.type === 'expense'} onChange={() => setForm({...form, type: 'expense', category: ''})} />
                  <ArrowDownCircle size={18} className="text-red-600"/> Gider
                </label>
              </div>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">Kategori seçin</option>
                {categories[form.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input" type="number" step="0.01" placeholder="Tutar (₺) *" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              <input className="input" placeholder="Açıklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

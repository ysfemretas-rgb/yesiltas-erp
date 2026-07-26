'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useToast } from '@/components/toast'
import { ExportCSV } from '@/components/export-csv'

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', payment_method: 'Nakit' })
  const [filter, setFilter] = useState('')
  const { showToast, ToastComponent } = useToast()

  const categories = {
    income: ['Satış', 'Servis', 'Diğer Gelir'],
    expense: ['Kira', 'Maaş', 'Elektrik', 'Su', 'İnternet', 'Tedarik', 'Vergi', 'Diğer Gider']
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('finance_transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
    setTransactions(data || [])
    const inc = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const exp = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
    setBalance(inc - exp)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }
    const { error } = await supabase.from('finance_transactions').insert([{
      ...form,
      amount: parseFloat(form.amount) || 0,
      user_id: user.id
    }])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('İşlem kaydedildi'); setShowModal(false); setForm({ type: 'income', category: '', amount: '', description: '', payment_method: 'Nakit' }); fetchData() }
  }

  const filtered = filter ? transactions.filter(t => t.type === filter) : transactions

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
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg"><Wallet size={24}/></div>
          <div>
            <div className="text-sm text-gray-500">Kasa Bakiyesi</div>
            <div className="text-2xl font-bold text-green-600">{balance.toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><TrendingUp size={24}/></div>
          <div>
            <div className="text-sm text-gray-500">Toplam Gelir</div>
            <div className="text-2xl font-bold text-blue-600">{transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-lg"><TrendingDown size={24}/></div>
          <div>
            <div className="text-sm text-gray-500">Toplam Gider</div>
            <div className="text-2xl font-bold text-red-600">{transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString('tr-TR')} ₺</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-lg text-sm font-medium ${!filter ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Tümü</button>
        <button onClick={() => setFilter('income')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Gelir</button>
        <button onClick={() => setFilter('expense')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Gider</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="table-header">Tarih</th>
              <th className="table-header">Tür</th>
              <th className="table-header">Kategori</th>
              <th className="table-header">Tutar</th>
              <th className="table-header">Açıklama</th>
              <th className="table-header">Ödeme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type === 'income' ? 'Gelir' : 'Gider'}
                  </span>
                </td>
                <td className="table-cell">{t.category}</td>
                <td className={`table-cell font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toLocaleString('tr-TR')} ₺</td>
                <td className="table-cell">{t.description || '-'}</td>
                <td className="table-cell">{t.payment_method}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">İşlem bulunamadı</td></tr>}
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
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><ArrowUpCircle size={16} className="inline mr-1"/> Gelir</button>
                <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><ArrowDownCircle size={16} className="inline mr-1"/> Gider</button>
              </div>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">Kategori Seçin</option>
                {categories[form.type as 'income' | 'expense'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input" type="number" placeholder="Tutar (₺) *" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              <input className="input" placeholder="Açıklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <select className="input" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                <option>Nakit</option>
                <option>Kredi Kartı</option>
                <option>Havale</option>
                <option>Çek</option>
              </select>
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

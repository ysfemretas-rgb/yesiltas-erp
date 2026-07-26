'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ type: 'income', category: '', amount: '', description: '', payment_method: 'Nakit' })
  const [balance, setBalance] = useState({ income: 0, expense: 0, net: 0 })
  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const { data } = await supabase.from('finance_transactions').select('*').order('created_at', { ascending: false })
    const txs = data || []
    setTransactions(txs)
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
    setBalance({ income, expense, net: income - expense })
    setLoading(false)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('finance_transactions').insert([{
      ...formData,
      amount: parseFloat(formData.amount) || 0
    }])
    setFormData({ type: 'income', category: '', amount: '', description: '', payment_method: 'Nakit' })
    setShowForm(false)
    fetchData()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('finance_transactions').delete().eq('id', id)
    fetchData()
  }
  const filtered = transactions.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finans</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Kayıt</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Toplam Gelir</p><p className="text-2xl font-bold text-green-600">₺{balance.income.toLocaleString('tr-TR')}</p></div><div className="bg-green-100 p-3 rounded-lg"><TrendingUp className="text-green-600" size={24} /></div></div></div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Toplam Gider</p><p className="text-2xl font-bold text-red-600">₺{balance.expense.toLocaleString('tr-TR')}</p></div><div className="bg-red-100 p-3 rounded-lg"><TrendingDown className="text-red-600" size={24} /></div></div></div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Net Bakiye</p><p className="text-2xl font-bold text-blue-600">₺{balance.net.toLocaleString('tr-TR')}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Wallet className="text-blue-600" size={24} /></div></div></div>
      </div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Finans Kaydı</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Tür</label><select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="income">Gelir (+)</option><option value="expense">Gider (-)</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Kategori</label><input className="input" placeholder="Örn: Kira, Maaş, Satış" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium mb-1">Tutar (₺)</label><input type="number" className="input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium mb-1">Ödeme Yöntemi</label><select className="input" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}><option value="Nakit">Nakit</option><option value="Kredi Kartı">Kredi Kartı</option><option value="Havale">Havale</option></select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Açıklama</label><input className="input" placeholder="Açıklama" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="md:col-span-3 flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">İptal</button></div>
          </form>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Açıklama veya kategori ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Tarih</th><th className="table-header">Tür</th><th className="table-header">Kategori</th><th className="table-header">Açıklama</th><th className="table-header">Tutar</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">Kayıt bulunamadı</td></tr> :
             filtered.map((t) => (
               <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                 <td className="table-cell"><span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                 <td className="table-cell">{t.category}</td>
                 <td className="table-cell">{t.description || '-'}</td>
                 <td className="table-cell font-bold">₺{t.amount}</td>
                 <td className="table-cell"><button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
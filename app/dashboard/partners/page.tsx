'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, Users, Receipt } from 'lucide-react'
export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState<string | null>(null)
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', share_percent: '' })
  const [expenseData, setExpenseData] = useState({ amount: '', description: '' })
  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const [{ data: pData }, { data: eData }] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_expenses').select('*, partners(full_name)').order('created_at', { ascending: false })
    ])
    setPartners(pData || [])
    setExpenses(eData || [])
    setLoading(false)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('partners').insert([{
      ...formData,
      share_percent: parseFloat(formData.share_percent) || 0
    }])
    setFormData({ full_name: '', phone: '', email: '', share_percent: '' })
    setShowForm(false)
    fetchData()
  }
  const handleExpense = async (e: React.FormEvent, partnerId: string) => {
    e.preventDefault()
    await supabase.from('partner_expenses').insert([{
      partner_id: partnerId,
      amount: parseFloat(expenseData.amount) || 0,
      description: expenseData.description
    }])
    setExpenseData({ amount: '', description: '' })
    setShowExpenseForm(null)
    fetchData()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('partners').delete().eq('id', id)
    fetchData()
  }
  const filtered = partners.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ortaklık</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Ortak</button></div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Ortak Ekle</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Ad Soyad *" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
            <input className="input" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input className="input" placeholder="E-posta" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="number" className="input" placeholder="Pay Yüzdesi (%)" value={formData.share_percent} onChange={e => setFormData({...formData, share_percent: e.target.value})} />
            <div className="md:col-span-2 flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">İptal</button></div>
          </form>
        </div>
      )}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExpenseForm(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Yeni Harcama</h3>
            <form onSubmit={(e) => handleExpense(e, showExpenseForm)} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tutar (₺)</label><input type="number" className="input" placeholder="0.00" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Açıklama</label><input className="input" placeholder="Harcama açıklaması" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} /></div>
              <div className="flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowExpenseForm(null)} className="btn-secondary">İptal</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Ortak ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500" />Ortaklar</h3>
          <div className="space-y-3">
            {loading ? <p className="text-center text-gray-500">Yükleniyor...</p> : filtered.length === 0 ? <p className="text-center text-gray-500">Ortak bulunamadı</p> :
              filtered.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div><p className="font-medium">{p.full_name}</p><p className="text-xs text-gray-500">Pay: %{p.share_percent || 0}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowExpenseForm(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Harcama Ekle"><Receipt size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Receipt size={20} className="text-green-500" />Harcamalar</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? <p className="text-center text-gray-500">Harcama bulunamadı</p> :
              expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div><p className="font-medium text-sm">{e.partners?.full_name}</p><p className="text-xs text-gray-500">{e.description || 'Harcama'}</p><p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('tr-TR')}</p></div>
                  <span className="font-bold text-red-600">₺{e.amount}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
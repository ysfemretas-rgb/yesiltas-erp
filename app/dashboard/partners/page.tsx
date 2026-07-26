'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Plus, Trash2, X, Wallet, Monitor, Wrench } from 'lucide-react'
import { useToast } from '@/components/toast'

type Tab = 'partners' | 'expenses' | 'assets'

export default function PartnersPage() {
  const [tab, setTab] = useState<Tab>('partners')
  const [partners, setPartners] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>({})
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [tab])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (tab === 'partners') {
      const { data } = await supabase.from('partners').select('*').eq('user_id', user?.id).order('name')
      setPartners(data || [])
    } else if (tab === 'expenses') {
      const { data } = await supabase.from('partner_expenses').select('*, partners(name)').eq('user_id', user?.id).order('date', { ascending: false })
      setExpenses(data || [])
    } else {
      const { data } = await supabase.from('fixed_assets').select('*').eq('user_id', user?.id).order('purchase_date', { ascending: false })
      setAssets(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    let table = tab === 'partners' ? 'partners' : tab === 'expenses' ? 'partner_expenses' : 'fixed_assets'
    const payload = { ...form, user_id: user.id }
    if (tab === 'expenses') payload.amount = parseFloat(payload.amount)
    if (tab === 'assets') {
      payload.purchase_price = parseFloat(payload.purchase_price)
      payload.current_value = payload.current_value ? parseFloat(payload.current_value) : payload.purchase_price
    }

    const { error } = await supabase.from(table).insert([payload])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Kaydedildi'); setShowModal(false); setForm({}); fetchData() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const table = tab === 'partners' ? 'partners' : tab === 'expenses' ? 'partner_expenses' : 'fixed_assets'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Silindi'); fetchData() }
  }

  const tabs = [
    { id: 'partners' as Tab, label: 'Ortaklar', icon: Users },
    { id: 'expenses' as Tab, label: 'Harcamalar', icon: Wallet },
    { id: 'assets' as Tab, label: 'Demirbaşlar', icon: Monitor }
  ]

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ortaklık Yönetimi</h1>

      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16}/> {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setForm({}); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18}/> Yeni {tab === 'partners' ? 'Ortak' : tab === 'expenses' ? 'Harcama' : 'Demirbaş'}
        </button>
      </div>

      {/* Ortaklar Tablosu */}
      {tab === 'partners' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad</th><th className="table-header">Telefon</th><th className="table-header">Pay (%)</th><th className="table-header">Notlar</th><th className="table-header">İşlem</th></tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {partners.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell font-medium">{p.name}</td>
                  <td className="table-cell">{p.phone || '-'}</td>
                  <td className="table-cell">{p.share_percentage}%</td>
                  <td className="table-cell">{p.notes || '-'}</td>
                  <td className="table-cell"><button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Ortak bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Harcamalar Tablosu */}
      {tab === 'expenses' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Tarih</th><th className="table-header">Ortak</th><th className="table-header">Açıklama</th><th className="table-header">Tutar</th><th className="table-header">İşlem</th></tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell">{new Date(e.date).toLocaleDateString('tr-TR')}</td>
                  <td className="table-cell">{e.partners?.name || '-'}</td>
                  <td className="table-cell">{e.description}</td>
                  <td className="table-cell font-bold text-red-600">{e.amount?.toFixed(2)} ₺</td>
                  <td className="table-cell"><button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Harcama bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Demirbaşlar Tablosu */}
      {tab === 'assets' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad</th><th className="table-header">Kategori</th><th className="table-header">Alış Tarihi</th><th className="table-header">Alış Fiyatı</th><th className="table-header">Güncel Değer</th><th className="table-header">İşlem</th></tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell font-medium">{a.name}</td>
                  <td className="table-cell">{a.category || '-'}</td>
                  <td className="table-cell">{new Date(a.purchase_date).toLocaleDateString('tr-TR')}</td>
                  <td className="table-cell">{a.purchase_price?.toFixed(2)} ₺</td>
                  <td className="table-cell">{a.current_value?.toFixed(2)} ₺</td>
                  <td className="table-cell"><button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Demirbaş bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Yeni {tab === 'partners' ? 'Ortak' : tab === 'expenses' ? 'Harcama' : 'Demirbaş'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === 'partners' && (
                <>
                  <input className="input" placeholder="Ad Soyad *" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required />
                  <input className="input" placeholder="Telefon" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                  <input className="input" type="number" placeholder="Pay Yüzdesi (%)" value={form.share_percentage || ''} onChange={e => setForm({...form, share_percentage: parseFloat(e.target.value)})} />
                  <input className="input" placeholder="Notlar" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
                </>
              )}
              {tab === 'expenses' && (
                <>
                  <select className="input" value={form.partner_id || ''} onChange={e => setForm({...form, partner_id: e.target.value})} required>
                    <option value="">Ortak seçin</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input" placeholder="Açıklama *" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} required />
                  <input className="input" type="number" step="0.01" placeholder="Tutar (₺) *" value={form.amount || ''} onChange={e => setForm({...form, amount: e.target.value})} required />
                  <input className="input" type="date" value={form.date || new Date().toISOString().split('T')[0]} onChange={e => setForm({...form, date: e.target.value})} required />
                </>
              )}
              {tab === 'assets' && (
                <>
                  <input className="input" placeholder="Demirbaş Adı *" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required />
                  <input className="input" placeholder="Kategori" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} />
                  <input className="input" type="date" placeholder="Alış Tarihi" value={form.purchase_date || new Date().toISOString().split('T')[0]} onChange={e => setForm({...form, purchase_date: e.target.value})} />
                  <input className="input" type="number" step="0.01" placeholder="Alış Fiyatı (₺) *" value={form.purchase_price || ''} onChange={e => setForm({...form, purchase_price: e.target.value})} required />
                  <input className="input" type="number" step="0.01" placeholder="Güncel Değer (₺)" value={form.current_value || ''} onChange={e => setForm({...form, current_value: e.target.value})} />
                </>
              )}
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

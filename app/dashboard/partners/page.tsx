'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Users, DollarSign, Package, X } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<'partners' | 'expenses' | 'assets'>('partners')
  const [partners, setPartners] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'partner' | 'expense' | 'asset'>('partner')
  const [form, setForm] = useState<any>({})
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: p }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('partners').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('partner_expenses').select('*, partners(full_name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('fixed_assets').select('*, partners(full_name)').eq('user_id', user?.id).order('created_at', { ascending: false })
    ])
    setPartners(p || [])
    setExpenses(e || [])
    setAssets(a || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    let table = ''
    let payload: any = { user_id: user.id }
    if (modalType === 'partner') {
      table = 'partners'
      payload = { ...payload, full_name: form.full_name, phone: form.phone, email: form.email, share_percent: parseFloat(form.share_percent) || 0 }
    } else if (modalType === 'expense') {
      table = 'partner_expenses'
      payload = { ...payload, partner_id: form.partner_id, amount: parseFloat(form.amount) || 0, description: form.description, expense_date: form.expense_date || new Date().toISOString().split('T')[0] }
    } else {
      table = 'fixed_assets'
      payload = { ...payload, name: form.name, description: form.description, purchase_price: parseFloat(form.purchase_price) || 0, purchase_date: form.purchase_date || new Date().toISOString().split('T')[0], partner_id: form.partner_id || null, status: 'active' }
    }

    const { error } = await supabase.from(table).insert([payload])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Kaydedildi'); setShowModal(false); setForm({}); fetchData() }
  }

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalAssets = assets.reduce((s, a) => s + (a.purchase_price || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ortaklık</h1>
        <div className="flex gap-2">
          <button onClick={() => { setModalType('partner'); setForm({}); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={18}/> Ortak Ekle</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg"><Users size={24}/></div>
          <div><div className="text-sm text-gray-500">Toplam Ortak</div><div className="text-2xl font-bold">{partners.length}</div></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-lg"><DollarSign size={24}/></div>
          <div><div className="text-sm text-gray-500">Toplam Harcama</div><div className="text-2xl font-bold">{totalExpenses.toLocaleString('tr-TR')} ₺</div></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><Package size={24}/></div>
          <div><div className="text-sm text-gray-500">Demirbaş Değeri</div><div className="text-2xl font-bold">{totalAssets.toLocaleString('tr-TR')} ₺</div></div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['partners', 'expenses', 'assets'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
            {tab === 'partners' ? 'Ortaklar' : tab === 'expenses' ? 'Harcamalar' : 'Demirbaşlar'}
          </button>
        ))}
      </div>

      {activeTab === 'partners' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad Soyad</th><th className="table-header">Telefon</th><th className="table-header">E-posta</th><th className="table-header">Pay (%)</th></tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {partners.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell font-medium">{p.full_name}</td>
                  <td className="table-cell">{p.phone || '-'}</td>
                  <td className="table-cell">{p.email || '-'}</td>
                  <td className="table-cell">{p.share_percent}%</td>
                </tr>
              ))}
              {partners.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">Ortak bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <button onClick={() => { setModalType('expense'); setForm({}); setShowModal(true) }} className="btn-secondary flex items-center gap-2"><Plus size={16}/> Harcama Ekle</button>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ortak</th><th className="table-header">Tutar</th><th className="table-header">Açıklama</th><th className="table-header">Tarih</th></tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell">{e.partners?.full_name}</td>
                    <td className="table-cell font-bold text-red-600">{e.amount} ₺</td>
                    <td className="table-cell">{e.description || '-'}</td>
                    <td className="table-cell">{new Date(e.expense_date).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">Harcama bulunamadı</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-4">
          <button onClick={() => { setModalType('asset'); setForm({}); setShowModal(true) }} className="btn-secondary flex items-center gap-2"><Plus size={16}/> Demirbaş Ekle</button>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad</th><th className="table-header">Ortak</th><th className="table-header">Alış Fiyatı</th><th className="table-header">Tarih</th><th className="table-header">Durum</th></tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {assets.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">{a.name}</td>
                    <td className="table-cell">{a.partners?.full_name || '-'}</td>
                    <td className="table-cell">{a.purchase_price} ₺</td>
                    <td className="table-cell">{new Date(a.purchase_date).toLocaleDateString('tr-TR')}</td>
                    <td className="table-cell"><span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  </tr>
                ))}
                {assets.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">Demirbaş bulunamadı</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{modalType === 'partner' ? 'Yeni Ortak' : modalType === 'expense' ? 'Yeni Harcama' : 'Yeni Demirbaş'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {modalType === 'partner' && (
                <>
                  <input className="input" placeholder="Ad Soyad *" value={form.full_name || ''} onChange={e => setForm({...form, full_name: e.target.value})} required />
                  <input className="input" placeholder="Telefon" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                  <input className="input" placeholder="E-posta" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                  <input className="input" type="number" placeholder="Pay Yüzdesi (%)" value={form.share_percent || ''} onChange={e => setForm({...form, share_percent: e.target.value})} />
                </>
              )}
              {modalType === 'expense' && (
                <>
                  <select className="input" value={form.partner_id || ''} onChange={e => setForm({...form, partner_id: e.target.value})} required>
                    <option value="">Ortak Seçin</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="Tutar (₺) *" value={form.amount || ''} onChange={e => setForm({...form, amount: e.target.value})} required />
                  <input className="input" placeholder="Açıklama" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
                  <input className="input" type="date" value={form.expense_date || ''} onChange={e => setForm({...form, expense_date: e.target.value})} />
                </>
              )}
              {modalType === 'asset' && (
                <>
                  <input className="input" placeholder="Demirbaş Adı *" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required />
                  <input className="input" placeholder="Açıklama" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
                  <input className="input" type="number" placeholder="Alış Fiyatı (₺)" value={form.purchase_price || ''} onChange={e => setForm({...form, purchase_price: e.target.value})} />
                  <input className="input" type="date" value={form.purchase_date || ''} onChange={e => setForm({...form, purchase_date: e.target.value})} />
                  <select className="input" value={form.partner_id || ''} onChange={e => setForm({...form, partner_id: e.target.value})}>
                    <option value="">Ortak Seçin (Opsiyonel)</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
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

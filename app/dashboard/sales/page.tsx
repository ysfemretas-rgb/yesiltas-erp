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

interface Sale {
  id: string
  müşteri_kimliği: string
  ürün_adı: string
  ürün_türü: string
  miktar: number
  birim_fiyatı: number
  toplam_fiyat: number
  ödeme_yöntemi: string
  taksitler: number
  kalan_miktar: number
  garanti_ayları: number
  garanti_bitiş_tarihi: string
  oluşturulma_tarihi: string
  peşin: boolean
}

interface Customer {
  id: string
  ad: string
  telefon: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    müşteri_kimliği: '', ürün_adı: '', ürün_türü: 'Cihaz', miktar: '1',
    birim_fiyatı: '', ödeme_yöntemi: 'Nakit', taksitler: '1',
    garanti_ayları: '12', selected_inventory: '', peşin: true
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '', müşteri_kimliği: '', ürün_adı: '', birim_fiyatı: '', miktar: '1',
    ödeme_yöntemi: 'Nakit', taksitler: '1', kalan_miktar: '',
    garanti_ayları: '12', oluşturulma_tarihi: '', peşin: true
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ satış_kimliği: '', ödeme_miktarı: '' })

  const calculatedTotal = (parseInt(form.miktar) || 1) * (parseFloat(form.birim_fiyatı) || 0)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = sales
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(s => s.ürün_adı?.toLowerCase().includes(term))
    }
    setFiltered(result)
  }, [search, sales])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [salesRes, customersRes, inventoryRes] = await Promise.all([
      supabase.from('sales').select('*').order('oluşturulma_tarihi', { ascending: false }),
      supabase.from('customers').select('id, ad, telefon').order('ad'),
      supabase.from('inventory').select('id, ad, kategori, satış_fiyatı, miktar').gt('miktar', 0)
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    if (inventoryRes.data) setInventory(inventoryRes.data as any[])
    setLoading(false)
  }

  const handleInventorySelect = (inventoryId: string) => {
    const item = inventory.find((i: any) => i.id === inventoryId)
    if (item) {
      setForm({
        ...form,
        selected_inventory: inventoryId,
        ürün_adı: item.ad,
        ürün_türü: item.kategori === 'Aksesuar' ? 'Aksesuar' : item.kategori === 'Parça' ? 'Parça' : 'Cihaz',
        birim_fiyatı: item.satış_fiyatı.toString()
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(form.miktar) || 1
    const price = parseFloat(form.birim_fiyatı) || 0
    const total = qty * price
    const taksitler = parseInt(form.taksitler) || 1
    const garantiAyları = parseInt(form.garanti_ayları) || 12
    const peşin = form.peşin
    const remaining = !peşin ? total : 0

    const garantiBitiş = new Date()
    garantiBitiş.setMonth(garantiBitiş.getMonth() + garantiAyları)

    const { data: saleData, error } = await supabase.from('sales').insert([{
      müşteri_kimliği: form.müşteri_kimliği || null,
      ürün_adı: form.ürün_adı,
      ürün_türü: form.ürün_türü,
      miktar: qty,
      birim_fiyatı: price,
      toplam_fiyat: total,
      ödeme_yöntemi: form.ödeme_yöntemi,
      taksitler,
      kalan_miktar: remaining,
      garanti_ayları: garantiAyları,
      garanti_bitiş_tarihi: garantiBitiş.toISOString().split('T')[0],
      peşin
    }]).select()

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    if (form.selected_inventory) {
      const item = inventory.find((i: any) => i.id === form.selected_inventory)
      if (item) {
        await supabase.from('inventory').update({ miktar: item.miktar - qty }).eq('id', form.selected_inventory)
      }
    }

    if (peşin) {
      await supabase.from('transactions').insert([{
        tip: 'gelir',
        kategori: 'Satış',
        miktar: total,
        Tanım: `${form.ürün_adı} - ${form.ödeme_yöntemi} (Peşin)`,
        ilgili_kimlik: saleData?.[0]?.id,
        ilgili_tablo: 'sales'
      }])
    }

    if (saleData && saleData[0]) {
      await supabase.from('warranties').insert([{
        satış_kimliği: saleData[0].id,
        müşteri_kimliği: form.müşteri_kimliği || null,
        müşteri_adı: customers.find(c => c.id === form.müşteri_kimliği)?.ad || '',
        ürün_adı: form.ürün_adı,
        garanti_ayları: garantiAyları,
        garanti_bitiş_tarihi: garantiBitiş.toISOString().split('T')[0]
      }])
    }

    if (!peşin && remaining > 0) {
      await supabase.from('debts').insert([{
        müşteri_kimliği: form.müşteri_kimliği || null,
        kaynak_türü: 'satış',
        kaynak_kimliği: saleData?.[0]?.id,
        toplam_miktar: total,
        ödenen_miktar: 0,
        kalan_miktar: remaining,
        durum: 'Beklemede',
        bitiş_tarihi: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
    }

    showToast('Satış kaydedildi!')
    setShowAddModal(false)
    setForm({ müşteri_kimliği: '', ürün_adı: '', ürün_türü: 'Cihaz', miktar: '1', birim_fiyatı: '', ödeme_yöntemi: 'Nakit', taksitler: '1', garanti_ayları: '12', selected_inventory: '', peşin: true })
    loadData()
  }

  const openEditModal = (sale: Sale) => {
    setEditForm({
      id: sale.id,
      müşteri_kimliği: sale.müşteri_kimliği || '',
      ürün_adı: sale.ürün_adı || '',
      birim_fiyatı: sale.birim_fiyatı?.toString() || '',
      miktar: sale.miktar?.toString() || '1',
      ödeme_yöntemi: sale.ödeme_yöntemi || 'Nakit',
      taksitler: sale.taksitler?.toString() || '1',
      kalan_miktar: sale.kalan_miktar?.toString() || '',
      garanti_ayları: sale.garanti_ayları?.toString() || '12',
      oluşturulma_tarihi: sale.oluşturulma_tarihi || '',
      peşin: sale.peşin || false
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const total = parseFloat(editForm.birim_fiyatı) * parseInt(editForm.miktar)
      const months = parseInt(editForm.garanti_ayları) || 12

      const startDate = editForm.oluşturulma_tarihi ? new Date(editForm.oluşturulma_tarihi) : new Date()
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + months)
      const garantiBitiş = endDate.toISOString().split('T')[0]

      const { error } = await supabase.from('sales').update({
        müşteri_kimliği: editForm.müşteri_kimliği,
        ürün_adı: editForm.ürün_adı.trim(),
        birim_fiyatı: parseFloat(editForm.birim_fiyatı) || 0,
        miktar: parseInt(editForm.miktar) || 1,
        toplam_fiyat: total,
        ödeme_yöntemi: editForm.ödeme_yöntemi,
        taksitler: parseInt(editForm.taksitler) || 1,
        kalan_miktar: parseFloat(editForm.kalan_miktar) || 0,
        garanti_ayları: months,
        garanti_bitiş_tarihi: garantiBitiş,
        peşin: editForm.peşin
      }).eq('id', editForm.id)

      if (error) {
        showToast('Hata: ' + error.message, 'error')
      } else {
        showToast('Satış kaydı güncellendi!')
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    }
  }

  const openPaymentModal = (sale: Sale) => {
    setPaymentForm({ satış_kimliği: sale.id, ödeme_miktarı: '' })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sale = sales.find(s => s.id === paymentForm.satış_kimliği)
      if (!sale) return

      const paymentAmount = parseFloat(paymentForm.ödeme_miktarı) || 0
      const newRemaining = Math.max(0, (sale.kalan_miktar || 0) - paymentAmount)

      const { error } = await supabase.from('sales').update({
        kalan_miktar: newRemaining
      }).eq('id', paymentForm.satış_kimliği)

      if (error) {
        showToast('Hata: ' + error.message, 'error')
        return
      }

      const { data: existingDebts } = await supabase
        .from('debts')
        .select('*')
        .eq('kaynak_kimliği', paymentForm.satış_kimliği)
        .eq('kaynak_türü', 'satış')

      if (existingDebts && existingDebts.length > 0) {
        const debt = existingDebts[0]
        const newPaid = (debt.ödenen_miktar || 0) + paymentAmount
        const newRemainingDebt = Math.max(0, (debt.kalan_miktar || 0) - paymentAmount)

        await supabase.from('debts').update({
          ödenen_miktar: newPaid,
          kalan_miktar: newRemainingDebt,
          durum: newRemainingDebt <= 0 ? 'Ödendi' : 'Beklemede'
        }).eq('id', debt.id)
      }

      await supabase.from('transactions').insert([{
        tip: 'gelir',
        kategori: 'Taksit Ödemesi',
        miktar: paymentAmount,
        Tanım: `${sale.ürün_adı} - Taksit Ödemesi`,
        ilgili_kimlik: sale.id,
        ilgili_tablo: 'sales'
      }])

      await supabase.from('customer_payments').insert([{
        müşteri_kimliği: sale.müşteri_kimliği,
        miktar: paymentAmount,
        ödeme_yöntemi: sale.ödeme_yöntemi,
        notlar: `Taksit ödemesi - ${sale.ürün_adı}`
      }])

      showToast(`₺${paymentAmount.toLocaleString('tr-TR')} ödeme kaydedildi! Kalan: ₺${newRemaining.toLocaleString('tr-TR')}`)
      setShowPaymentModal(false)
      loadData()
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    }
  }

  const handleDelete = async (sale: Sale) => {
    if (!confirm('Bu satış kaydını silmek istediğinize emin misiniz?')) return
    try {
      const { data: invItems } = await supabase
        .from('inventory')
        .select('*')
        .eq('ad', sale.ürün_adı)

      if (invItems && invItems.length > 0) {
        const invItem = invItems[0]
        await supabase.from('inventory').update({
          miktar: (invItem.miktar || 0) + (sale.miktar || 1)
        }).eq('id', invItem.id)
      }

      await supabase.from('transactions').delete().eq('ilgili_kimlik', sale.id).eq('ilgili_tablo', 'sales')
      await supabase.from('warranties').delete().eq('satış_kimliği', sale.id)
      await supabase.from('debts').delete().eq('kaynak_kimliği', sale.id).eq('kaynak_türü', 'satış')

      const { error } = await supabase.from('sales').delete().eq('id', sale.id)
      if (error) {
        showToast('Hata: ' + error.message, 'error')
      } else {
        showToast('Satış kaydı silindi! Stok geri eklendi.')
        loadData()
      }
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    }
  }

  const isWarrantyActive = (endDate: string) => {
    return endDate ? new Date(endDate) > new Date() : false
  }

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return 0
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getPaymentStatus = (sale: Sale) => {
    const total = sale.toplam_fiyat || 0
    const remaining = sale.kalan_miktar || 0
    const paid = total - remaining

    if (sale.peşin || remaining <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Peşin</span>
    }
    if (sale.ödeme_yöntemi === 'Taksit' || sale.ödeme_yöntemi === 'Borç') {
      const monthly = total / (sale.taksitler || 1)
      const paidInstallments = Math.floor(paid / monthly)
      return (
        <div className="flex flex-col gap-1">
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💳 Taksit</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInstallments}/{sale.taksitler} ödendi</span>
          <span className="text-xs text-red-400">Kalan: ₺{remaining.toLocaleString('tr-TR')}</span>
        </div>
      )
    }
    return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>❌ ₺{remaining.toLocaleString('tr-TR')}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Satış</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">+ Yeni Satış</button>
      </div>

      <input type="text" className="input" placeholder="Ürün ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Tip</th>
              <th>Müşteri</th>
              <th>Adet</th>
              <th>Birim Fiyat</th>
              <th>Toplam</th>
              <th>Ödeme</th>
              <th>Taksit</th>
              <th>Garanti</th>
              <th>Kalan Süre</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => {
              const customer = customers.find(c => c.id === sale.müşteri_kimliği)
              const active = isWarrantyActive(sale.garanti_bitiş_tarihi)
              const daysLeft = daysUntilExpiry(sale.garanti_bitiş_tarihi)
              const monthlyInstallment = sale.ödeme_yöntemi === 'Taksit' ? (sale.toplam_fiyat || 0) / (sale.taksitler || 1) : 0
              return (
                <tr key={sale.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.ürün_adı}</td>
                  <td><span className="badge badge-blue">{sale.ürün_türü}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{customer?.ad || 'Bilinmiyor'}<br/><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{customer?.telefon}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{sale.miktar}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{sale.birim_fiyatı?.toLocaleString('tr-TR')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{(sale.toplam_fiyat || 0).toLocaleString('tr-TR')}</td>
                  <td>{getPaymentStatus(sale)}</td>
                  <td>
                    {sale.ödeme_yöntemi === 'Taksit' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sale.taksitler} ay</span>
                        <span className="text-xs text-emerald-400">₺{monthlyInstallment.toLocaleString('tr-TR')}/ay</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Aktif' : 'Sona Erdi'}</span></td>
                  <td className={daysLeft < 30 ? 'text-red-400' : ''} style={{ color: daysLeft >= 30 ? 'var(--text-secondary)' : undefined }}>
                    {active ? `${daysLeft} gün` : 'Sona erdi'}
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(sale.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      {(sale.kalan_miktar || 0) > 0 && (
                        <button onClick={() => openPaymentModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Taksit Öde">💰</button>
                      )}
                      <button onClick={() => handleDelete(sale)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henüz satış kaydı yok</p>
        </div>
      )}

      {/* YENİ SATIŞ MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Satış</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri</label>
                  <select className="select" value={form.müşteri_kimliği} onChange={(e) => setForm({...form, müşteri_kimliği: e.target.value})}>
                    <option value="">Müşteri seçin...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.ad} - {c.telefon}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stoktan Seç (Opsiyonel)</label>
                  <select className="select" value={form.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                    <option value="">Stoktan seçin...</option>
                    {inventory.map((i: any) => <option key={i.id} value={i.id}>{i.ad} - {i.satış_fiyatı?.toLocaleString('tr-TR')} TL ({i.miktar} adet)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input className="input" value={form.ürün_adı} onChange={(e) => setForm({...form, ürün_adı: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tip</label>
                    <select className="select" value={form.ürün_türü} onChange={(e) => setForm({...form, ürün_türü: e.target.value})}>
                      <option>Cihaz</option>
                      <option>Aksesuar</option>
                      <option>Parça</option>
                      <option>Servis</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adet</label>
                    <input className="input" type="number" min="1" value={form.miktar} onChange={(e) => setForm({...form, miktar: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Birim Fiyat (TL) *</label>
                  <input className="input" type="number" step="0.01" value={form.birim_fiyatı} onChange={(e) => setForm({...form, birim_fiyatı: e.target.value})} required />
                </div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <div className="text-sm" style={{ color: '#4ade80' }}>Hesaplanan Toplam</div>
                  <div className="text-2xl font-bold text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {form.miktar} adet × ₺{parseFloat(form.birim_fiyatı || '0').toLocaleString('tr-TR')} = ₺{calculatedTotal.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="form-group">
                  <label>Ödeme Şekli</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="peşin" checked={form.peşin} onChange={() => setForm({...form, peşin: true, ödeme_yöntemi: 'Nakit'})} />
                      <span>Peşin</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="peşin" checked={!form.peşin} onChange={() => setForm({...form, peşin: false})} />
                      <span>Taksitli/Borç</span>
                    </label>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="select" value={form.ödeme_yöntemi} onChange={(e) => setForm({...form, ödeme_yöntemi: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Kartı</option>
                      <option>Havale</option>
                      <option>Taksit</option>
                      <option>Borç</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Taksit Sayısı</label>
                    <input className="input" type="number" min="1" value={form.taksitler} onChange={(e) => setForm({...form, taksitler: e.target.value})} disabled={form.peşin} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Garanti Süresi (Ay)</label>
                  <input className="input" type="number" min="0" value={form.garanti_ayları} onChange={(e) => setForm({...form, garanti_ayları: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Satış Yap</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLE MODAL */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Satış Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri *</label>
                  <select className="select" value={editForm.müşteri_kimliği} onChange={(e) => setEditForm({...editForm, müşteri_kimliği: e.target.value})} required>
                    <option value="">Seçin</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.ad} {c.telefon ? `(${c.telefon})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={editForm.ürün_adı} onChange={(e) => setEditForm({...editForm, ürün_adı: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Birim Fiyatı (TL)</label><input className="input" type="number" step="0.01" value={editForm.birim_fiyatı} onChange={(e) => setEditForm({...editForm, birim_fiyatı: e.target.value})} /></div>
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" value={editForm.miktar} onChange={(e) => setEditForm({...editForm, miktar: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="select" value={editForm.ödeme_yöntemi} onChange={(e) => setEditForm({...editForm, ödeme_yöntemi: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Kartı</option>
                      <option>Taksit</option>
                      <option>Havale</option>
                      <option>Borç</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taksit Sayısı</label><input className="input" type="number" value={editForm.taksitler} onChange={(e) => setEditForm({...editForm, taksitler: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Kalan Miktar (TL)</label><input className="input" type="number" step="0.01" value={editForm.kalan_miktar} onChange={(e) => setEditForm({...editForm, kalan_miktar: e.target.value})} /></div>
                  <div className="form-group"><label>Garanti (Ay)</label><input className="input" type="number" value={editForm.garanti_ayları} onChange={(e) => setEditForm({...editForm, garanti_ayları: e.target.value})} /></div>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" checked={editForm.peşin} onChange={(e) => setEditForm({...editForm, peşin: e.target.checked})} />
                    <span className="ml-2">Peşin Ödendi</span>
                  </label>
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

      {/* TAKSİT ÖDE MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>💳 Taksit Ödeme</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body space-y-4">
                {(() => {
                  const sale = sales.find(s => s.id === paymentForm.satış_kimliği)
                  const total = sale?.toplam_fiyat || 0
                  const remaining = sale?.kalan_miktar || 0
                  const paid = total - remaining
                  const monthly = total / (sale?.taksitler || 1)
                  return (
                    <>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Ürün</div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale?.ürün_adı}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam</div>
                          <div className="font-bold text-emerald-400">₺{total.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ödenen</div>
                          <div className="font-bold text-blue-400">₺{paid.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan</div>
                          <div className={`font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{remaining.toLocaleString('tr-TR')}</div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Aylık Taksit</div>
                        <div className="font-bold text-yellow-400">₺{monthly.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="form-group">
                        <label>Ödeme Tutarı (TL) *</label>
                        <input className="input" type="number" step="0.01" value={paymentForm.ödeme_miktarı} onChange={(e) => setPaymentForm({...paymentForm, ödeme_miktarı: e.target.value})} placeholder={monthly.toString()} required />
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>💳 Ödemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

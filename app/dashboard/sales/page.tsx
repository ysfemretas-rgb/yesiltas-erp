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
  customer_id: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string
  installments: number
  remaining_amount: number
  warranty_months: number
  warranty_end_date: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface InventoryItem {
  id: string
  name: string
  category: string
  sale_price: number
  quantity: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Satış yapma modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1',
    unit_price: '', payment_method: 'Nakit', installments: '1',
    warranty_months: '12', selected_inventory: ''
  })
  
  // Düzenleme modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '', customer_id: '', item_name: '', unit_price: '', quantity: '1',
    payment_method: 'Nakit', installments: '1', remaining_amount: '',
    warranty_months: '12', created_at: ''
  })
  
  // Taksit ödeme modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ sale_id: '', payment_amount: '' })

  // Anlık toplam hesaplama
  const calculatedTotal = (parseInt(form.quantity) || 1) * (parseFloat(form.unit_price) || 0)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = sales
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(s => s.item_name?.toLowerCase().includes(term))
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
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name'),
      supabase.from('inventory').select('id, name, category, sale_price, quantity').gt('quantity', 0)
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    if (inventoryRes.data) setInventory(inventoryRes.data)
    setLoading(false)
  }

  const handleInventorySelect = (inventoryId: string) => {
    const item = inventory.find(i => i.id === inventoryId)
    if (item) {
      setForm({
        ...form,
        selected_inventory: inventoryId,
        item_name: item.name,
        item_type: item.category === 'Aksesuar' ? 'Aksesuar' : item.category === 'Parca' ? 'Parca' : 'Cihaz',
        unit_price: item.sale_price.toString()
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(form.quantity) || 1
    const price = parseFloat(form.unit_price) || 0
    const total = qty * price
    const installments = parseInt(form.installments) || 1
    const warrantyMonths = parseInt(form.warranty_months) || 12
    const remaining = form.payment_method === 'Taksit' || form.payment_method === 'Borc' ? total : 0

    const warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

    const { data: saleData, error } = await supabase.from('sales').insert([{
      customer_id: form.customer_id || null,
      item_name: form.item_name,
      item_type: form.item_type,
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_method: form.payment_method,
      installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split('T')[0]
    }]).select()

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    // Stok düşür
    if (form.selected_inventory) {
      const item = inventory.find(i => i.id === form.selected_inventory)
      if (item) {
        await supabase.from('inventory').update({ quantity: item.quantity - qty }).eq('id', form.selected_inventory)
      }
    }

    // Kasa kaydı (peşin satışlar için)
    if (remaining === 0) {
      await supabase.from('transactions').insert([{
        type: 'gelir',
        category: 'Satis',
        amount: total,
        description: `${form.item_name} - ${form.payment_method}`,
        related_id: saleData?.[0]?.id,
        related_table: 'sales'
      }])
    }

    // Garanti kaydı
    if (saleData && saleData[0]) {
      await supabase.from('warranties').insert([{
        sale_id: saleData[0].id,
        customer_id: form.customer_id || null,
        customer_name: customers.find(c => c.id === form.customer_id)?.name || '',
        item_name: form.item_name,
        warranty_months: warrantyMonths,
        warranty_end_date: warrantyEnd.toISOString().split('T')[0]
      }])
    }

    // Borç kaydı (taksit/borç satışlar için)
    if (remaining > 0) {
      await supabase.from('debts').insert([{
        müşteri_kimliği: form.customer_id || null,
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
    setForm({ customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1', warranty_months: '12', selected_inventory: '' })
    loadData()
  }

  // DÜZENLEME
  const openEditModal = (sale: Sale) => {
    setEditForm({
      id: sale.id,
      customer_id: sale.customer_id || '',
      item_name: sale.item_name || '',
      unit_price: sale.unit_price?.toString() || '',
      quantity: sale.quantity?.toString() || '1',
      payment_method: sale.payment_method || 'Nakit',
      installments: sale.installments?.toString() || '1',
      remaining_amount: sale.remaining_amount?.toString() || '',
      warranty_months: sale.warranty_months?.toString() || '12',
      created_at: sale.created_at || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const total = parseFloat(editForm.unit_price) * parseInt(editForm.quantity)
      const months = parseInt(editForm.warranty_months) || 12
      
      const startDate = editForm.created_at ? new Date(editForm.created_at) : new Date()
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + months)
      const warrantyEndDate = endDate.toISOString().split('T')[0]

      const { error } = await supabase.from('sales').update({
        customer_id: editForm.customer_id,
        item_name: editForm.item_name.trim(),
        unit_price: parseFloat(editForm.unit_price) || 0,
        quantity: parseInt(editForm.quantity) || 1,
        total_price: total,
        payment_method: editForm.payment_method,
        installments: parseInt(editForm.installments) || 1,
        remaining_amount: parseFloat(editForm.remaining_amount) || 0,
        warranty_months: months,
        warranty_end_date: warrantyEndDate
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

  // TAKSİT ÖDEME
  const openPaymentModal = (sale: Sale) => {
    setPaymentForm({ sale_id: sale.id, payment_amount: '' })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sale = sales.find(s => s.id === paymentForm.sale_id)
      if (!sale) return

      const paymentAmount = parseFloat(paymentForm.payment_amount) || 0
      const newRemaining = Math.max(0, (sale.remaining_amount || 0) - paymentAmount)

      const { error } = await supabase.from('sales').update({
        remaining_amount: newRemaining
      }).eq('id', paymentForm.sale_id)

      if (error) {
        showToast('Hata: ' + error.message, 'error')
      } else {
        await supabase.from('customer_payments').insert([{
          customer_id: sale.customer_id,
          amount: paymentAmount,
          payment_method: sale.payment_method,
          notes: `Taksit ödemesi - ${sale.item_name}`
        }])

        showToast(`₺${paymentAmount.toLocaleString('tr-TR')} ödeme kaydedildi! Kalan: ₺${newRemaining.toLocaleString('tr-TR')}`)
        setShowPaymentModal(false)
        loadData()
      }
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    }
  }

  // SİLME (Stok geri ekleme ile)
  const handleDelete = async (sale: Sale) => {
    if (!confirm('Bu satış kaydını silmek istediğinize emin misiniz?')) return
    try {
      // 1. Stok geri ekle (eğer stoktan düşülmüşse)
      // Önce inventory'de aynı isimde ürün var mı kontrol et
      const { data: invItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('name', sale.item_name)
        .single()

      if (invItem) {
        // Stokta varsa miktarı geri ekle
        await supabase.from('inventory').update({
          quantity: (invItem.quantity || 0) + (sale.quantity || 1)
        }).eq('id', invItem.id)
      }

      // 2. Kasa kaydını sil (varsa)
      await supabase.from('transactions').delete().eq('related_id', sale.id).eq('related_table', 'sales')

      // 3. Garanti kaydını sil
      await supabase.from('warranties').delete().eq('sale_id', sale.id)

      // 4. Borç kaydını sil
      await supabase.from('debts').delete().eq('kaynak_kimliği', sale.id).eq('kaynak_türü', 'satış')

      // 5. Son olarak satışı sil
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
    const total = sale.total_price || 0
    const remaining = sale.remaining_amount || 0
    const paid = total - remaining

    if (remaining <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Peşin</span>
    }
    if (sale.payment_method === 'Taksit' || sale.payment_method === 'Borc') {
      const monthly = total / (sale.installments || 1)
      const paidInstallments = Math.floor(paid / monthly)
      return (
        <div className="flex flex-col gap-1">
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💳 Taksit</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInstallments}/{sale.installments} ödendi</span>
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

      {/* Başlık */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Satış</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">+ Yeni Satış</button>
      </div>

      {/* Arama */}
      <input type="text" className="input" placeholder="Ürün ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Satış Listesi */}
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
              const customer = customers.find(c => c.id === sale.customer_id)
              const active = isWarrantyActive(sale.warranty_end_date)
              const daysLeft = daysUntilExpiry(sale.warranty_end_date)
              const monthlyInstallment = sale.payment_method === 'Taksit' ? (sale.total_price || 0) / (sale.installments || 1) : 0
              return (
                <tr key={sale.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.item_name}</td>
                  <td><span className="badge badge-blue">{sale.item_type}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{customer?.name || 'Bilinmiyor'}<br/><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{customer?.phone}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{sale.quantity}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{sale.unit_price?.toLocaleString('tr-TR')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{(sale.total_price || 0).toLocaleString('tr-TR')}</td>
                  <td>{getPaymentStatus(sale)}</td>
                  <td>
                    {sale.payment_method === 'Taksit' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sale.installments} ay</span>
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
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      {(sale.remaining_amount || 0) > 0 && (
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
                  <select className="select" value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}>
                    <option value="">Müşteri seçin...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stoktan Seç (Opsiyonel)</label>
                  <select className="select" value={form.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                    <option value="">Stoktan seçin...</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} - {i.sale_price?.toLocaleString('tr-TR')} TL ({i.quantity} adet)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input className="input" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tip</label>
                    <select className="select" value={form.item_type} onChange={(e) => setForm({...form, item_type: e.target.value})}>
                      <option>Cihaz</option>
                      <option>Aksesuar</option>
                      <option>Parça</option>
                      <option>Servis</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adet</label>
                    <input className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Birim Fiyat (TL) *</label>
                  <input className="input" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} required />
                </div>
                {/* Anlık Toplam */}
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <div className="text-sm" style={{ color: '#4ade80' }}>Hesaplanan Toplam</div>
                  <div className="text-2xl font-bold text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {form.quantity} adet × ₺{parseFloat(form.unit_price || '0').toLocaleString('tr-TR')} = ₺{calculatedTotal.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="select" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Kartı</option>
                      <option>Havale</option>
                      <option>Taksit</option>
                      <option>Borç</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Taksit Sayısı</label>
                    <input className="input" type="number" min="1" value={form.installments} onChange={(e) => setForm({...form, installments: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Garanti Süresi (Ay)</label>
                  <input className="input" type="number" min="0" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} />
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
                  <select className="select" value={editForm.customer_id} onChange={(e) => setEditForm({...editForm, customer_id: e.target.value})} required>
                    <option value="">Seçin</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={editForm.item_name} onChange={(e) => setEditForm({...editForm, item_name: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Birim Fiyatı (TL)</label><input className="input" type="number" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})} /></div>
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="select" value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Kartı</option>
                      <option>Taksit</option>
                      <option>Havale</option>
                      <option>Borç</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taksit Sayısı</label><input className="input" type="number" value={editForm.installments} onChange={(e) => setEditForm({...editForm, installments: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Kalan Miktar (TL)</label><input className="input" type="number" step="0.01" value={editForm.remaining_amount} onChange={(e) => setEditForm({...editForm, remaining_amount: e.target.value})} /></div>
                  <div className="form-group"><label>Garanti (Ay)</label><input className="input" type="number" value={editForm.warranty_months} onChange={(e) => setEditForm({...editForm, warranty_months: e.target.value})} /></div>
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
                  const sale = sales.find(s => s.id === paymentForm.sale_id)
                  const total = sale?.total_price || 0
                  const remaining = sale?.remaining_amount || 0
                  const paid = total - remaining
                  const monthly = total / (sale?.installments || 1)
                  return (
                    <>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Ürün</div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale?.item_name}</div>
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
                        <input className="input" type="number" step="0.01" value={paymentForm.payment_amount} onChange={(e) => setPaymentForm({...paymentForm, payment_amount: e.target.value})} placeholder={monthly.toString()} required />
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
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1',
    unit_price: '', payment_method: 'Nakit', installments: '1',
    warranty_months: '12', selected_inventory: ''
  })

  // Anlık toplam hesaplama
  const calculatedTotal = (parseInt(form.quantity) || 1) * (parseFloat(form.unit_price) || 0)

  useEffect(() => { loadData() }, [])

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

    // Constraint'e uygun payment_method değeri
    const dbPaymentMethod = form.payment_method === 'Kredi Karti' ? 'Kredi' : form.payment_method
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
      payment_method: dbPaymentMethod,
      installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split('T')[0]
    }]).select()

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    // Auto stock deduction
    if (form.selected_inventory) {
      const item = inventory.find(i => i.id === form.selected_inventory)
      if (item) {
        await supabase.from('inventory').update({ quantity: item.quantity - qty }).eq('id', form.selected_inventory)
      }
    }

    // Auto cash register for non-debt sales
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

    // Create warranty record
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

    // Create debt record for installment/debt sales
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

    showToast('Satis kaydedildi')
    setShowModal(false)
    setForm({ customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1', warranty_months: '12', selected_inventory: '' })
    loadData()
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
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Satis (POS)</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">Yeni Satis</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Urun</th>
              <th>Tip</th>
              <th>Musteri</th>
              <th>Adet</th>
              <th>Birim Fiyat</th>
              <th>Toplam</th>
              <th>Odeme</th>
              <th>Garanti</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const customer = customers.find(c => c.id === sale.customer_id)
              return (
                <tr key={sale.id}>
                  <td className="font-medium text-white">{sale.item_name}</td>
                  <td><span className="badge badge-blue">{sale.item_type}</span></td>
                  <td className="text-slate-300">{customer?.name || 'Bilinmiyor'}</td>
                  <td className="text-slate-300">{sale.quantity}</td>
                  <td className="text-slate-300">{sale.unit_price?.toLocaleString('tr-TR')} TL</td>
                  <td className="text-slate-300">{sale.total_price?.toLocaleString('tr-TR')} TL</td>
                  <td>
                    {sale.payment_method}
                    {sale.remaining_amount > 0 && <div className="text-xs text-red-400">Kalan: {sale.remaining_amount?.toLocaleString('tr-TR')} TL</div>}
                  </td>
                  <td className="text-slate-300">{sale.warranty_months} ay</td>
                  <td className="text-slate-400 text-sm">{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && (
        <div className="empty-state">
          <p>Henuz satis kaydi yok</p>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Satis</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri</label>
                  <select className="select" value={form.customer_id} onChange={(e) => setForm({...form, customer_id: e.target.value})}>
                    <option value="">Musteri secin...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stoktan Sec (Opsiyonel)</label>
                  <select className="select" value={form.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                    <option value="">Stoktan secin...</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} - {i.sale_price?.toLocaleString('tr-TR')} TL ({i.quantity} adet)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Urun Adi *</label>
                  <input className="input" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tip</label>
                    <select className="select" value={form.item_type} onChange={(e) => setForm({...form, item_type: e.target.value})}>
                      <option>Cihaz</option>
                      <option>Aksesuar</option>
                      <option>Parca</option>
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
                {/* Anlık Toplam Gösterimi */}
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <div className="text-sm" style={{ color: '#4ade80' }}>Hesaplanan Toplam</div>
                  <div className="text-2xl font-bold text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {form.quantity} adet × ₺{parseFloat(form.unit_price || '0').toLocaleString('tr-TR')} = ₺{calculatedTotal.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Odeme Yontemi</label>
                    <select className="select" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Karti</option>
                      <option>Havale</option>
                      <option>Taksit</option>
                      <option>Borc</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Taksit Sayisi</label>
                    <input className="input" type="number" min="1" value={form.installments} onChange={(e) => setForm({...form, installments: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Garanti Suresi (Ay)</label>
                  <input className="input" type="number" min="0" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Satis Yap</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
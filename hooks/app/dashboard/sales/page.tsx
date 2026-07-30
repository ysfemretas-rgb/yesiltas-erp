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

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'sales' | 'sold'>('sales')

  const [form, setForm] = useState({
    customer_id: '', customer_name: '', item_name: '', item_type: 'Cihaz',
    quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1',
    warranty_months: '12', selected_inventory: '', cash: true
  })

  const [editForm, setEditForm] = useState({
    id: '', customer_id: '', customer_name: '', item_name: '', item_type: 'Cihaz',
    quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1',
    remaining_amount: '', warranty_months: '12', cash: true
  })

  const [paymentForm, setPaymentForm] = useState({ sale_id: '', payment_amount: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: salesData }, { data: customersData }, { data: inventoryData }] = await Promise.all([
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name'),
      supabase.from('inventory').select('id, name, quantity, unit_price')
    ])
    if (salesData) setSales(salesData)
    if (customersData) setCustomers(customersData)
    if (inventoryData) setInventory(inventoryData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const qty = parseInt(form.quantity) || 1
      const price = parseFloat(form.unit_price) || 0
      const total = qty * price
      const installments = parseInt(form.installments) || 1
      const warrantyMonths = parseInt(form.warranty_months) || 12
      const cash = form.cash
      const remaining = !cash ? total : 0

      const warrantyEnd = new Date()
      warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

      const { data: saleData, error } = await supabase.from('sales').insert([{
        customer_id: form.customer_id || null,
        customer_name: form.customer_name,
        item_name: form.item_name,
        item_type: form.item_type,
        quantity: qty,
        unit_price: price,
        total_price: total,
        payment_method: form.payment_method,
        installments,
        remaining_amount: remaining,
        warranty_months: warrantyMonths,
        warranty_end_date: warrantyEnd.toISOString().split('T')[0],
        cash
      }]).select()

      if (error) throw error

      if (form.selected_inventory) {
        const inv = inventory.find(i => i.id === form.selected_inventory)
        if (inv) {
          const newQty = inv.quantity - qty
          if (newQty >= 0) {
            await supabase.from('inventory').update({ quantity: newQty }).eq('id', form.selected_inventory)
          }
        }
      }

      if (cash) {
        await supabase.from('transactions').insert([{
          type: 'income',
          category: 'Satış',
          amount: total,
          description: `${form.customer_name} - ${form.item_name}`,
          date: new Date().toISOString().split('T')[0]
        }])
      } else {
        await supabase.from('debts').insert([{
          customer_id: form.customer_id || null,
          customer_name: form.customer_name,
          amount: total,
          remaining: remaining,
          installments,
          paid_installments: 0,
          sale_id: saleData?.[0]?.id,
          type: 'sale'
        }])
      }

      await supabase.from('warranties').insert([{
        sale_id: saleData?.[0]?.id,
        customer_name: form.customer_name,
        item_name: form.item_name,
        warranty_months: warrantyMonths,
        warranty_end_date: warrantyEnd.toISOString().split('T')[0],
        status: 'Aktif'
      }])

      setToast({ message: 'Satış başarıyla eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({
        customer_id: '', customer_name: '', item_name: '', item_type: 'Cihaz',
        quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1',
        warranty_months: '12', selected_inventory: '', cash: true
      })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (sale: any) => {
    setEditForm({
      id: sale.id,
      customer_id: sale.customer_id || '',
      customer_name: sale.customer_name || '',
      item_name: sale.item_name || '',
      item_type: sale.item_type || 'Cihaz',
      quantity: sale.quantity?.toString() || '1',
      unit_price: sale.unit_price?.toString() || '',
      payment_method: sale.payment_method || 'Nakit',
      installments: sale.installments?.toString() || '1',
      remaining_amount: sale.remaining_amount?.toString() || '',
      warranty_months: sale.warranty_months?.toString() || '12',
      cash: sale.cash ?? true
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const qty = parseInt(editForm.quantity) || 1
      const price = parseFloat(editForm.unit_price) || 0
      const total = qty * price
      const installments = parseInt(editForm.installments) || 1
      const warrantyMonths = parseInt(editForm.warranty_months) || 12
      const cash = editForm.cash
      const remaining = !cash ? total : 0

      const warrantyEnd = new Date()
      warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

      const { error } = await supabase.from('sales').update({
        customer_id: editForm.customer_id || null,
        customer_name: editForm.customer_name,
        item_name: editForm.item_name,
        item_type: editForm.item_type,
        quantity: qty,
        unit_price: price,
        total_price: total,
        payment_method: editForm.payment_method,
        installments,
        remaining_amount: remaining,
        warranty_months: warrantyMonths,
        warranty_end_date: warrantyEnd.toISOString().split('T')[0],
        cash
      }).eq('id', editForm.id)

      if (error) throw error
      setToast({ message: 'Satış güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'Satış silindi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openPaymentModal = (sale: any) => {
    setPaymentForm({ sale_id: sale.id, payment_amount: sale.remaining_amount?.toString() || '' })
    setShowPaymentModal(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const amount = parseFloat(paymentForm.payment_amount) || 0
      if (amount <= 0) {
        setToast({ message: 'Geçerli bir tutar girin', type: 'error' })
        return
      }

      const sale = sales.find(s => s.id === paymentForm.sale_id)
      if (!sale) return

      const newRemaining = Math.max(0, (sale.remaining_amount || 0) - amount)

      const { error: transError } = await supabase.from('transactions').insert([{
        type: 'income',
        category: 'Taksit Ödeme',
        amount: amount,
        description: `${sale.customer_name} - ${sale.item_name} taksit ödemesi`,
        date: new Date().toISOString().split('T')[0]
      }])

      if (transError) throw transError

      const { error: updateError } = await supabase.from('sales').update({
        remaining_amount: newRemaining
      }).eq('id', paymentForm.sale_id)

      if (updateError) throw updateError

      const { data: debtData } = await supabase.from('debts').select('*').eq('sale_id', paymentForm.sale_id).single()
      if (debtData) {
        const paidInst = (debtData.paid_installments || 0) + 1
        await supabase.from('debts').update({
          remaining: newRemaining,
          paid_installments: paidInst
        }).eq('id', debtData.id)
      }

      setToast({ message: 'Ödeme alındı ve kasaya kaydedildi!', type: 'success' })
      setShowPaymentModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setForm(prev => ({ ...prev, customer_id: customerId, customer_name: customer.name }))
    }
  }

  const handleInventorySelect = (inventoryId: string) => {
    const inv = inventory.find(i => i.id === inventoryId)
    if (inv) {
      setForm(prev => ({ ...prev, selected_inventory: inventoryId, item_name: inv.name, unit_price: inv.unit_price?.toString() || '' }))
    }
  }

  const filtered = sales.filter(s =>
    s.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const displayData = activeTab === 'sales' ? filtered : filtered.filter(s => s.item_type === 'Cihaz')

  if (loading && sales.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Satış & Satılan Cihazlar</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni Satış</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('sales')} className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}>Tüm Satışlar</button>
        <button onClick={() => setActiveTab('sold')} className={`btn btn-sm ${activeTab === 'sold' ? 'btn-primary' : 'btn-secondary'}`}>Satılan Cihazlar</button>
      </div>

      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tarih</th><th>Müşteri</th><th>Ürün</th><th>Tür</th><th>Adet</th>
              <th>Fiyat</th><th>Toplam</th><th>Ödeme</th><th>Kalan</th><th>Garanti</th><th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="font-medium">{sale.customer_name}</td>
                <td>{sale.item_name}</td>
                <td>{sale.item_type}</td>
                <td>{sale.quantity}</td>
                <td>₺{sale.unit_price?.toLocaleString('tr-TR')}</td>
                <td className="font-medium">₺{sale.total_price?.toLocaleString('tr-TR')}</td>
                <td>
                  <span className={`badge ${sale.cash ? 'badge-green' : 'badge-yellow'}`}>
                    {sale.cash ? 'Peşin' : `Taksit (${sale.installments})`}
                  </span>
                </td>
                <td>
                  {sale.remaining_amount > 0 ? (
                    <span className="text-red-400 font-medium">₺{sale.remaining_amount?.toLocaleString('tr-TR')}</span>
                  ) : (
                    <span className="text-emerald-400">Ödendi</span>
                  )}
                </td>
                <td>{sale.warranty_months} ay</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(sale)} className="btn btn-sm btn-secondary">Düzenle</button>
                    {sale.remaining_amount > 0 && (
                      <button onClick={() => openPaymentModal(sale)} className="btn btn-sm btn-primary">Ödeme Al</button>
                    )}
                    <button onClick={() => handleDelete(sale.id)} className="btn btn-sm btn-danger">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {displayData.length === 0 && <div className="empty-state"><p>Satış bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Satış Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Müşteri Seç</label>
                    <select className="input" value={form.customer_id} onChange={(e) => handleCustomerSelect(e.target.value)}>
                      <option value="">Seçin</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Müşteri Adı *</label>
                    <input className="input" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Stoktan Seç</label>
                    <select className="input" value={form.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                      <option value="">Seçin</option>
                      {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} adet)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ürün Adı *</label>
                    <input className="input" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Ürün Türü</label>
                    <select className="input" value={form.item_type} onChange={(e) => setForm({...form, item_type: e.target.value})}>
                      <option value="Cihaz">Cihaz</option>
                      <option value="Aksesuar">Aksesuar</option>
                      <option value="Yedek Parça">Yedek Parça</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adet</label>
                    <input className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Birim Fiyat *</label>
                    <input className="input" type="number" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Ödeme Şekli</label>
                    <select className="input" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})}>
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale">Havale</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Peşin / Taksitli</label>
                    <select className="input" value={form.cash ? 'pesin' : 'taksitli'} onChange={(e) => setForm({...form, cash: e.target.value === 'pesin'})}>
                      <option value="pesin">Peşin</option>
                      <option value="taksitli">Taksitli</option>
                    </select>
                  </div>
                  {!form.cash && (
                    <div className="form-group">
                      <label>Taksit Sayısı</label>
                      <input className="input" type="number" min="2" value={form.installments} onChange={(e) => setForm({...form, installments: e.target.value})} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Garanti (Ay)</label>
                    <input className="input" type="number" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} />
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Toplam: ₺{(parseInt(form.quantity || '0') * parseFloat(form.unit_price || '0')).toLocaleString('tr-TR')}
                  </div>
                  {!form.cash && (
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Aylık Taksit: ₺{((parseInt(form.quantity || '0') * parseFloat(form.unit_price || '0')) / (parseInt(form.installments) || 1)).toLocaleString('tr-TR')}
                    </div>
                  )}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Satış Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Müşteri Adı *</label>
                    <input className="input" value={editForm.customer_name} onChange={(e) => setEditForm({...editForm, customer_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Ürün Adı *</label>
                    <input className="input" value={editForm.item_name} onChange={(e) => setEditForm({...editForm, item_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Ürün Türü</label>
                    <select className="input" value={editForm.item_type} onChange={(e) => setEditForm({...editForm, item_type: e.target.value})}>
                      <option value="Cihaz">Cihaz</option>
                      <option value="Aksesuar">Aksesuar</option>
                      <option value="Yedek Parça">Yedek Parça</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adet</label>
                    <input className="input" type="number" min="1" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Birim Fiyat *</label>
                    <input className="input" type="number" value={editForm.unit_price} onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Ödeme Şekli</label>
                    <select className="input" value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}>
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Havale">Havale</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Peşin / Taksitli</label>
                    <select className="input" value={editForm.cash ? 'pesin' : 'taksitli'} onChange={(e) => setEditForm({...editForm, cash: e.target.value === 'pesin'})}>
                      <option value="pesin">Peşin</option>
                      <option value="taksitli">Taksitli</option>
                    </select>
                  </div>
                  {!editForm.cash && (
                    <div className="form-group">
                      <label>Taksit Sayısı</label>
                      <input className="input" type="number" min="2" value={editForm.installments} onChange={(e) => setEditForm({...editForm, installments: e.target.value})} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Garanti (Ay)</label>
                    <input className="input" type="number" value={editForm.warranty_months} onChange={(e) => setEditForm({...editForm, warranty_months: e.target.value})} />
                  </div>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Taksit Ödeme Al</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ödeme Tutarı</label>
                  <input className="input" type="number" value={paymentForm.payment_amount} onChange={(e) => setPaymentForm({...paymentForm, payment_amount: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Ödeme Al</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

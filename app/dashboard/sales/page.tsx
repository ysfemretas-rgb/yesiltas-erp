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
  peşin: boolean
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

interface Device {
  id: string
  customer_id: string
  brand: string
  model: string
  imei: string
  issue: string
  price: number
  paid_amount: number
  status: string
  technician: string
  created_at: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [saleForm, setSaleForm] = useState({
    customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1',
    unit_price: '', payment_method: 'Nakit', installments: '1',
    warranty_months: '12', selected_inventory: '', peşin: true
  })

  const [deviceForm, setDeviceForm] = useState({
    customer_id: '', brand: '', model: '', imei: '', issue: '', price: '', status: 'Beklemede', technician: ''
  })

  const [paymentForm, setPaymentForm] = useState({ sale_id: '', amount: '' })
  const [editForm, setEditForm] = useState<any>(null)

  const calculatedTotal = (parseInt(saleForm.quantity) || 1) * (parseFloat(saleForm.unit_price) || 0)

  useEffect(() => { loadData() }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [salesRes, devicesRes, customersRes, inventoryRes] = await Promise.all([
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('devices').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name'),
      supabase.from('inventory').select('id, name, category, sale_price, quantity').gt('quantity', 0)
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (devicesRes.data) setDevices(devicesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    if (inventoryRes.data) setInventory(inventoryRes.data)
    setLoading(false)
  }

  const handleInventorySelect = (inventoryId: string) => {
    const item = inventory.find(i => i.id === inventoryId)
    if (item) {
      setSaleForm({
        ...saleForm,
        selected_inventory: inventoryId,
        item_name: item.name,
        item_type: item.category === 'Aksesuar' ? 'Aksesuar' : item.category === 'Parca' ? 'Parca' : 'Cihaz',
        unit_price: item.sale_price.toString()
      })
    }
  }

  // =====================
  // SATIŞ EKLE
  // =====================
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(saleForm.quantity) || 1
    const price = parseFloat(saleForm.unit_price) || 0
    const total = qty * price
    const installments = parseInt(saleForm.installments) || 1
    const warrantyMonths = parseInt(saleForm.warranty_months) || 12
    const peşin = saleForm.peşin
    const remaining = !peşin ? total : 0

    const warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)

    const { data: saleData, error } = await supabase.from('sales').insert([{
      customer_id: saleForm.customer_id || null,
      item_name: saleForm.item_name,
      item_type: saleForm.item_type,
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_method: saleForm.payment_method,
      installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEnd.toISOString().split('T')[0],
      peşin
    }]).select()

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    // Stok düş
    if (saleForm.selected_inventory) {
      const item = inventory.find(i => i.id === saleForm.selected_inventory)
      if (item) {
        await supabase.from('inventory').update({ quantity: item.quantity - qty }).eq('id', saleForm.selected_inventory)
      }
    }

    // Peşin ise kasaya kaydet
    if (peşin) {
      await supabase.from('transactions').insert([{
        type: 'gelir',
        category: 'Satis',
        amount: total,
        description: `${saleForm.item_name} - ${saleForm.payment_method} (Pesin)`,
        related_id: saleData?.[0]?.id,
        related_table: 'sales'
      }])
    }

    // Garanti kaydı
    if (saleData && saleData[0]) {
      await supabase.from('warranties').insert([{
        sale_id: saleData[0].id,
        customer_id: saleForm.customer_id || null,
        customer_name: customers.find(c => c.id === saleForm.customer_id)?.name || '',
        item_name: saleForm.item_name,
        warranty_months: warrantyMonths,
        warranty_end_date: warrantyEnd.toISOString().split('T')[0]
      }])
    }

    // Taksitli ise debts kaydı
    if (!peşin && remaining > 0) {
      await supabase.from('debts').insert([{
        customer_id: saleForm.customer_id || null,
        source_type: 'sale',
        source_id: saleData?.[0]?.id,
        total_amount: total,
        paid_amount: 0,
        remaining_amount: remaining,
        status: 'Beklemede',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
    }

    showToast('Satis kaydedildi!')
    setShowSaleModal(false)
    setSaleForm({ customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1', warranty_months: '12', selected_inventory: '', peşin: true })
    loadData()
  }

  // =====================
  // CİHAZ EKLE (Teknik Servis)
  // =====================
  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('devices').insert([{
      customer_id: deviceForm.customer_id,
      brand: deviceForm.brand.trim(),
      model: deviceForm.model.trim(),
      imei: deviceForm.imei.trim() || null,
      issue: deviceForm.issue.trim(),
      price: parseFloat(deviceForm.price) || 0,
      status: deviceForm.status,
      technician: deviceForm.technician.trim() || null,
      paid_amount: 0
    }])
    if (error) {
      showToast('Hata: ' + error.message, 'error')
    } else {
      showToast('Cihaz kaydi eklendi!')
      setShowDeviceModal(false)
      setDeviceForm({ customer_id: '', brand: '', model: '', imei: '', issue: '', price: '', status: 'Beklemede', technician: '' })
      loadData()
    }
  }

  // =====================
  // TAKSİT ÖDEME
  // =====================
  const openPaymentModal = (sale: Sale) => {
    setPaymentForm({ sale_id: sale.id, amount: '' })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sale = sales.find(s => s.id === paymentForm.sale_id)
    if (!sale) return

    const paymentAmount = parseFloat(paymentForm.amount) || 0
    const newRemaining = Math.max(0, (sale.remaining_amount || 0) - paymentAmount)

    const { error } = await supabase.from('sales').update({
      remaining_amount: newRemaining
    }).eq('id', paymentForm.sale_id)

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    // Debts güncelle
    const { data: existingDebts } = await supabase
      .from('debts')
      .select('*')
      .eq('source_id', paymentForm.sale_id)
      .eq('source_type', 'sale')

    if (existingDebts && existingDebts.length > 0) {
      const debt = existingDebts[0]
      const newPaid = (debt.paid_amount || 0) + paymentAmount
      const newRemainingDebt = Math.max(0, (debt.remaining_amount || 0) - paymentAmount)

      await supabase.from('debts').update({
        paid_amount: newPaid,
        remaining_amount: newRemainingDebt,
        status: newRemainingDebt <= 0 ? 'Odendi' : 'Beklemede'
      }).eq('id', debt.id)
    }

    // Kasa kaydı
    await supabase.from('transactions').insert([{
      type: 'gelir',
      category: 'Taksit Odemesi',
      amount: paymentAmount,
      description: `${sale.item_name} - Taksit Odemesi`,
      related_id: sale.id,
      related_table: 'sales'
    }])

    // Customer payments
    await supabase.from('customer_payments').insert([{
      customer_id: sale.customer_id,
      amount: paymentAmount,
      payment_method: sale.payment_method,
      notes: `Taksit odemesi - ${sale.item_name}`
    }])

    showToast(`₺${paymentAmount.toLocaleString('tr-TR')} odeme kaydedildi! Kalan: ₺${newRemaining.toLocaleString('tr-TR')}`)
    setShowPaymentModal(false)
    loadData()
  }

  // =====================
  // DÜZENLE
  // =====================
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
      peşin: sale.peşin || false
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const total = parseFloat(editForm.unit_price) * parseInt(editForm.quantity)
    const months = parseInt(editForm.warranty_months) || 12
    const warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + months)

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
      warranty_end_date: warrantyEnd.toISOString().split('T')[0],
      peşin: editForm.peşin
    }).eq('id', editForm.id)

    if (error) {
      showToast('Hata: ' + error.message, 'error')
    } else {
      showToast('Satis kaydi guncellendi!')
      setShowEditModal(false)
      loadData()
    }
  }

  // =====================
  // SİL
  // =====================
  const handleDelete = async (sale: Sale) => {
    if (!confirm('Bu satis kaydini silmek istediginize emin misiniz?')) return

    // Stok geri ekle
    const { data: invItems } = await supabase.from('inventory').select('*').eq('name', sale.item_name)
    if (invItems && invItems.length > 0) {
      await supabase.from('inventory').update({
        quantity: (invItems[0].quantity || 0) + (sale.quantity || 1)
      }).eq('id', invItems[0].id)
    }

    await supabase.from('transactions').delete().eq('related_id', sale.id).eq('related_table', 'sales')
    await supabase.from('warranties').delete().eq('sale_id', sale.id)
    await supabase.from('debts').delete().eq('source_id', sale.id).eq('source_type', 'sale')

    const { error } = await supabase.from('sales').delete().eq('id', sale.id)
    if (error) {
      showToast('Hata: ' + error.message, 'error')
    } else {
      showToast('Satis kaydi silindi! Stok geri eklendi.')
      loadData()
    }
  }

  const isWarrantyActive = (endDate: string) => endDate ? new Date(endDate) > new Date() : false
  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return 0
    return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  const getPaymentStatus = (sale: Sale) => {
    if (sale.peşin || (sale.remaining_amount || 0) <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Pesin</span>
    }
    const total = sale.total_price || 0
    const remaining = sale.remaining_amount || 0
    const paid = total - remaining
    const monthly = total / (sale.installments || 1)
    const paidInstallments = Math.floor(paid / monthly)
    return (
      <div className="flex flex-col gap-1">
        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💳 Taksit</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInstallments}/{sale.installments} odendi</span>
        <span className="text-xs text-red-400">Kalan: ₺{remaining.toLocaleString('tr-TR')}</span>
      </div>
    )
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
        <div className="flex gap-2">
          <button onClick={() => setShowDeviceModal(true)} className="btn btn-secondary btn-sm">+ Servis Cihazi</button>
          <button onClick={() => setShowSaleModal(true)} className="btn btn-primary btn-sm">+ Yeni Satis</button>
        </div>
      </div>

      <input type="text" className="input" placeholder="Urun ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* SATIŞLAR TABLOSU */}
      <h2 className="text-lg font-semibold text-white mt-6">📦 Satislar</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Urun</th><th>Tip</th><th>Musteri</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th><th>Odeme</th><th>Taksit</th><th>Garanti</th><th>Kalan Sure</th><th>Tarih</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {sales.filter(s => !search || s.item_name?.toLowerCase().includes(search.toLowerCase())).map((sale) => {
              const customer = customers.find(c => c.id === sale.customer_id)
              const active = isWarrantyActive(sale.warranty_end_date)
              const daysLeft = daysUntilExpiry(sale.warranty_end_date)
              const monthlyInstallment = sale.payment_method === 'Taksit' ? (sale.total_price || 0) / (sale.installments || 1) : 0
              return (
                <tr key={sale.id}>
                  <td className="font-medium text-white">{sale.item_name}</td>
                  <td><span className="badge badge-blue">{sale.item_type}</span></td>
                  <td className="text-slate-300">{customer?.name || 'Bilinmiyor'}<br/><span className="text-xs text-slate-500">{customer?.phone}</span></td>
                  <td className="text-slate-300">{sale.quantity}</td>
                  <td className="text-slate-300">₺{sale.unit_price?.toLocaleString('tr-TR')}</td>
                  <td className="text-slate-300">₺{(sale.total_price || 0).toLocaleString('tr-TR')}</td>
                  <td>{getPaymentStatus(sale)}</td>
                  <td>
                    {sale.payment_method === 'Taksit' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{sale.installments} ay</span>
                        <span className="text-xs text-emerald-400">₺{monthlyInstallment.toLocaleString('tr-TR')}/ay</span>
                      </div>
                    ) : <span className="text-xs text-slate-500">-</span>}
                  </td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Aktif' : 'Sona Erdi'}</span></td>
                  <td className={daysLeft < 30 ? 'text-red-400' : 'text-slate-300'}>{active ? `${daysLeft} gun` : 'Sona erdi'}</td>
                  <td className="text-slate-400 text-sm">{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      {(sale.remaining_amount || 0) > 0 && (
                        <button onClick={() => openPaymentModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Taksit Ode">💰</button>
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

      {/* TEKNİK SERVİS CİHAZLARI TABLOSU */}
      <h2 className="text-lg font-semibold text-white mt-6">🔧 Teknik Servis Cihazlari</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Musteri</th><th>Cihaz</th><th>IMEI</th><th>Sorun</th><th>Ucret</th><th>Odenen</th><th>Kalan</th><th>Teknisyen</th><th>Durum</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {devices.filter(d => !search || (d.brand + ' ' + d.model)?.toLowerCase().includes(search.toLowerCase())).map((d) => {
              const customer = customers.find(c => c.id === d.customer_id)
              const remaining = (d.price || 0) - (d.paid_amount || 0)
              return (
                <tr key={d.id}>
                  <td className="text-slate-400 text-sm whitespace-nowrap">{new Date(d.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="font-medium text-white">{customer?.name || '-'}</td>
                  <td className="text-slate-300">{d.brand} {d.model}</td>
                  <td className="text-slate-500 text-sm">{d.imei || '-'}</td>
                  <td className="text-slate-300 max-w-[200px] truncate">{d.issue}</td>
                  <td className="text-emerald-400">₺{(d.price || 0).toLocaleString('tr-TR')}</td>
                  <td className="text-emerald-400">₺{(d.paid_amount || 0).toLocaleString('tr-TR')}</td>
                  <td className={remaining > 0 ? 'text-red-400' : 'text-emerald-400'}>₺{remaining.toLocaleString('tr-TR')}</td>
                  <td className="text-slate-500">{d.technician || '-'}</td>
                  <td>
                    <span className={`badge ${d.status === 'Tamamlandi' ? 'badge-green' : d.status === 'Islemde' ? 'badge-yellow' : 'badge-blue'}`}>{d.status}</span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => handleDeleteDevice(d.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && devices.length === 0 && (
        <div className="empty-state"><p>Henüz kayit yok</p></div>
      )}

      {/* YENİ SATIŞ MODAL */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Satis</h2>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri</label>
                  <select className="select" value={saleForm.customer_id} onChange={(e) => setSaleForm({...saleForm, customer_id: e.target.value})}>
                    <option value="">Musteri secin...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stoktan Sec (Opsiyonel)</label>
                  <select className="select" value={saleForm.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                    <option value="">Stoktan secin...</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} - {i.sale_price?.toLocaleString('tr-TR')} TL ({i.quantity} adet)</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Urun Adi *</label><input className="input" value={saleForm.item_name} onChange={(e) => setSaleForm({...saleForm, item_name: e.target.value})} required /></div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tip</label>
                    <select className="select" value={saleForm.item_type} onChange={(e) => setSaleForm({...saleForm, item_type: e.target.value})}>
                      <option>Cihaz</option><option>Aksesuar</option><option>Parca</option><option>Servis</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Adet</label><input className="input" type="number" min="1" value={saleForm.quantity} onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})} required /></div>
                </div>
                <div className="form-group"><label>Birim Fiyat (TL) *</label><input className="input" type="number" step="0.01" value={saleForm.unit_price} onChange={(e) => setSaleForm({...saleForm, unit_price: e.target.value})} required /></div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <div className="text-sm text-emerald-400">Hesaplanan Toplam</div>
                  <div className="text-2xl font-bold text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div className="form-group">
                  <label>Odeme Sekli</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="pesin" checked={saleForm.peşin} onChange={() => setSaleForm({...saleForm, peşin: true, payment_method: 'Nakit'})} />
                      <span>Pesin</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="pesin" checked={!saleForm.peşin} onChange={() => setSaleForm({...saleForm, peşin: false})} />
                      <span>Taksitli/Borc</span>
                    </label>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Odeme Yontemi</label>
                    <select className="select" value={saleForm.payment_method} onChange={(e) => setSaleForm({...saleForm, payment_method: e.target.value})}>
                      <option>Nakit</option><option>Kredi Karti</option><option>Havale</option><option>Taksit</option><option>Borc</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taksit Sayisi</label><input className="input" type="number" min="1" value={saleForm.installments} onChange={(e) => setSaleForm({...saleForm, installments: e.target.value})} disabled={saleForm.peşin} /></div>
                </div>
                <div className="form-group"><label>Garanti Suresi (Ay)</label><input className="input" type="number" min="0" value={saleForm.warranty_months} onChange={(e) => setSaleForm({...saleForm, warranty_months: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSaleModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Satis Yap</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVİS CİHAZI MODAL */}
      {showDeviceModal && (
        <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Servis Cihazi</h2>
              <button onClick={() => setShowDeviceModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleDeviceSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri *</label>
                  <select className="select" value={deviceForm.customer_id} onChange={(e) => setDeviceForm({...deviceForm, customer_id: e.target.value})} required>
                    <option value="">Secin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Marka *</label><input className="input" value={deviceForm.brand} onChange={(e) => setDeviceForm({...deviceForm, brand: e.target.value})} required /></div>
                <div className="form-group"><label>Model *</label><input className="input" value={deviceForm.model} onChange={(e) => setDeviceForm({...deviceForm, model: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={deviceForm.imei} onChange={(e) => setDeviceForm({...deviceForm, imei: e.target.value})} /></div>
                <div className="form-group"><label>Sorun *</label><textarea className="input" rows={2} value={deviceForm.issue} onChange={(e) => setDeviceForm({...deviceForm, issue: e.target.value})} required /></div>
                <div className="form-group"><label>Ucret (TL)</label><input className="input" type="number" step="0.01" value={deviceForm.price} onChange={(e) => setDeviceForm({...deviceForm, price: e.target.value})} /></div>
                <div className="form-group"><label>Teknisyen</label><input className="input" value={deviceForm.technician} onChange={(e) => setDeviceForm({...deviceForm, technician: e.target.value})} /></div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={deviceForm.status} onChange={(e) => setDeviceForm({...deviceForm, status: e.target.value})}>
                    <option>Beklemede</option><option>Islemde</option><option>Tamamlandi</option><option>Teslim Edildi</option><option>Iptal</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDeviceModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAKSİT ÖDEME MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">💳 Taksit Odeme</h2>
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
                      <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
                        <div className="text-sm text-slate-500">Urun</div>
                        <div className="font-medium text-white">{sale?.item_name}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg text-center bg-[#1e293b] border border-[#334155]">
                          <div className="text-xs text-slate-500">Toplam</div>
                          <div className="font-bold text-emerald-400">₺{total.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center bg-[#1e293b] border border-[#334155]">
                          <div className="text-xs text-slate-500">Odenen</div>
                          <div className="font-bold text-blue-400">₺{paid.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center bg-[#1e293b] border border-[#334155]">
                          <div className="text-xs text-slate-500">Kalan</div>
                          <div className={`font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{remaining.toLocaleString('tr-TR')}</div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg text-center bg-[#1e293b] border border-[#334155]">
                        <div className="text-xs text-slate-500">Aylik Taksit</div>
                        <div className="font-bold text-yellow-400">₺{monthly.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="form-group">
                        <label>Odeme Tutari (TL) *</label>
                        <input className="input" type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder={monthly.toString()} required />
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>💳 Odemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLE MODAL */}
      {showEditModal && editForm && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Satis Kaydini Duzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Musteri *</label>
                  <select className="select" value={editForm.customer_id} onChange={(e) => setEditForm({...editForm, customer_id: e.target.value})} required>
                    <option value="">Secin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Urun Adi *</label><input className="input" value={editForm.item_name} onChange={(e) => setEditForm({...editForm, item_name: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Birim Fiyati (TL)</label><input className="input" type="number" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})} /></div>
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label>Odeme Yontemi</label>
                    <select className="select" value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}>
                      <option>Nakit</option><option>Kredi Karti</option><option>Taksit</option><option>Havale</option><option>Borc</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taksit Sayisi</label><input className="input" type="number" value={editForm.installments} onChange={(e) => setEditForm({...editForm, installments: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Kalan Miktar (TL)</label><input className="input" type="number" step="0.01" value={editForm.remaining_amount} onChange={(e) => setEditForm({...editForm, remaining_amount: e.target.value})} /></div>
                  <div className="form-group"><label>Garanti (Ay)</label><input className="input" type="number" value={editForm.warranty_months} onChange={(e) => setEditForm({...editForm, warranty_months: e.target.value})} /></div>
                </div>
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.peşin} onChange={(e) => setEditForm({...editForm, peşin: e.target.checked})} />
                    <span>Pesin Odedi</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Guncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function for device delete
async function handleDeleteDevice(id: string) {
  if (!confirm('Bu cihaz kaydini silmek istediginize emin misiniz?')) return
  await supabase.from('devices').delete().eq('id', id)
  window.location.reload()
}

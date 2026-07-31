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
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tumu')
  const [warrantyFilter, setWarrantyFilter] = useState('Tumu')
  const [activeTab, setActiveTab] = useState<'sales' | 'devices'>('sales')

  const [form, setForm] = useState({
    customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1',
    unit_price: '', payment_method: 'Nakit', installments: '1',
    warranty_months: '12', selected_inventory: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    var result = sales
    if (search) {
      var term = search.toLowerCase()
      result = result.filter(function(s) {
        return s.item_name.toLowerCase().indexOf(term) !== -1
      })
    }
    if (typeFilter !== 'Tumu') {
      result = result.filter(function(s) { return s.item_type === typeFilter })
    }
    if (warrantyFilter !== 'Tumu') {
      result = result.filter(function(s) {
        if (warrantyFilter === 'Aktif') return s.warranty_end_date && new Date(s.warranty_end_date) > new Date()
        if (warrantyFilter === 'Sona Erdi') return !s.warranty_end_date || new Date(s.warranty_end_date) <= new Date()
        return true
      })
    }
    setFilteredSales(result)
  }, [search, typeFilter, warrantyFilter, sales])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(function() { setToast(null) }, 3000)
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
    for (var i = 0; i < inventory.length; i++) {
      if (inventory[i].id === inventoryId) {
        var item = inventory[i]
        var newType = 'Cihaz'
        if (item.category === 'Aksesuar') newType = 'Aksesuar'
        else if (item.category === 'Parca') newType = 'Parca'
        setForm({
          ...form,
          selected_inventory: inventoryId,
          item_name: item.name,
          item_type: newType,
          unit_price: item.sale_price.toString()
        })
        break
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    var qty = parseInt(form.quantity) || 1
    var price = parseFloat(form.unit_price) || 0
    var total = qty * price
    var installments = parseInt(form.installments) || 1
    var warrantyMonths = parseInt(form.warranty_months) || 12
    var remaining = 0
    if (form.payment_method === 'Taksit' || form.payment_method === 'Borc') {
      remaining = total
    }

    var warrantyEnd = new Date()
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths)
    var warrantyEndStr = warrantyEnd.toISOString().split('T')[0]

    var { data: saleData, error } = await supabase.from('sales').insert([{
      customer_id: form.customer_id || null,
      item_name: form.item_name,
      item_type: form.item_type,
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_method: form.payment_method,
      installments: installments,
      remaining_amount: remaining,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEndStr
    }]).select()

    if (error) {
      showToast('Hata: ' + error.message, 'error')
      return
    }

    if (form.selected_inventory) {
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i].id === form.selected_inventory) {
          await supabase.from('inventory').update({ quantity: inventory[i].quantity - qty }).eq('id', form.selected_inventory)
          break
        }
      }
    }

    if (remaining === 0) {
      await supabase.from('transactions').insert([{
        type: 'gelir',
        category: 'Satis',
        amount: total,
        description: form.item_name + ' - ' + form.payment_method,
        related_id: saleData && saleData[0] ? saleData[0].id : null,
        related_table: 'sales'
      }])
    }

    if (saleData && saleData[0]) {
      var customerName = ''
      for (var i = 0; i < customers.length; i++) {
        if (customers[i].id === form.customer_id) {
          customerName = customers[i].name
          break
        }
      }
      await supabase.from('warranties').insert([{
        sale_id: saleData[0].id,
        customer_id: form.customer_id || null,
        customer_name: customerName,
        item_name: form.item_name,
        warranty_months: warrantyMonths,
        warranty_start: new Date().toISOString().split('T')[0],
        warranty_end: warrantyEndStr,
        status: 'Aktif'
      }])
    }

    if (remaining > 0) {
      var dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await supabase.from('debts').insert([{
        customer_id: form.customer_id || null,
        source_type: 'sale',
        source_id: saleData && saleData[0] ? saleData[0].id : null,
        total_amount: total,
        paid_amount: 0,
        remaining_amount: remaining,
        due_date: dueDate.toISOString().split('T')[0]
      }])
    }

    showToast('Satis kaydedildi')
    setShowModal(false)
    setForm({ customer_id: '', item_name: '', item_type: 'Cihaz', quantity: '1', unit_price: '', payment_method: 'Nakit', installments: '1', warranty_months: '12', selected_inventory: '' })
    loadData()
  }

  const isWarrantyActive = (endDate: string) => {
    if (!endDate) return false
    return new Date(endDate) > new Date()
  }

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return 0
    var diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  var typeOptions = ['Tumu']
  for (var i = 0; i < sales.length; i++) {
    var t = sales[i].item_type
    var found = false
    for (var j = 0; j < typeOptions.length; j++) {
      if (typeOptions[j] === t) { found = true; break }
    }
    if (!found) typeOptions.push(t)
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

      <div className="flex gap-4 border-b border-[#334155]">
        <button 
          onClick={() => setActiveTab('sales')}
          className={`pb-2 px-1 font-medium ${activeTab === 'sales' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >Tum Satislar</button>
        <button 
          onClick={() => setActiveTab('devices')}
          className={`pb-2 px-1 font-medium ${activeTab === 'devices' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >Satilan Cihazlar</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input type="text" className="input max-w-xs" placeholder="Urun ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select w-32" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {typeOptions.map(function(t) { return <option key={t}>{t}</option> })}
        </select>
        <select className="select w-36" value={warrantyFilter} onChange={(e) => setWarrantyFilter(e.target.value)}>
          <option value="Tumu">Tum Garantiler</option>
          <option value="Aktif">Aktif Garanti</option>
          <option value="Sona Erdi">Sona Eren</option>
        </select>
      </div>

      {activeTab === 'sales' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Urun</th><th>Tip</th><th>Musteri</th><th>Adet</th>
                <th>Birim Fiyat</th><th>Toplam</th><th>Odeme</th><th>Garanti</th><th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                var customer = null
                for (var i = 0; i < customers.length; i++) {
                  if (customers[i].id === sale.customer_id) { customer = customers[i]; break }
                }
                return (
                  <tr key={sale.id}>
                    <td className="font-medium text-white">{sale.item_name}</td>
                    <td><span className="badge badge-blue">{sale.item_type}</span></td>
                    <td className="text-slate-300">{customer ? customer.name : 'Bilinmiyor'}</td>
                    <td className="text-slate-300">{sale.quantity}</td>
                    <td className="text-slate-300">{sale.unit_price ? sale.unit_price.toLocaleString('tr-TR') : '0'} TL</td>
                    <td className="text-slate-300">{sale.total_price ? sale.total_price.toLocaleString('tr-TR') : '0'} TL</td>
                    <td>
                      {sale.payment_method}
                      {sale.remaining_amount > 0 && <div className="text-xs text-red-400">Kalan: {sale.remaining_amount ? sale.remaining_amount.toLocaleString('tr-TR') : '0'} TL</div>}
                    </td>
                    <td className="text-slate-300">{sale.warranty_months} ay</td>
                    <td className="text-slate-400 text-sm">{sale.created_at ? new Date(sale.created_at).toLocaleDateString('tr-TR') : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredSales.length === 0 && <div className="empty-state"><p>Satis bulunamadi</p></div>}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cihaz</th><th>Musteri</th><th>Tutar</th><th>Odeme</th>
                <th>Garanti Durumu</th><th>Kalan Sure</th><th>Satis Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.filter(function(s) { return s.item_type === 'Cihaz' }).map((sale) => {
                var customer = null
                for (var i = 0; i < customers.length; i++) {
                  if (customers[i].id === sale.customer_id) { customer = customers[i]; break }
                }
                var active = isWarrantyActive(sale.warranty_end_date)
                var daysLeft = daysUntilExpiry(sale.warranty_end_date)
                return (
                  <tr key={sale.id}>
                    <td className="font-medium text-white">{sale.item_name}</td>
                    <td className="text-slate-300">
                      {customer ? customer.name : 'Bilinmiyor'}
                      <br/><span className="text-xs text-slate-500">{customer ? customer.phone : ''}</span>
                    </td>
                    <td className="text-slate-300">{sale.total_price ? sale.total_price.toLocaleString('tr-TR') : '0'} TL</td>
                    <td>
                      {sale.payment_method}
                      {sale.remaining_amount > 0 && <div className="text-xs text-red-400">Kalan: {sale.remaining_amount ? sale.remaining_amount.toLocaleString('tr-TR') : '0'} TL</div>}
                    </td>
                    <td>
                      <span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>
                        {active ? 'Aktif' : 'Sona Erdi'}
                      </span>
                    </td>
                    <td className={daysLeft < 30 ? 'text-red-400' : 'text-slate-300'}>
                      {active ? daysLeft + ' gun' : 'Sona erdi'}
                    </td>
                    <td className="text-slate-400 text-sm">{sale.created_at ? new Date(sale.created_at).toLocaleDateString('tr-TR') : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredSales.filter(function(s) { return s.item_type === 'Cihaz' }).length === 0 && (
            <div className="empty-state"><p>Satilan cihaz bulunamadi</p></div>
          )}
        </div>
      )}

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
                    {customers.map(function(c) { return <option key={c.id} value={c.id}>{c.name} - {c.phone}</option> })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stoktan Sec (Opsiyonel)</label>
                  <select className="select" value={form.selected_inventory} onChange={(e) => handleInventorySelect(e.target.value)}>
                    <option value="">Stoktan secin...</option>
                    {inventory.map(function(i) { return <option key={i.id} value={i.id}>{i.name} - {i.sale_price ? i.sale_price.toLocaleString('tr-TR') : '0'} TL ({i.quantity} adet)</option> })}
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
                      <option>Cihaz</option><option>Aksesuar</option><option>Parca</option><option>Servis</option>
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
                <div className="grid-2">
                  <div className="form-group">
                    <label>Odeme Yontemi</label>
                    <select className="select" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})}>
                      <option>Nakit</option><option>Kredi Karti</option><option>Havale</option><option>Taksit</option><option>Borc</option>
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
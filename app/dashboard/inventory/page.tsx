'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface InventoryItem {
  id: string
  name: string
  category: string
  brand: string
  quantity: number
  min_stock: number
  max_stock: number
  purchase_price: number
  sale_price: number
  purchase_currency: string
  usd_purchase_price: number
  supplier_id: string
  created_at: string
}

interface Supplier {
  id: string
  name: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filtered, setFiltered] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dollarRate, setDollarRate] = useState(34.5)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    name: '', category: '', brand: '', quantity: '', min_stock: '5', max_stock: '100',
    purchase_price: '', sale_price: '', purchase_currency: 'TRY', usd_purchase_price: '', supplier_id: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = items
    if (search) result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    if (categoryFilter) result = result.filter(i => i.category === categoryFilter)
    setFiltered(result)
  }, [search, categoryFilter, items])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const [itemsRes, suppliersRes] = await Promise.all([
      supabase.from('inventory').select('*').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('id, name')
    ])
    if (itemsRes.data) setItems(itemsRes.data)
    if (suppliersRes.data) setSuppliers(suppliersRes.data)
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await res.json()
      setDollarRate(data.rates.TRY || 34.5)
    } catch {}
    setLoading(false)
  }

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setForm({
        name: item.name, category: item.category, brand: item.brand || '', quantity: item.quantity.toString(),
        min_stock: item.min_stock.toString(), max_stock: item.max_stock.toString(),
        purchase_price: item.purchase_price.toString(), sale_price: item.sale_price.toString(),
        purchase_currency: item.purchase_currency || 'TRY', usd_purchase_price: item.usd_purchase_price?.toString() || '',
        supplier_id: item.supplier_id || ''
      })
      setEditingId(item.id)
    } else {
      setForm({ name: '', category: '', brand: '', quantity: '', min_stock: '5', max_stock: '100', purchase_price: '', sale_price: '', purchase_currency: 'TRY', usd_purchase_price: '', supplier_id: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name, category: form.category, brand: form.brand || null,
      quantity: parseInt(form.quantity) || 0, min_stock: parseInt(form.min_stock) || 5, max_stock: parseInt(form.max_stock) || 100,
      purchase_price: parseFloat(form.purchase_price) || 0, sale_price: parseFloat(form.sale_price) || 0,
      purchase_currency: form.purchase_currency, usd_purchase_price: parseFloat(form.usd_purchase_price) || 0,
      supplier_id: form.supplier_id || null
    }
    if (editingId) {
      await supabase.from('inventory').update(payload).eq('id', editingId)
      showToast('Stok guncellendi')
    } else {
      await supabase.from('inventory').insert([payload])
      showToast('Stok eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu urunu silmek istediginize emin misiniz?')) return
    await supabase.from('inventory').delete().eq('id', id)
    showToast('Stok silindi')
    loadData()
  }

  // Fix: Use forEach instead of Set spread
  const categories: string[] = []
  items.forEach((i: InventoryItem) => {
    if (!categories.includes(i.category)) categories.push(i.category)
  })

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
        <h1 className="text-2xl font-bold text-white">Stok</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Urun</button>
      </div>

      <div className="flex gap-2">
        <input type="text" className="input flex-1" placeholder="Urun ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select w-40" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Tum Kategoriler</option>
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Urun</th>
              <th>Kategori</th>
              <th>Marka</th>
              <th>Stok</th>
              <th>Alis Fiyati</th>
              <th>Satis Fiyati</th>
              <th>Kar</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.quantity <= item.min_stock
              const profit = item.sale_price - item.purchase_price
              const profitPct = item.purchase_price > 0 ? ((profit / item.purchase_price) * 100).toFixed(1) : '0'
              const tryPrice = item.purchase_currency === 'USD' && item.usd_purchase_price > 0
                ? item.usd_purchase_price * dollarRate
                : item.purchase_price
              return (
                <tr key={item.id}>
                  <td className="font-medium text-white">{item.name}</td>
                  <td><span className="badge badge-blue">{item.category}</span></td>
                  <td className="text-slate-300">{item.brand || '-'}</td>
                  <td>
                    <span className={`font-medium ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.quantity}
                    </span>
                    {isLow && <span className="badge badge-red ml-2">Kritik</span>}
                  </td>
                  <td className="text-slate-300">
                    {item.purchase_currency === 'USD' && item.usd_purchase_price > 0 ? (
                      <div>
                        <div>${item.usd_purchase_price}</div>
                        <div className="text-xs text-slate-500">{tryPrice.toLocaleString('tr-TR')} TL</div>
                      </div>
                    ) : (
                      <div>{item.purchase_price?.toLocaleString('tr-TR')} TL</div>
                    )}
                  </td>
                  <td className="text-slate-300">{item.sale_price?.toLocaleString('tr-TR')} TL</td>
                  <td>
                    <span className="text-emerald-400">+{profit.toLocaleString('tr-TR')} TL</span>
                    <span className="text-xs text-slate-500 ml-1">(%{profitPct})</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openModal(item)} className="btn btn-secondary btn-sm">Duzenle</button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">Sil</button>
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
          <p>Henuz stok kaydi yok</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Stok Duzenle' : 'Yeni Urun'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Urun Adi *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Kategori *</label>
                    <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Marka</label>
                    <input className="input" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Stok *</label>
                    <input className="input" type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Min Stok</label>
                    <input className="input" type="number" value={form.min_stock} onChange={(e) => setForm({...form, min_stock: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Max Stok</label>
                    <input className="input" type="number" value={form.max_stock} onChange={(e) => setForm({...form, max_stock: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Para Birimi</label>
                  <select className="select" value={form.purchase_currency} onChange={(e) => setForm({...form, purchase_currency: e.target.value})}>
                    <option value="TRY">Turk Lirasi (TL)</option>
                    <option value="USD">Dolar (USD)</option>
                  </select>
                </div>
                {form.purchase_currency === 'USD' ? (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Alis Fiyati (USD) *</label>
                      <input className="input" type="number" step="0.01" value={form.usd_purchase_price} onChange={(e) => setForm({...form, usd_purchase_price: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Alis Fiyati (TL Karsiligi)</label>
                      <input className="input" type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} placeholder="Hesaplanacak..." />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Alis Fiyati (TL) *</label>
                    <input className="input" type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({...form, purchase_price: e.target.value})} required />
                  </div>
                )}
                <div className="form-group">
                  <label>Satis Fiyati (TL) *</label>
                  <input className="input" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({...form, sale_price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Tedarikci</label>
                  <select className="select" value={form.supplier_id} onChange={(e) => setForm({...form, supplier_id: e.target.value})}>
                    <option value="">Secin...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

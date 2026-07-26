'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Consumable {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  max_stock: number
  unit_price: number
  created_at: string
}

export default function ConsumablesPage() {
  const [items, setItems] = useState<Consumable[]>([])
  const [filtered, setFiltered] = useState<Consumable[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showUseModal, setShowUseModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Consumable | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({ name: '', category: '', quantity: '', unit: 'adet', min_stock: '5', max_stock: '100', unit_price: '' })
  const [useForm, setUseForm] = useState({ quantity_used: '', device_id: '', notes: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (search) setFiltered(items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())))
    else setFiltered(items)
  }, [search, items])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('consumables').select('*').order('created_at', { ascending: false })
    if (data) { setItems(data); setFiltered(data) }
    setLoading(false)
  }

  const openModal = (item?: Consumable) => {
    if (item) {
      setForm({ name: item.name, category: item.category || '', quantity: item.quantity.toString(), unit: item.unit, min_stock: item.min_stock.toString(), max_stock: item.max_stock.toString(), unit_price: item.unit_price.toString() })
      setEditingId(item.id)
    } else {
      setForm({ name: '', category: '', quantity: '', unit: 'adet', min_stock: '5', max_stock: '100', unit_price: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name, category: form.category || null,
      quantity: parseFloat(form.quantity) || 0, unit: form.unit,
      min_stock: parseFloat(form.min_stock) || 5, max_stock: parseFloat(form.max_stock) || 100,
      unit_price: parseFloat(form.unit_price) || 0
    }
    if (editingId) {
      await supabase.from('consumables').update(payload).eq('id', editingId)
      showToast('Malzeme guncellendi')
    } else {
      await supabase.from('consumables').insert([payload])
      showToast('Malzeme eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleUse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const qty = parseFloat(useForm.quantity_used) || 0
    if (qty <= 0 || qty > selectedItem.quantity) {
      showToast('Gecersiz miktar', 'error')
      return
    }
    const cost = qty * (selectedItem.unit_price || 0)

    await supabase.from('consumable_usage').insert([{
      consumable_id: selectedItem.id,
      device_id: useForm.device_id || null,
      quantity_used: qty,
      cost
    }])

    await supabase.from('consumables').update({ quantity: selectedItem.quantity - qty }).eq('id', selectedItem.id)

    // Auto cash deduction
    if (cost > 0) {
      await supabase.from('transactions').insert([{
        type: 'gider',
        category: 'Sarf Malzeme',
        amount: cost,
        description: `${selectedItem.name} - ${qty} ${selectedItem.unit} kullanildi`
      }])
    }

    showToast(`Kullanildi, kasadan ${cost.toLocaleString('tr-TR')} TL dusuldu`)
    setShowUseModal(false)
    setUseForm({ quantity_used: '', device_id: '', notes: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('consumables').delete().eq('id', id)
    showToast('Silindi')
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
        <h1 className="text-2xl font-bold text-white">Sarf Malzeme</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Malzeme</button>
      </div>

      <input type="text" className="input" placeholder="Malzeme ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Malzeme</th>
              <th>Kategori</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>Durum</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.quantity <= item.min_stock
              return (
                <tr key={item.id}>
                  <td className="font-medium text-white">{item.name}</td>
                  <td><span className="badge badge-blue">{item.category || '-'}</span></td>
                  <td className="text-slate-300">{item.quantity} {item.unit}</td>
                  <td className="text-slate-300">{item.unit_price?.toLocaleString('tr-TR')} TL</td>
                  <td>
                    {isLow ? <span className="badge badge-red">Kritik</span> : <span className="badge badge-green">Yeterli</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedItem(item); setShowUseModal(true) }} className="btn btn-primary btn-sm">Kullan</button>
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
          <p>Henuz malzeme kaydi yok</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Malzeme Duzenle' : 'Yeni Malzeme'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ad *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Miktar *</label>
                    <input className="input" type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Birim</label>
                    <input className="input" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Min Stok</label>
                    <input className="input" type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({...form, min_stock: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Max Stok</label>
                    <input className="input" type="number" step="0.01" value={form.max_stock} onChange={(e) => setForm({...form, max_stock: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Birim Fiyat (TL)</label>
                  <input className="input" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} />
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

      {showUseModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowUseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Kullan: {selectedItem.name}</h2>
              <button onClick={() => setShowUseModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleUse}>
              <div className="modal-body space-y-4">
                <p className="text-slate-300">Mevcut: <span className="text-emerald-400">{selectedItem.quantity} {selectedItem.unit}</span></p>
                <div className="form-group">
                  <label>Kullanilan Miktar *</label>
                  <input className="input" type="number" step="0.01" value={useForm.quantity_used} onChange={(e) => setUseForm({...useForm, quantity_used: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Cihaz ID (Opsiyonel)</label>
                  <input className="input" value={useForm.device_id} onChange={(e) => setUseForm({...useForm, device_id: e.target.value})} placeholder="Hangi cihazda kullanildi?" />
                </div>
                <div className="form-group">
                  <label>Not</label>
                  <input className="input" value={useForm.notes} onChange={(e) => setUseForm({...useForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUseModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Kullan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

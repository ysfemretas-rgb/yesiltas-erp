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

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [form, setForm] = useState({ name: '', category: '', quantity: '', unit_price: '', min_stock: '5' })
  const [editForm, setEditForm] = useState({ id: '', name: '', category: '', quantity: '', unit_price: '', min_stock: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const qty = parseInt(form.quantity) || 0
      const price = parseFloat(form.unit_price) || 0
      const minStock = parseInt(form.min_stock) || 5
      const { error } = await supabase.from('inventory').insert([{
        name: form.name, category: form.category, quantity: qty, unit_price: price, min_stock: minStock
      }])
      if (error) throw error
      setToast({ message: 'Ürün eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({ name: '', category: '', quantity: '', unit_price: '', min_stock: '5' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (item: any) => {
    setEditForm({
      id: item.id, name: item.name || '', category: item.category || '',
      quantity: item.quantity?.toString() || '', unit_price: item.unit_price?.toString() || '',
      min_stock: item.min_stock?.toString() || '5'
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const qty = parseInt(editForm.quantity) || 0
      const price = parseFloat(editForm.unit_price) || 0
      const minStock = parseInt(editForm.min_stock) || 5
      const { error } = await supabase.from('inventory').update({
        name: editForm.name, category: editForm.category, quantity: qty, unit_price: price, min_stock: minStock
      }).eq('id', editForm.id)
      if (error) throw error
      setToast({ message: 'Ürün güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'Ürün silindi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const lowStockItems = items.filter(i => i.quantity <= (i.min_stock || 5))
  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading && items.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Stok</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni Ürün</button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <div className="flex items-center gap-2 font-semibold text-yellow-400 mb-2">
            <span>⚠️</span> Düşük Stok Uyarısı ({lowStockItems.length} ürün)
          </div>
          <div className="flex gap-2 flex-wrap">
            {lowStockItems.map(item => (
              <span key={item.id} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                {item.name} ({item.quantity} adet)
              </span>
            ))}
          </div>
        </div>
      )}

      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Ürün</th><th>Kategori</th><th>Adet</th><th>Birim Fiyat</th><th>Değer</th><th>Min. Stok</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.quantity <= (item.min_stock || 5)
              return (
                <tr key={item.id} className={isLow ? 'bg-yellow-500/5' : ''}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {isLow && <span className="text-yellow-400">⚠️</span>}
                      {item.name}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td className={isLow ? 'text-yellow-400 font-bold' : ''}>{item.quantity}</td>
                  <td>₺{item.unit_price?.toLocaleString('tr-TR')}</td>
                  <td>₺{(item.quantity * item.unit_price)?.toLocaleString('tr-TR')}</td>
                  <td>{item.min_stock || 5}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(item)} className="btn btn-sm btn-secondary">Düzenle</button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-danger">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Ürün bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Ürün Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Adet *</label>
                  <input className="input" type="number" min="0" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Birim Fiyat</label>
                  <input className="input" type="number" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Min. Stok</label>
                  <input className="input" type="number" value={form.min_stock} onChange={(e) => setForm({...form, min_stock: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ürün Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input className="input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input className="input" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Adet *</label>
                  <input className="input" type="number" min="0" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Birim Fiyat</label>
                  <input className="input" type="number" value={editForm.unit_price} onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Min. Stok</label>
                  <input className="input" type="number" value={editForm.min_stock} onChange={(e) => setEditForm({...editForm, min_stock: e.target.value})} />
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
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Barcode, X, Download } from 'lucide-react'
import { useToast } from '@/components/toast'

function ExportCSV({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(';')
    const rows = data.map(row => Object.values(row).map(v => String(v ?? '').replace(/;/g, ',')).join(';'))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
  return (
    <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
      <Download size={16}/> Excel
    </button>
  )
}

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', sku: '', category: '', quantity: 0, min_stock: 0, purchase_price: '', sale_price: '', supplier: '' })
  const [stockForm, setStockForm] = useState({ type: 'in' as 'in'|'out', quantity: 1, note: '' })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('inventory').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
    setItems(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }
    const payload = {
      ...form,
      user_id: user.id,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null
    }
    if (editing) {
      const { error } = await supabase.from('inventory').update(payload).eq('id', editing.id)
      if (error) showToast('Hata: ' + error.message, 'error')
      else { showToast('Ürün güncellendi'); setShowModal(false); setEditing(null); fetchItems() }
    } else {
      const { error } = await supabase.from('inventory').insert([payload])
      if (error) showToast('Hata: ' + error.message, 'error')
      else { showToast('Ürün eklendi'); setShowModal(false); setForm({ name: '', sku: '', category: '', quantity: 0, min_stock: 0, purchase_price: '', sale_price: '', supplier: '' }); fetchItems() }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Ürün silindi'); fetchItems() }
  }

  const handleStockMove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    const newQty = stockForm.type === 'in' 
      ? selectedItem.quantity + stockForm.quantity 
      : selectedItem.quantity - stockForm.quantity
    if (newQty < 0) { showToast('Stok yetersiz', 'error'); return }

    const { error: updError } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', selectedItem.id)
    if (updError) { showToast('Hata: ' + updError.message, 'error'); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { error: movError } = await supabase.from('stock_movements').insert([{
      inventory_id: selectedItem.id,
      user_id: user?.id,
      type: stockForm.type,
      quantity: stockForm.quantity,
      note: stockForm.note
    }])
    if (movError) showToast('Hareket kaydedilemedi', 'error')
    else { showToast(`Stok ${stockForm.type === 'in' ? 'girişi' : 'çıkışı'} yapıldı`); setShowStockModal(false); fetchItems() }
  }

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok Yönetimi</h1>
        <div className="flex gap-2">
          <ExportCSV data={items} filename="stok.csv" />
          <button onClick={() => { setEditing(null); setForm({ name: '', sku: '', category: '', quantity: 0, min_stock: 0, purchase_price: '', sale_price: '', supplier: '' }); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={18}/> Yeni Ürün
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
        <input className="input pl-10" placeholder="Ürün, SKU veya kategori ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr><th className="table-header">Ürün</th><th className="table-header">SKU</th><th className="table-header">Kategori</th><th className="table-header">Stok</th><th className="table-header">Alış</th><th className="table-header">Satış</th><th className="table-header">İşlem</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(i => (
              <tr key={i.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i.quantity <= i.min_stock ? 'bg-red-50' : ''}`}>
                <td className="table-cell font-medium">{i.name}</td>
                <td className="table-cell font-mono text-xs">{i.sku || '-'}</td>
                <td className="table-cell">{i.category || '-'}</td>
                <td className="table-cell">
                  <span className={`font-bold ${i.quantity <= i.min_stock ? 'text-red-600' : 'text-green-600'}`}>{i.quantity}</span>
                  {i.quantity <= i.min_stock && <span className="text-xs text-red-500 ml-1">(Düşük)</span>}
                </td>
                <td className="table-cell">{i.purchase_price ? i.purchase_price + ' ₺' : '-'}</td>
                <td className="table-cell">{i.sale_price ? i.sale_price + ' ₺' : '-'}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedItem(i); setStockForm({ type: 'in', quantity: 1, note: '' }); setShowStockModal(true) }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Stok Hareketi"><ArrowUpCircle size={16}/></button>
                    <button onClick={() => { setEditing(i); setForm(i); setShowModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">Ürün bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Ürün Adı *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="SKU / Barkod" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                <input className="input" placeholder="Kategori" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className="input" type="number" placeholder="Stok" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} />
                <input className="input" type="number" placeholder="Min. Stok" value={form.min_stock} onChange={e => setForm({...form, min_stock: parseInt(e.target.value) || 0})} />
                <input className="input" placeholder="Tedarikçi" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" step="0.01" placeholder="Alış Fiyatı (₺)" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
                <input className="input" type="number" step="0.01" placeholder="Satış Fiyatı (₺)" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">{editing ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Stok Hareketi - {selectedItem.name}</h2>
              <button onClick={() => setShowStockModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={handleStockMove} className="space-y-3">
              <div className="flex gap-3">
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="stockType" checked={stockForm.type === 'in'} onChange={() => setStockForm({...stockForm, type: 'in'})} />
                  <ArrowUpCircle size={18} className="text-green-600"/> Giriş
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="stockType" checked={stockForm.type === 'out'} onChange={() => setStockForm({...stockForm, type: 'out'})} />
                  <ArrowDownCircle size={18} className="text-red-600"/> Çıkış
                </label>
              </div>
              <input className="input" type="number" min={1} placeholder="Miktar" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 1})} required />
              <input className="input" placeholder="Not / Açıklama" value={stockForm.note} onChange={e => setStockForm({...stockForm, note: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Barcode, Download, X } from 'lucide-react'
import { useToast } from '@/components/toast'
import { ExportCSV } from '@/components/export-csv'
import { BarcodeGenerator } from '@/components/barcode-generator'

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showBarcode, setShowBarcode] = useState<string | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [stockForm, setStockForm] = useState({ inventory_id: '', type: 'in', quantity: '', reason: '' })
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', category_id: '', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'adet', supplier: '' })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: inv }, { data: cat }] = await Promise.all([
      supabase.from('inventory').select('*, inventory_categories(name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('inventory_categories').select('*').eq('user_id', user?.id)
    ])
    setItems(inv || [])
    setCategories(cat || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const payload = {
      ...form,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      user_id: user.id
    }
    if (editing) {
      const { error } = await supabase.from('inventory').update(payload).eq('id', editing.id)
      if (error) showToast('Hata: ' + error.message, 'error')
      else { showToast('Ürün güncellendi'); setShowModal(false); setEditing(null); fetchData() }
    } else {
      const { error } = await supabase.from('inventory').insert([payload])
      if (error) showToast('Hata: ' + error.message, 'error')
      else { showToast('Ürün eklendi'); setShowModal(false); setForm({ name: '', sku: '', barcode: '', category_id: '', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'adet', supplier: '' }); fetchData() }
    }
  }

  const handleStockMove = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }
    const qty = parseInt(stockForm.quantity)
    if (!qty || qty <= 0) { showToast('Geçerli miktar girin', 'error'); return }

    const { error: moveError } = await supabase.from('stock_movements').insert([{
      inventory_id: stockForm.inventory_id,
      type: stockForm.type,
      quantity: qty,
      reason: stockForm.reason,
      user_id: user.id
    }])
    if (moveError) { showToast('Hata: ' + moveError.message, 'error'); return }

    if (stockForm.type === 'in') {
      await supabase.rpc('increment_stock', { item_id: stockForm.inventory_id, qty: qty })
    } else {
      await supabase.rpc('decrement_stock', { item_id: stockForm.inventory_id, qty: qty })
    }

    showToast('Stok hareketi kaydedildi')
    setShowStockModal(false)
    setStockForm({ inventory_id: '', type: 'in', quantity: '', reason: '' })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Ürün silindi'); fetchData() }
  }

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode?.includes(search)
  )

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok / Envanter</h1>
        <div className="flex gap-2">
          <ExportCSV data={items} filename="stok.csv" />
          <button onClick={() => { setEditing(null); setForm({ name: '', sku: '', barcode: '', category_id: '', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'adet', supplier: '' }); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={18}/> Yeni Ürün
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
        <input className="input pl-10" placeholder="Ürün adı, SKU, barkod ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="table-header">Ürün</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Kategori</th>
              <th className="table-header">Stok</th>
              <th className="table-header">Alış</th>
              <th className="table-header">Satış</th>
              <th className="table-header">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(i => (
              <tr key={i.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i.stock_quantity <= i.min_stock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                <td className="table-cell font-medium">{i.name}</td>
                <td className="table-cell font-mono text-xs">{i.sku}</td>
                <td className="table-cell">{i.inventory_categories?.name || '-'}</td>
                <td className="table-cell">
                  <span className={`font-bold ${i.stock_quantity <= i.min_stock ? 'text-red-600' : 'text-green-600'}`}>{i.stock_quantity}</span>
                  <span className="text-xs text-gray-500 ml-1">{i.unit}</span>
                </td>
                <td className="table-cell">{i.purchase_price} ₺</td>
                <td className="table-cell">{i.sale_price} ₺</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setStockForm({ inventory_id: i.id, type: 'in', quantity: '', reason: '' }); setShowStockModal(true) }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Stok Giriş"><ArrowUpCircle size={16}/></button>
                    <button onClick={() => { setStockForm({ inventory_id: i.id, type: 'out', quantity: '', reason: '' }); setShowStockModal(true) }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Stok Çıkış"><ArrowDownCircle size={16}/></button>
                    <button onClick={() => setShowBarcode(i.barcode || i.sku)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Barkod"><Barcode size={16}/></button>
                    <button onClick={() => { setEditing(i); setForm({ ...i, purchase_price: String(i.purchase_price), sale_price: String(i.sale_price), stock_quantity: String(i.stock_quantity), min_stock: String(i.min_stock), category_id: i.category_id || '' }); setShowModal(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
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
                <input className="input" placeholder="SKU *" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} required />
                <input className="input" placeholder="Barkod" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
              </div>
              <select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Kategori Seçin</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input className="input" type="number" placeholder="Alış Fiyatı" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
                <input className="input" type="number" placeholder="Satış Fiyatı" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} />
                <input className="input" type="number" placeholder="Stok" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" placeholder="Min. Stok" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} />
                <input className="input" placeholder="Birim (adet, kg, mt)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
              </div>
              <input className="input" placeholder="Tedarikçi" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">{editing ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">Stok Hareketi</h2>
            <form onSubmit={handleStockMove} className="space-y-3">
              <select className="input" value={stockForm.type} onChange={e => setStockForm({...stockForm, type: e.target.value})}>
                <option value="in">Giriş (+)</option>
                <option value="out">Çıkış (-)</option>
              </select>
              <input className="input" type="number" placeholder="Miktar" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} required min={1} />
              <input className="input" placeholder="Açıklama / Sebep" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBarcode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBarcode(null)}>
          <div className="bg-white rounded-xl p-6" onClick={e => e.stopPropagation()}>
            <BarcodeGenerator value={showBarcode} />
            <div className="text-center mt-2 text-sm text-gray-500">Yazdırmak için Ctrl+P</div>
          </div>
        </div>
      )}
    </div>
  )
}

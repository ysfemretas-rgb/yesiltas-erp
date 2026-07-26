'use client'
import { useState, useEffect } from 'react'
import { supabase, Inventory } from '@/lib/supabase'
import { Search, Plus, QrCode, Trash2, ArrowUpDown } from 'lucide-react'
import BarcodeGenerator from '@/components/barcode-generator'
export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBarcode, setShowBarcode] = useState<string | null>(null)
  const [showStockMove, setShowStockMove] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', sku: '', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'adet', supplier: '' })
  const [moveData, setMoveData] = useState({ type: 'in', quantity: '', reason: '' })
  useEffect(() => { fetchItems() }, [])
  const fetchItems = async () => {
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sku = formData.sku || `SKU-${Date.now()}`
    const barcode = `868${Date.now().toString().slice(-9)}`
    await supabase.from('inventory').insert([{
      ...formData, sku, barcode,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      min_stock: parseInt(formData.min_stock) || 5
    }])
    setFormData({ name: '', sku: '', purchase_price: '', sale_price: '', stock_quantity: '', min_stock: '5', unit: 'adet', supplier: '' })
    setShowForm(false)
    fetchItems()
  }
  const handleStockMove = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault()
    const qty = parseInt(moveData.quantity) || 0
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newQty = moveData.type === 'in' ? item.stock_quantity + qty : item.stock_quantity - qty
    await supabase.from('inventory').update({ stock_quantity: newQty }).eq('id', itemId)
    await supabase.from('stock_movements').insert([{ inventory_id: itemId, type: moveData.type, quantity: qty, reason: moveData.reason }])
    setShowStockMove(null)
    setMoveData({ type: 'in', quantity: '', reason: '' })
    fetchItems()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('inventory').delete().eq('id', id)
    fetchItems()
  }
  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()) || i.barcode?.includes(search))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok Yönetimi</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Ürün</button></div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Ürün Ekle</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="input" placeholder="Ürün Adı *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="input" placeholder="SKU (boş=otomatik)" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            <input className="input" placeholder="Birim" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            <input type="number" className="input" placeholder="Alış Fiyatı (₺)" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} />
            <input type="number" className="input" placeholder="Satış Fiyatı (₺)" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} />
            <input type="number" className="input" placeholder="Başlangıç Stok" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
            <input type="number" className="input" placeholder="Kritik Stok" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
            <input className="input md:col-span-2" placeholder="Tedarikçi" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            <div className="md:col-span-3 flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">İptal</button></div>
          </form>
        </div>
      )}
      {showBarcode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBarcode(null)}>
          <div className="bg-white p-6 rounded-xl" onClick={e => e.stopPropagation()}>
            {(() => { const item = items.find(i => i.id === showBarcode); return item ? <BarcodeGenerator value={item.barcode || item.sku} text={`${item.name} - ${item.sku}`} /> : null })()}
            <button onClick={() => setShowBarcode(null)} className="mt-4 w-full btn-secondary">Kapat</button>
          </div>
        </div>
      )}
      {showStockMove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStockMove(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Stok Hareketi</h3>
            <form onSubmit={(e) => handleStockMove(e, showStockMove)} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Hareket Türü</label><select className="input" value={moveData.type} onChange={e => setMoveData({...moveData, type: e.target.value})}><option value="in">Giriş (+)</option><option value="out">Çıkış (-)</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Miktar</label><input type="number" className="input" placeholder="0" value={moveData.quantity} onChange={e => setMoveData({...moveData, quantity: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Açıklama</label><input className="input" placeholder="Neden giriş/çıkış yapılıyor?" value={moveData.reason} onChange={e => setMoveData({...moveData, reason: e.target.value})} /></div>
              <div className="flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowStockMove(null)} className="btn-secondary">İptal</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Ürün ara (isim, SKU, barkod)..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ürün</th><th className="table-header">SKU</th><th className="table-header">Barkod</th><th className="table-header">Stok</th><th className="table-header">Alış</th><th className="table-header">Satış</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-500">Ürün bulunamadı</td></tr> :
             filtered.map((item) => (
               <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell font-medium">{item.name}</td>
                 <td className="table-cell font-mono text-xs">{item.sku}</td>
                 <td className="table-cell font-mono text-xs">{item.barcode}</td>
                 <td className="table-cell"><span className={`px-2 py-1 rounded text-xs font-bold ${item.stock_quantity <= item.min_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.stock_quantity} {item.unit}</span></td>
                 <td className="table-cell">₺{item.purchase_price}</td>
                 <td className="table-cell">₺{item.sale_price}</td>
                 <td className="table-cell">
                   <div className="flex items-center gap-1">
                     <button onClick={() => setShowBarcode(item.id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Barkod"><QrCode size={16} /></button>
                     <button onClick={() => setShowStockMove(item.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Stok Hareketi"><ArrowUpDown size={16} /></button>
                     <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 size={16} /></button>
                   </div>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
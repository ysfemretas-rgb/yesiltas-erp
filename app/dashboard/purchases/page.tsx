'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, QrCode } from 'lucide-react'
import BarcodeGenerator from '@/components/barcode-generator'
export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBarcode, setShowBarcode] = useState<string | null>(null)
  const [formData, setFormData] = useState({ supplier_name: '', payment_type: 'Nakit', paid_amount: '0', notes: '' })
  const [cart, setCart] = useState<any[]>([])
  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const [{ data: purData }, { data: invData }] = await Promise.all([
      supabase.from('purchases').select('*, purchase_items(inventory_id, quantity, unit_price, total_price, inventory(name, sku, barcode))').order('created_at', { ascending: false }),
      supabase.from('inventory').select('id, name, purchase_price').order('name')
    ])
    setPurchases(purData || [])
    setInventory(invData || [])
    setLoading(false)
  }
  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price} : c))
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.purchase_price, quantity: 1, total: item.purchase_price }])
    }
  }
  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const cartTotal = cart.reduce((sum, c) => sum + c.total, 0)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) { alert('Sepete ürün ekleyin!'); return }
    const today = new Date()
    const prefix = `PUR-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}`
    const { count } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).like('purchase_no', `${prefix}%`)
    const purchaseNo = `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`
    const { data: purData, error } = await supabase.from('purchases').insert([{
      purchase_no: purchaseNo, supplier_name: formData.supplier_name,
      total_amount: cartTotal, payment_type: formData.payment_type,
      paid_amount: parseFloat(formData.paid_amount) || cartTotal,
      notes: formData.notes, status: 'Tamamlandı'
    }]).select().single()
    if (error) { alert('Hata: ' + error.message); return }
    for (const item of cart) {
      await supabase.from('purchase_items').insert([{
        purchase_id: purData.id, inventory_id: item.id,
        quantity: item.quantity, unit_price: item.price, total_price: item.total
      }])
      await supabase.rpc('increment_stock', { item_id: item.id, qty: item.quantity })
    }
    setCart([])
    setFormData({ supplier_name: '', payment_type: 'Nakit', paid_amount: '0', notes: '' })
    setShowForm(false)
    fetchData()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('purchases').delete().eq('id', id)
    fetchData()
  }
  const filtered = purchases.filter(p => p.purchase_no?.toLowerCase().includes(search.toLowerCase()) || p.supplier_name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tedarik / Alış</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Alış</button></div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Alış Kaydı</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tedarikçi *</label><input className="input" placeholder="Tedarikçi adı" value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Ödeme Türü</label><select className="input" value={formData.payment_type} onChange={e => setFormData({...formData, payment_type: e.target.value})}><option value="Nakit">Nakit</option><option value="Kredi Kartı">Kredi Kartı</option><option value="Havale">Havale</option><option value="Taksit">Taksit</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Alınan (₺)</label><input type="number" className="input" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Notlar</label><textarea className="input" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><p className="text-lg font-bold text-green-600">Toplam: ₺{cartTotal}</p></div>
              <button onClick={handleSubmit} className="w-full btn-primary">Kaydet</button>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ürünler</h4>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-gray-500">₺{item.purchase_price}</p></div>
                    <button onClick={() => addToCart(item)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">Ekle</button>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div><h4 className="font-medium mb-2">Sepet</h4>
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded mb-1">
                      <span className="text-sm">{item.name} x{item.quantity}</span>
                      <div className="flex items-center gap-2"><span className="text-sm font-medium">₺{item.total}</span><button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs">Kaldır</button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showBarcode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBarcode(null)}>
          <div className="bg-white p-6 rounded-xl" onClick={e => e.stopPropagation()}>
            <BarcodeGenerator value={showBarcode} text={showBarcode} />
            <button onClick={() => setShowBarcode(null)} className="mt-4 w-full btn-secondary">Kapat</button>
          </div>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Alış no veya tedarikçi ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Alış No</th><th className="table-header">Tedarikçi</th><th className="table-header">Tutar</th><th className="table-header">Ödeme</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">Kayıt bulunamadı</td></tr> :
             filtered.map((p) => (
               <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell font-mono font-medium">{p.purchase_no}</td>
                 <td className="table-cell">{p.supplier_name}</td>
                 <td className="table-cell font-bold">₺{p.total_amount}</td>
                 <td className="table-cell"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{p.payment_type}</span></td>
                 <td className="table-cell">
                   <div className="flex items-center gap-1">
                     <button onClick={() => setShowBarcode(p.purchase_no)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Barkod"><QrCode size={16} /></button>
                     <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 size={16} /></button>
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
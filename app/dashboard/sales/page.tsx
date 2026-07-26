'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, Printer } from 'lucide-react'
import ReceiptPrint from '@/components/receipt-print'
export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [formData, setFormData] = useState({ customer_id: '', payment_type: 'Nakit', discount: '0', paid_amount: '0' })
  const [cart, setCart] = useState<any[]>([])
  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    const [{ data: salesData }, { data: custData }, { data: invData }] = await Promise.all([
      supabase.from('sales').select('*, customers(full_name, phone), sale_items(inventory_id, quantity, unit_price, total_price, inventory(name))').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name, phone').order('full_name'),
      supabase.from('inventory').select('id, name, sale_price, stock_quantity').gt('stock_quantity', 0).order('name')
    ])
    setSales(salesData || [])
    setCustomers(custData || [])
    setInventory(invData || [])
    setLoading(false)
  }
  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price} : c))
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.sale_price, quantity: 1, total: item.sale_price }])
    }
  }
  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const cartTotal = cart.reduce((sum, c) => sum + c.total, 0)
  const discount = parseFloat(formData.discount) || 0
  const grandTotal = cartTotal - discount
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) { alert('Sepete ürün ekleyin!'); return }
    const today = new Date()
    const prefix = `SLS-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}`
    const { count } = await supabase.from('sales').select('*', { count: 'exact', head: true }).like('sale_no', `${prefix}%`)
    const saleNo = `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`
    const { data: saleData, error } = await supabase.from('sales').insert([{
      sale_no: saleNo, customer_id: formData.customer_id || null,
      total_amount: grandTotal, discount: discount,
      payment_type: formData.payment_type,
      paid_amount: parseFloat(formData.paid_amount) || grandTotal,
      status: 'Tamamlandı'
    }]).select().single()
    if (error) { alert('Hata: ' + error.message); return }
    for (const item of cart) {
      await supabase.from('sale_items').insert([{
        sale_id: saleData.id, inventory_id: item.id,
        quantity: item.quantity, unit_price: item.price, total_price: item.total
      }])
      await supabase.rpc('decrement_stock', { item_id: item.id, qty: item.quantity })
    }
    setCart([])
    setFormData({ customer_id: '', payment_type: 'Nakit', discount: '0', paid_amount: '0' })
    setShowForm(false)
    fetchData()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('sales').delete().eq('id', id)
    fetchData()
  }
  const filtered = sales.filter(s => s.sale_no?.toLowerCase().includes(search.toLowerCase()) || s.customers?.full_name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satışlar</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Satış</button></div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Satış</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Müşteri</label><select className="input" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}><option value="">Seçin...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Ödeme Türü</label><select className="input" value={formData.payment_type} onChange={e => setFormData({...formData, payment_type: e.target.value})}><option value="Nakit">Nakit</option><option value="Kredi Kartı">Kredi Kartı</option><option value="Havale">Havale</option><option value="Taksit">Taksit</option></select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">İndirim (₺)</label><input type="number" className="input" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">Alınan (₺)</label><input type="number" className="input" value={formData.paid_amount} onChange={e => setFormData({...formData, paid_amount: e.target.value})} /></div></div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"><p className="text-sm">Ara Toplam: <span className="font-bold">₺{cartTotal}</span></p><p className="text-sm">İndirim: <span className="font-bold">₺{discount}</span></p><p className="text-lg font-bold text-green-600">Genel Toplam: ₺{grandTotal}</p></div>
              <button onClick={handleSubmit} className="w-full btn-primary">Satışı Tamamla</button>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ürünler</h4>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-gray-500">₺{item.sale_price} - Stok: {item.stock_quantity}</p></div>
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
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Satış Fişi</h3>
            <ReceiptPrint data={{
              title: 'SATIŞ FİŞİ',
              companyName: 'Yeşiltaş Teknoloji',
              date: new Date(selectedReceipt.created_at).toLocaleString('tr-TR'),
              customerName: selectedReceipt.customers?.full_name,
              customerPhone: selectedReceipt.customers?.phone,
              items: [
                ...selectedReceipt.sale_items.map((si: any) => ({ label: `${si.inventory?.name} x${si.quantity}`, value: `₺${si.total_price}` })),
                { label: 'İndirim', value: `₺${selectedReceipt.discount}` },
              ],
              total: `₺${selectedReceipt.total_amount}`
            }} />
            <button onClick={() => setSelectedReceipt(null)} className="mt-4 w-full btn-secondary">Kapat</button>
          </div>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Satış no veya müşteri ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Satış No</th><th className="table-header">Müşteri</th><th className="table-header">Tutar</th><th className="table-header">Ödeme</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">Satış bulunamadı</td></tr> :
             filtered.map((sale) => (
               <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell font-mono font-medium">{sale.sale_no}</td>
                 <td className="table-cell">{sale.customers?.full_name || 'Perakende'}</td>
                 <td className="table-cell font-bold">₺{sale.total_amount}</td>
                 <td className="table-cell"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{sale.payment_type}</span></td>
                 <td className="table-cell">
                   <div className="flex items-center gap-1">
                     <button onClick={() => setSelectedReceipt(sale)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Fiş"><Printer size={16} /></button>
                     <button onClick={() => handleDelete(sale.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Sil"><Trash2 size={16} /></button>
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
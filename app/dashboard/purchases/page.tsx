'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, ShoppingBag, X, Minus } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [supplierName, setSupplierName] = useState('')
  const [paymentType, setPaymentType] = useState('Nakit')
  const [paidAmount, setPaidAmount] = useState('')
  const [search, setSearch] = useState('')
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from('purchases').select('*, purchase_items(*)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('inventory').select('id, name, purchase_price, stock_quantity, sku').eq('user_id', user?.id)
    ])
    setPurchases(p || [])
    setInventory(i || [])
  }

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.inventory_id === item.id)
    if (existing) {
      setCart(cart.map(c => c.inventory_id === item.id ? { ...c, quantity: c.quantity + 1, total_price: (c.quantity + 1) * c.unit_price } : c))
    } else {
      setCart([...cart, { inventory_id: item.id, name: item.name, unit_price: item.purchase_price || 0, quantity: 1, total_price: item.purchase_price || 0 }])
    }
  }

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index))
  const updateQty = (index: number, qty: number) => {
    if (qty < 1) return
    setCart(cart.map((c, i) => i === index ? { ...c, quantity: qty, total_price: qty * c.unit_price } : c))
  }
  const updatePrice = (index: number, price: number) => {
    setCart(cart.map((c, i) => i === index ? { ...c, unit_price: price, total_price: c.quantity * price } : c))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.total_price, 0)

  const handlePurchase = async () => {
    if (cart.length === 0) { showToast('Sepet boş!', 'error'); return }
    if (!supplierName.trim()) { showToast('Tedarikçi adı girin', 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const purchaseNo = 'ALIS-' + Date.now().toString().slice(-6)
    const { data: purchaseData, error: purchaseError } = await supabase.from('purchases').insert([{
      purchase_no: purchaseNo,
      supplier_name: supplierName,
      total_amount: cartTotal,
      payment_type: paymentType,
      paid_amount: parseFloat(paidAmount) || cartTotal,
      user_id: user.id
    }]).select().single()

    if (purchaseError || !purchaseData) { showToast('Hata: ' + (purchaseError?.message || 'Alış oluşturulamadı'), 'error'); return }

    const purchaseItems = cart.map(c => ({
      purchase_id: purchaseData.id,
      inventory_id: c.inventory_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      total_price: c.total_price
    }))
    const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems)
    if (itemsError) { showToast('Hata: ' + itemsError.message, 'error'); return }

    for (const c of cart) {
      await supabase.rpc('increment_stock', { item_id: c.inventory_id, qty: c.quantity })
      await supabase.from('inventory').update({ purchase_price: c.unit_price }).eq('id', c.inventory_id)
    }

    showToast('Alış kaydı oluşturuldu: ' + purchaseNo)
    setShowModal(false)
    setCart([])
    setSupplierName('')
    setPaidAmount('')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Alış kaydı silindi'); fetchData() }
  }

  const filteredInv = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tedarik / Alış</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18}/> Yeni Alış
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="table-header">Alış No</th>
              <th className="table-header">Tedarikçi</th>
              <th className="table-header">Tutar</th>
              <th className="table-header">Ödeme</th>
              <th className="table-header">Tarih</th>
              <th className="table-header">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell font-mono font-medium">{p.purchase_no}</td>
                <td className="table-cell">{p.supplier_name}</td>
                <td className="table-cell font-bold">{p.total_amount} ₺</td>
                <td className="table-cell">{p.payment_type}</td>
                <td className="table-cell">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">Alış kaydı bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingBag size={20}/> Yeni Alış</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <input className="input" placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-auto">
                  {filteredInv.map(i => (
                    <button key={i.id} onClick={() => addToCart(i)} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 text-left">
                      <div className="font-medium text-sm truncate">{i.name}</div>
                      <div className="text-green-600 font-bold text-sm">{i.purchase_price || 0} ₺</div>
                      <div className="text-xs text-gray-500">Stok: {i.stock_quantity}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="card bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-semibold mb-2">Sepet</h3>
                  {cart.length === 0 && <div className="text-sm text-gray-500 py-4 text-center">Sepet boş</div>}
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="flex items-center gap-2">
                          <input className="w-20 text-xs input" type="number" value={c.unit_price} onChange={e => updatePrice(idx, parseFloat(e.target.value) || 0)} />
                          <span className="text-xs text-gray-500">x {c.quantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(idx, c.quantity - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14}/></button>
                        <span className="text-sm font-medium w-6 text-center">{c.quantity}</span>
                        <button onClick={() => updateQty(idx, c.quantity + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14}/></button>
                        <button onClick={() => removeFromCart(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between font-bold text-lg">
                    <span>Toplam:</span><span className="text-green-600">{cartTotal} ₺</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <input className="input" placeholder="Tedarikçi Adı *" value={supplierName} onChange={e => setSupplierName(e.target.value)} required />
                  <select className="input" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                    <option>Nakit</option>
                    <option>Kredi Kartı</option>
                    <option>Havale</option>
                    <option>Vadeli</option>
                  </select>
                  <input className="input" type="number" placeholder="Ödenen Tutar" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                  <button onClick={handlePurchase} className="btn-primary w-full">Alışı Tamamla</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

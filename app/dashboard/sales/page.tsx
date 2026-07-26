'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Trash2, ShoppingCart, Printer, MessageCircle, X, Minus } from 'lucide-react'
import { useToast } from '@/components/toast'
import { ReceiptPrint } from '@/components/receipt-print'
import { WhatsAppButton } from '@/components/whatsapp-button'

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showReceipt, setShowReceipt] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [paymentType, setPaymentType] = useState('Nakit')
  const [discount, setDiscount] = useState('0')
  const [paidAmount, setPaidAmount] = useState('')
  const [search, setSearch] = useState('')
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: s }, { data: c }, { data: i }] = await Promise.all([
      supabase.from('sales').select('*, customers(full_name, phone), sale_items(*)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name, phone').eq('user_id', user?.id),
      supabase.from('inventory').select('id, name, sale_price, stock_quantity').eq('user_id', user?.id)
    ])
    setSales(s || [])
    setCustomers(c || [])
    setInventory(i || [])
  }

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.inventory_id === item.id)
    if (existing) {
      if (existing.quantity >= item.stock_quantity) { showToast('Yetersiz stok!', 'error'); return }
      setCart(cart.map(c => c.inventory_id === item.id ? { ...c, quantity: c.quantity + 1, total_price: (c.quantity + 1) * c.unit_price } : c))
    } else {
      if (item.stock_quantity <= 0) { showToast('Stok yok!', 'error'); return }
      setCart([...cart, { inventory_id: item.id, name: item.name, unit_price: item.sale_price, quantity: 1, total_price: item.sale_price }])
    }
  }

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index))
  const updateQty = (index: number, qty: number) => {
    const item = inventory.find(i => i.id === cart[index].inventory_id)
    if (qty > (item?.stock_quantity || 0)) { showToast('Yetersiz stok!', 'error'); return }
    if (qty < 1) return
    setCart(cart.map((c, i) => i === index ? { ...c, quantity: qty, total_price: qty * c.unit_price } : c))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.total_price, 0)
  const finalTotal = cartTotal - (parseFloat(discount) || 0)

  const handleSale = async () => {
    if (cart.length === 0) { showToast('Sepet boş!', 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const saleNo = 'SAT-' + Date.now().toString().slice(-6)
    const { data: saleData, error: saleError } = await supabase.from('sales').insert([{
      sale_no: saleNo,
      customer_id: selectedCustomer || null,
      total_amount: finalTotal,
      discount: parseFloat(discount) || 0,
      payment_type: paymentType,
      paid_amount: parseFloat(paidAmount) || finalTotal,
      user_id: user.id
    }]).select().single()

    if (saleError || !saleData) { showToast('Hata: ' + (saleError?.message || 'Satış oluşturulamadı'), 'error'); return }

    const saleItems = cart.map(c => ({
      sale_id: saleData.id,
      inventory_id: c.inventory_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      total_price: c.total_price
    }))
    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) { showToast('Hata: ' + itemsError.message, 'error'); return }

    for (const c of cart) {
      await supabase.rpc('decrement_stock', { item_id: c.inventory_id, qty: c.quantity })
    }

    showToast('Satış tamamlandı: ' + saleNo)
    setShowModal(false)
    setCart([])
    setSelectedCustomer('')
    setDiscount('0')
    setPaidAmount('')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Satış silindi'); fetchData() }
  }

  const filteredInv = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satışlar</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18}/> Yeni Satış
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="table-header">Satış No</th>
              <th className="table-header">Müşteri</th>
              <th className="table-header">Tutar</th>
              <th className="table-header">İndirim</th>
              <th className="table-header">Ödeme</th>
              <th className="table-header">Tarih</th>
              <th className="table-header">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell font-mono font-medium">{s.sale_no}</td>
                <td className="table-cell">{s.customers?.full_name || 'Perakende'}</td>
                <td className="table-cell font-bold">{s.total_amount} ₺</td>
                <td className="table-cell">{s.discount > 0 ? s.discount + ' ₺' : '-'}</td>
                <td className="table-cell">{s.payment_type}</td>
                <td className="table-cell">{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => setShowReceipt(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Fiş"><Printer size={16}/></button>
                    <WhatsAppButton phone={s.customers?.phone} message={`Merhaba ${s.customers?.full_name || ''}, ${s.sale_no} nolu alışverişiniz toplam ${s.total_amount} ₺. Teşekkür ederiz!`} />
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">Satış bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart size={20}/> Yeni Satış</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <input className="input" placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-auto">
                  {filteredInv.map(i => (
                    <button key={i.id} onClick={() => addToCart(i)} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 text-left">
                      <div className="font-medium text-sm truncate">{i.name}</div>
                      <div className="text-green-600 font-bold text-sm">{i.sale_price} ₺</div>
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
                        <div className="text-xs text-gray-500">{c.unit_price} ₺ x {c.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(idx, c.quantity - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14}/></button>
                        <span className="text-sm font-medium w-6 text-center">{c.quantity}</span>
                        <button onClick={() => updateQty(idx, c.quantity + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14}/></button>
                        <button onClick={() => removeFromCart(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between text-sm"><span>Ara Toplam:</span><span>{cartTotal} ₺</span></div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>İndirim:</span>
                      <input className="input w-24 text-right" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
                    </div>
                    <div className="flex justify-between font-bold text-lg"><span>Toplam:</span><span className="text-green-600">{finalTotal} ₺</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <select className="input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                    <option value="">Perakende (Müşteri Seç)</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>)}
                  </select>
                  <select className="input" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                    <option>Nakit</option>
                    <option>Kredi Kartı</option>
                    <option>Havale</option>
                    <option>Taksit</option>
                  </select>
                  <input className="input" type="number" placeholder="Alınan Tutar" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                  <button onClick={handleSale} className="btn-primary w-full">Satışı Tamamla</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceipt(null)}>
          <div onClick={e => e.stopPropagation()}>
            <ReceiptPrint sale={showReceipt} />
          </div>
        </div>
      )}
    </div>
  )
}

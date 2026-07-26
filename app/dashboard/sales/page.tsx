'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Plus, Trash2, MessageCircle, Printer, X, Search } from 'lucide-react'
import { useToast } from '@/components/toast'

function WhatsAppButton({ phone, message }: { phone?: string, message?: string }) {
  if (!phone) return null
  const cleanPhone = phone.replace(/\D/g, '')
  const url = `https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message || '')}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="WhatsApp">
      <MessageCircle size={16}/>
    </a>
  )
}

export default function SalesPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: inv }, { data: cust }] = await Promise.all([
      supabase.from('inventory').select('*').eq('user_id', user?.id).gt('quantity', 0),
      supabase.from('customers').select('*').eq('user_id', user?.id).order('full_name')
    ])
    setInventory(inv || [])
    setCustomers(cust || [])
  }

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      if (existing.qty >= item.quantity) { showToast('Stok yetersiz', 'error'); return }
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { ...item, qty: 1, price: item.sale_price || 0 }])
    }
  }

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const updateQty = (id: string, qty: number) => {
    const item = inventory.find(i => i.id === id)
    if (qty > item.quantity) { showToast('Stok yetersiz', 'error'); return }
    if (qty < 1) { removeFromCart(id); return }
    setCart(cart.map(c => c.id === id ? { ...c, qty } : c))
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  const handleSale = async () => {
    if (cart.length === 0) { showToast('Sepet boş', 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const saleItems = cart.map(c => ({
      inventory_id: c.id,
      quantity: c.qty,
      unit_price: c.price,
      total_price: c.price * c.qty
    }))

    const { data: sale, error } = await supabase.from('sales').insert([{
      user_id: user.id,
      customer_id: selectedCustomer?.id || null,
      total_amount: total,
      payment_method: 'Nakit'
    }]).select().single()

    if (error) { showToast('Hata: ' + error.message, 'error'); return }

    const itemsWithSale = saleItems.map(i => ({ ...i, sale_id: sale.id }))
    const { error: itemError } = await supabase.from('sale_items').insert(itemsWithSale)
    if (itemError) { showToast('Satış kalemleri kaydedilemedi', 'error'); return }

    // Stok düşür
    for (const c of cart) {
      await supabase.from('inventory').update({ quantity: c.quantity - c.qty }).eq('id', c.id)
      await supabase.from('stock_movements').insert([{
        inventory_id: c.id, user_id: user.id, type: 'out', quantity: c.qty, note: 'Satış: ' + sale.id
      }])
    }

    setLastSale({ ...sale, items: cart, customer: selectedCustomer })
    setShowReceipt(true)
    setCart([])
    setSelectedCustomer(null)
    fetchData()
    showToast('Satış tamamlandı')
  }

  const filtered = inventory.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satış Ekranı</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ürün Listesi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input className="input pl-10" placeholder="Ürün ara..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(i => (
              <button key={i.id} onClick={() => addToCart(i)} className="card p-4 text-left hover:shadow-md transition-shadow">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-gray-500">{i.sku || 'SKU yok'} | Stok: {i.quantity}</div>
                <div className="text-lg font-bold text-green-600 mt-1">{i.sale_price ? i.sale_price + ' ₺' : 'Fiyat yok'}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-gray-500 col-span-2">Ürün bulunamadı</div>}
          </div>
        </div>

        {/* Sepet */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart size={20}/> Sepet
          </div>

          {/* Müşteri Seçimi */}
          <select className="input text-sm" value={selectedCustomer?.id || ''} onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}>
            <option value="">Müşteri seçin (opsiyonel)</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>)}
          </select>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.price} ₺ x {c.qty}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(c.id, c.qty - 1)} className="w-6 h-6 bg-gray-200 rounded text-sm">-</button>
                  <span className="w-6 text-center text-sm">{c.qty}</span>
                  <button onClick={() => updateQty(c.id, c.qty + 1)} className="w-6 h-6 bg-gray-200 rounded text-sm">+</button>
                  <button onClick={() => removeFromCart(c.id)} className="p-1 text-red-600 ml-1"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">Sepet boş</div>}
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam:</span>
              <span>{total.toFixed(2)} ₺</span>
            </div>
            <button onClick={handleSale} disabled={cart.length === 0} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
              <Printer size={16}/> Satışı Tamamla
            </button>
          </div>
        </div>
      </div>

      {/* Fiş Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center border-b pb-3">
              <h2 className="text-xl font-bold">YEŞİLTAŞ TEKNOLOJİ</h2>
              <p className="text-sm text-gray-500">Satış Fişi</p>
              <p className="text-xs text-gray-400">{new Date(lastSale.created_at).toLocaleString('tr-TR')}</p>
            </div>
            <div className="space-y-1 text-sm">
              {lastSale.items.map((i: any) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name} x{i.qty}</span>
                  <span>{(i.price * i.qty).toFixed(2)} ₺</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>TOPLAM</span>
              <span>{lastSale.total_amount?.toFixed(2)} ₺</span>
            </div>
            {lastSale.customer && (
              <div className="text-sm text-gray-500">
                Müşteri: {lastSale.customer.full_name}<br/>{lastSale.customer.phone}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2"><Printer size={16}/> Yazdır</button>
              {lastSale.customer?.phone && (
                <WhatsAppButton phone={lastSale.customer.phone} message={`Merhaba ${lastSale.customer.full_name}, satışınız için teşekkürler. Toplam: ${lastSale.total_amount?.toFixed(2)} ₺`} />
              )}
              <button onClick={() => setShowReceipt(false)} className="btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

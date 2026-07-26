'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, Plus, Trash2, X, Search } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function PurchasesPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [supplier, setSupplier] = useState('')
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchInventory() }, [])

  const fetchInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('inventory').select('*').eq('user_id', user?.id).order('name')
    setInventory(data || [])
  }

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { ...item, qty: 1, price: item.purchase_price || 0 }])
    }
  }

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id))
  const updateQty = (id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return }
    setCart(cart.map(c => c.id === id ? { ...c, qty } : c))
  }
  const updatePrice = (id: string, price: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, price } : c))
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  const handlePurchase = async () => {
    if (cart.length === 0) { showToast('Sepet boş', 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const { data: purchase, error } = await supabase.from('purchases').insert([{
      user_id: user.id,
      supplier: supplier || null,
      total_amount: total
    }]).select().single()

    if (error) { showToast('Hata: ' + error.message, 'error'); return }

    const items = cart.map(c => ({
      purchase_id: purchase.id,
      inventory_id: c.id,
      quantity: c.qty,
      unit_price: c.price,
      total_price: c.price * c.qty
    }))
    const { error: itemError } = await supabase.from('purchase_items').insert(items)
    if (itemError) { showToast('Alış kalemleri kaydedilemedi', 'error'); return }

    // Stok artır ve alış fiyatını güncelle
    for (const c of cart) {
      const newQty = c.quantity + c.qty
      await supabase.from('inventory').update({ 
        quantity: newQty, 
        purchase_price: c.price,
        supplier: supplier || c.supplier
      }).eq('id', c.id)
      await supabase.from('stock_movements').insert([{
        inventory_id: c.id, user_id: user.id, type: 'in', quantity: c.qty, note: 'Alış: ' + purchase.id
      }])
    }

    setCart([])
    setSupplier('')
    fetchInventory()
    showToast('Alış kaydedildi')
  }

  const filtered = inventory.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alış / Tedarik</h1>

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
                <div className="text-sm text-blue-600 mt-1">Alış: {i.purchase_price ? i.purchase_price + ' ₺' : 'Belirtilmemiş'}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-gray-500 col-span-2">Ürün bulunamadı</div>}
          </div>
        </div>

        {/* Sepet */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag size={20}/> Alış Sepeti
          </div>

          <input className="input text-sm" placeholder="Tedarikçi adı..." value={supplier} onChange={e => setSupplier(e.target.value)} />

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.map(c => (
              <div key={c.id} className="bg-gray-50 p-2 rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.name}</span>
                  <button onClick={() => removeFromCart(c.id)} className="p-1 text-red-600"><Trash2 size={14}/></button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" className="input text-xs py-1 w-20" placeholder="Birim fiyat" value={c.price} onChange={e => updatePrice(c.id, parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-gray-500">x</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(c.id, c.qty - 1)} className="w-5 h-5 bg-gray-200 rounded text-xs">-</button>
                    <span className="w-5 text-center text-xs">{c.qty}</span>
                    <button onClick={() => updateQty(c.id, c.qty + 1)} className="w-5 h-5 bg-gray-200 rounded text-xs">+</button>
                  </div>
                  <span className="text-xs font-medium ml-auto">{(c.price * c.qty).toFixed(2)} ₺</span>
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
            <button onClick={handlePurchase} disabled={cart.length === 0} className="btn-primary w-full mt-3">
              Alışı Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

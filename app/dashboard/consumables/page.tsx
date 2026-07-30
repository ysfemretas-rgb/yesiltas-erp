'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConsumablesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('consumables').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Sarf Malzeme</h1>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Urun</th><th>Miktar</th><th>Birim</th><th>Stok</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="text-white">{i.name}</td>
                <td className="text-slate-300">{i.quantity}</td>
                <td className="text-slate-300">{i.unit || '-'}</td>
                <td><span className={`badge ${i.stock > i.min_stock ? 'badge-green' : 'badge-red'}`}>{i.stock}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <div className="empty-state"><p>Henüz sarf malzeme kaydi yok</p></div>}
    </div>
  )
}

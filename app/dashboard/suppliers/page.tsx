'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name')
    if (data) setSuppliers(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Tedarikciler</h1>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Ad</th><th>Telefon</th><th>Email</th><th>Adres</th></tr></thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="text-white">{s.name}</td>
                <td className="text-slate-300">{s.phone || '-'}</td>
                <td className="text-slate-300">{s.email || '-'}</td>
                <td className="text-slate-500">{s.address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {suppliers.length === 0 && <div className="empty-state"><p>Henüz tedarikci kaydi yok</p></div>}
    </div>
  )
}

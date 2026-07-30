'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('staff').select('*').order('name')
    if (data) setStaff(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Personel</h1>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Ad</th><th>Pozisyon</th><th>Telefon</th><th>Durum</th></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="text-white">{s.name}</td>
                <td className="text-slate-300">{s.position || '-'}</td>
                <td className="text-slate-300">{s.phone || '-'}</td>
                <td><span className={`badge ${s.status === 'Aktif' ? 'badge-green' : 'badge-red'}`}>{s.status || 'Aktif'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {staff.length === 0 && <div className="empty-state"><p>Henüz personel kaydi yok</p></div>}
    </div>
  )
}

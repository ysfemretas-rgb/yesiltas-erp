'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false })
    if (data) setAppointments(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Randevular</h1>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Tarih</th><th>Musteri</th><th>Konu</th><th>Durum</th></tr></thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="text-slate-300">{new Date(a.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="text-white">{a.customer_name || '-'}</td>
                <td className="text-slate-300">{a.subject || '-'}</td>
                <td><span className="badge badge-blue">{a.status || 'Beklemede'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {appointments.length === 0 && <div className="empty-state"><p>Henüz randevu yok</p></div>}
    </div>
  )
}

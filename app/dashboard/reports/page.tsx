'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(100)
    if (data) setSalesData(data)
    setLoading(false)
  }

  const exportToCSV = () => {
    const headers = ['Tarih', 'Urun', 'Musteri', 'Tutar', 'Odeme']
    const rows = salesData.map(s => [
      new Date(s.created_at).toLocaleDateString('tr-TR'),
      s.item_name,
      s.customer_id,
      s.total_price,
      s.payment_method
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'satis-raporu.csv'
    a.click()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Raporlar</h1>
        <button onClick={exportToCSV} className="btn btn-primary btn-sm">📥 CSV Indir</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Tarih</th><th>Urun</th><th>Tutar</th><th>Odeme</th></tr></thead>
          <tbody>
            {salesData.map((s) => (
              <tr key={s.id}>
                <td className="text-slate-400 text-sm">{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="text-white">{s.item_name}</td>
                <td className="text-emerald-400">₺{s.total_price?.toLocaleString('tr-TR')}</td>
                <td className="text-slate-300">{s.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ total: 0, count: 0, avg: 0 })

  useEffect(() => {
    const today = new Date()
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const to = today.toISOString().split('T')[0]
    setDateFrom(from)
    setDateTo(to)
  }, [])

  const generateReport = async () => {
    setLoading(true)
    const fromDate = dateFrom + 'T00:00:00'
    const toDate = dateTo + 'T23:59:59'

    let query
    switch (reportType) {
      case 'sales':
        query = supabase.from('sales').select('*').gte('created_at', fromDate).lte('created_at', toDate)
        break
      case 'devices':
        query = supabase.from('devices').select('*').gte('created_at', fromDate).lte('created_at', toDate)
        break
      case 'finance':
        query = supabase.from('transactions').select('*').gte('created_at', fromDate).lte('created_at', toDate)
        break
      case 'customers':
        query = supabase.from('customers').select('*').gte('created_at', fromDate).lte('created_at', toDate)
        break
      default:
        query = supabase.from('sales').select('*').gte('created_at', fromDate).lte('created_at', toDate)
    }

    const { data: result } = await query
    if (result) {
      setData(result)
      if (reportType === 'sales' || reportType === 'finance') {
        const total = result.reduce((s: number, r: any) => s + (r.total_price || r.amount || 0), 0)
        setSummary({ total, count: result.length, avg: result.length > 0 ? total / result.length : 0 })
      } else {
        setSummary({ total: 0, count: result.length, avg: 0 })
      }
    }
    setLoading(false)
  }

  const exportToCSV = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const rows = data.map((row: any) => headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && val.includes(';')) return `"${val}"`
      return String(val)
    }))
    const csv = [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_raporu_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Raporlar</h1>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div className="form-group">
            <label>Rapor Turu</label>
            <select className="select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Satis Raporu</option>
              <option value="devices">Teknik Servis Raporu</option>
              <option value="finance">Kasa Raporu</option>
              <option value="customers">Musteri Raporu</option>
            </select>
          </div>
          <div className="form-group">
            <label>Baslangic Tarihi</label>
            <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Bitis Tarihi</label>
            <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="form-group flex items-end">
            <button onClick={generateReport} disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Olusturuluyor...' : 'Rapor Olustur'}
            </button>
          </div>
        </div>

        {data.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <span className="text-slate-300">Kayit: <strong className="text-white">{summary.count}</strong></span>
                {(reportType === 'sales' || reportType === 'finance') && (
                  <>
                    <span className="text-slate-300">Toplam: <strong className="text-emerald-400">{summary.total.toLocaleString('tr-TR')} TL</strong></span>
                    <span className="text-slate-300">Ortalama: <strong className="text-white">{summary.avg.toLocaleString('tr-TR')} TL</strong></span>
                  </>
                )}
              </div>
              <button onClick={exportToCSV} className="btn btn-secondary btn-sm">Excel Indir</button>
            </div>

            <div className="table-container max-h-96 overflow-y-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th key={key} className="whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="whitespace-nowrap">
                          {val === null || val === undefined ? '-' :
                           typeof val === 'string' && val.includes('T') && val.includes('-') ? new Date(val).toLocaleDateString('tr-TR') :
                           typeof val === 'number' ? val.toLocaleString('tr-TR') :
                           String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.length === 0 && !loading && (
          <div className="empty-state py-8">
            <p>Tarih araligi secip "Rapor Olustur" butonuna basin</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, PieChart, TrendingUp, Calendar, Download } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function ReportsPage() {
  const [filter, setFilter] = useState(30)
  const [sales, setSales] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [filter])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const fromDate = new Date(Date.now() - filter * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: s }, { data: sv }, { data: t }] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', user?.id).gte('created_at', fromDate),
      supabase.from('services').select('*').eq('user_id', user?.id).gte('created_at', fromDate),
      supabase.from('transactions').select('*').eq('user_id', user?.id).gte('date', fromDate.split('T')[0])
    ])
    setSales(s || [])
    setServices(sv || [])
    setTransactions(t || [])
  }

  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  const totalServices = services.reduce((sum, s) => sum + (s.final_cost || s.estimated_cost || 0), 0)
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Kategori bazlı pasta grafik verisi
  const salesByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}
  transactions.forEach(t => {
    if (t.type === 'income') salesByCategory[t.category] = (salesByCategory[t.category] || 0) + t.amount
    else expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
  })

  const exportReport = () => {
    const report = {
      periyot: `${filter} gün`,
      toplam_satis: totalSales,
      toplam_servis: totalServices,
      gelir: income,
      gider: expense,
      kar: income - expense,
      satis_adet: sales.length,
      servis_adet: services.length
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapor_${filter}gun_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    showToast('Rapor indirildi')
  }

  // Basit SVG pasta grafik
  const PieChartSVG = ({ data, colors }: { data: Record<string, number>, colors: string[] }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0)
    if (total === 0) return <div className="text-center text-gray-400 py-8">Veri yok</div>
    let acc = 0
    const entries = Object.entries(data)
    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {entries.map(([label, value], i) => {
            const pct = value / total
            const start = acc * 360
            const end = (acc + pct) * 360
            acc += pct
            const largeArc = pct > 0.5 ? 1 : 0
            const x1 = 50 + 40 * Math.cos((start - 90) * Math.PI / 180)
            const y1 = 50 + 40 * Math.sin((start - 90) * Math.PI / 180)
            const x2 = 50 + 40 * Math.cos((end - 90) * Math.PI / 180)
            const y2 = 50 + 40 * Math.sin((end - 90) * Math.PI / 180)
            return <path key={label} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} />
          })}
        </svg>
        <div className="space-y-1 text-sm">
          {entries.map(([label, value], i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }}></span>
              <span>{label}: {value.toFixed(0)} ₺</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Basit SVG çubuk grafik
  const BarChartSVG = ({ data, color }: { data: Record<string, number>, color: string }) => {
    const entries = Object.entries(data)
    if (entries.length === 0) return <div className="text-center text-gray-400 py-8">Veri yok</div>
    const max = Math.max(...entries.map(([, v]) => v))
    return (
      <div className="space-y-2">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-24 text-xs text-right truncate">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }}></div>
            </div>
            <span className="w-16 text-xs">{value.toFixed(0)} ₺</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <div className="flex gap-2">
          <select className="input text-sm" value={filter} onChange={e => setFilter(Number(e.target.value))}>
            <option value={7}>Son 7 Gün</option>
            <option value={30}>Son 30 Gün</option>
            <option value={90}>Son 90 Gün</option>
            <option value={365}>Son 1 Yıl</option>
          </select>
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16}/> İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-sm text-gray-500">Toplam Satış</div><div className="text-2xl font-bold text-green-600">{totalSales.toFixed(2)} ₺</div><div className="text-xs text-gray-400">{sales.length} adet</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Servis Geliri</div><div className="text-2xl font-bold text-blue-600">{totalServices.toFixed(2)} ₺</div><div className="text-xs text-gray-400">{services.length} adet</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Net Kar</div><div className="text-2xl font-bold text-purple-600">{(income - expense).toFixed(2)} ₺</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Ort. Satış</div><div className="text-2xl font-bold text-orange-600">{sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'} ₺</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><PieChart size={18}/> Gelir Dağılımı</h3>
          <PieChartSVG data={salesByCategory} colors={['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']} />
        </div>
        <div className="card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18}/> Gider Dağılımı</h3>
          <BarChartSVG data={expenseByCategory} color="#ef4444" />
        </div>
      </div>
    </div>
  )
}

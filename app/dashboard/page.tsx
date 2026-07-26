'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  pendingDevices: number
  readyDevices: number
  todaySales: number
  criticalStock: number
  totalCustomers: number
  monthlyRevenue: number
  totalDebt: number
  activeWarranties: number
}

interface DailySale {
  date: string
  amount: number
}

interface CategorySale {
  category: string
  amount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pendingDevices: 0, readyDevices: 0, todaySales: 0, criticalStock: 0,
    totalCustomers: 0, monthlyRevenue: 0, totalDebt: 0, activeWarranties: 0
  })
  const [dollarRate, setDollarRate] = useState<{ alis: number; satis: number } | null>(null)
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [categorySales, setCategorySales] = useState<CategorySale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    loadDollarRate()
    loadCharts()
    const interval = setInterval(loadDollarRate, 300000) // 5 dakika
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [
      { count: pendingDevices },
      { count: readyDevices },
      { data: todaySalesData },
      { data: criticalStock },
      { count: totalCustomers },
      { data: monthlyRevenueData },
      { data: totalDebtData },
      { count: activeWarranties }
    ] = await Promise.all([
      supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'Beklemede'),
      supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'Tamamlandı'),
      supabase.from('sales').select('total_price').gte('created_at', today + 'T00:00:00'),
      supabase.from('inventory').select('*').lte('quantity', 5),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount').eq('type', 'gelir').gte('created_at', monthStart),
      supabase.from('debts').select('remaining_amount').gt('remaining_amount', 0),
      supabase.from('warranties').select('*', { count: 'exact', head: true }).eq('status', 'Aktif')
    ])

    const todaySales = todaySalesData?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0
    const monthlyRevenue = monthlyRevenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalDebt = totalDebtData?.reduce((sum, d) => sum + (d.remaining_amount || 0), 0) || 0

    setStats({
      pendingDevices: pendingDevices || 0,
      readyDevices: readyDevices || 0,
      todaySales,
      criticalStock: criticalStock?.length || 0,
      totalCustomers: totalCustomers || 0,
      monthlyRevenue,
      totalDebt,
      activeWarranties: activeWarranties || 0
    })
    setLoading(false)
  }

  const loadDollarRate = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await res.json()
      const tryRate = data.rates.TRY
      setDollarRate({ alis: tryRate * 0.995, satis: tryRate * 1.005 })
    } catch {
      setDollarRate({ alis: 34.5, satis: 34.8 })
    }
  }

  const loadCharts = async () => {
    // Last 7 days sales
    const days: DailySale[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const { data } = await supabase
        .from('sales')
        .select('total_price')
        .gte('created_at', dateStr + 'T00:00:00')
        .lt('created_at', dateStr + 'T23:59:59')
      const amount = data?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0
      days.push({ date: d.toLocaleDateString('tr-TR', { weekday: 'short' }), amount })
    }
    setDailySales(days)

    // Sales by category
    const { data: salesData } = await supabase.from('sales').select('item_type, total_price')
    const cats: Record<string, number> = {}
    salesData?.forEach(s => {
      cats[s.item_type] = (cats[s.item_type] || 0) + (s.total_price || 0)
    })
    setCategorySales(Object.entries(cats).map(([category, amount]) => ({ category, amount })))
  }

  const maxDaily = Math.max(...dailySales.map(d => d.amount), 1)
  const maxCategory = Math.max(...categorySales.map(c => c.amount), 1)
  const totalCat = categorySales.reduce((s, c) => s + c.amount, 0) || 1

  const statCards = [
    { label: 'Bekleyen Cihaz', value: stats.pendingDevices, color: 'text-yellow-400', icon: '⏳', href: '/dashboard/devices' },
    { label: 'Hazır Cihaz', value: stats.readyDevices, color: 'text-emerald-400', icon: '✅', href: '/dashboard/devices' },
    { label: "Bugün Satış", value: stats.todaySales.toLocaleString('tr-TR') + ' ₺', color: 'text-blue-400', icon: '💰', href: '/dashboard/sales' },
    { label: 'Kritik Stok', value: stats.criticalStock, color: 'text-red-400', icon: '⚠️', href: '/dashboard/inventory' },
    { label: 'Toplam Müşteri', value: stats.totalCustomers, color: 'text-purple-400', icon: '👥', href: '/dashboard/customers' },
    { label: 'Aylık Ciro', value: stats.monthlyRevenue.toLocaleString('tr-TR') + ' ₺', color: 'text-emerald-400', icon: '📈', href: '/dashboard/finance' },
    { label: 'Toplam Borç', value: stats.totalDebt.toLocaleString('tr-TR') + ' ₺', color: 'text-red-400', icon: '💳', href: '/dashboard/customers' },
    { label: 'Aktif Garanti', value: stats.activeWarranties, color: 'text-cyan-400', icon: '🛡️', href: '/dashboard/warranties' },
  ]

  const catColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        {dollarRate && (
          <div className="flex items-center gap-4 bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2">
            <span className="text-sm text-slate-400">💵 USD/TRY</span>
            <div className="flex gap-3 text-sm">
              <span className="text-emerald-400">Alış: {dollarRate.alis.toFixed(2)}</span>
              <span className="text-red-400">Satış: {dollarRate.satis.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="stat-card hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-slate-400">{card.label}</h3>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Son 7 Gün Satışları</h3>
          <div className="h-48 flex items-end gap-2 px-2">
            {dailySales.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-emerald-500/80 rounded-t transition-all hover:bg-emerald-400"
                  style={{ height: `${(day.amount / maxDaily) * 160}px`, minHeight: day.amount > 0 ? '4px' : '0' }}
                  title={`${day.date}: ${day.amount.toLocaleString('tr-TR')} ₺`}
                />
                <span className="text-xs text-slate-400">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Pie Chart (CSS) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">🥧 Satış Kategorileri</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {categorySales.reduce((acc, cat, i) => {
                  const prev = acc.prev
                  const pct = (cat.amount / totalCat) * 100
                  const dash = pct * 2.827
                  const offset = 251.2 - (prev * 2.827)
                  acc.elements.push(
                    <circle
                      key={i}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={catColors[i % catColors.length]}
                      strokeWidth="20"
                      strokeDasharray={`${dash} ${251.2 - dash}`}
                      strokeDashoffset={offset}
                    />
                  )
                  acc.prev += pct
                  return acc
                }, { elements: [] as JSX.Element[], prev: 0 }).elements}
              </svg>
            </div>
            <div className="space-y-2">
              {categorySales.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                  <span className="text-sm text-slate-300">{cat.category}</span>
                  <span className="text-sm text-slate-400">{cat.amount.toLocaleString('tr-TR')} ₺</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">⚡ Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/devices" className="btn btn-primary">➕ Yeni Servis</Link>
          <Link href="/dashboard/sales" className="btn btn-primary">🛒 Yeni Satış</Link>
          <Link href="/dashboard/customers" className="btn btn-secondary">👤 Yeni Müşteri</Link>
          <Link href="/dashboard/appointments" className="btn btn-secondary">📅 Randevu Ekle</Link>
        </div>
      </div>
    </div>
  )
}

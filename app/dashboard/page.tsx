'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0, totalCustomers: 0, totalInventory: 0,
    totalWarranties: 0, totalDevices: 0, totalIncome: 0,
    totalExpense: 0, totalDebt: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    setLoading(true)
    const [
      { count: salesCount }, { count: customersCount },
      { count: inventoryCount }, { count: warrantiesCount },
      { count: devicesCount }
    ] = await Promise.all([
      supabase.from('sales').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('inventory').select('*', { count: 'exact', head: true }),
      supabase.from('warranties').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true })
    ])

    const [{ data: incomeData }, { data: expenseData }, { data: debtsData }] = await Promise.all([
      supabase.from('transactions').select('amount').eq('type', 'income'),
      supabase.from('transactions').select('amount').eq('type', 'expense'),
      supabase.from('debts').select('remaining')
    ])

    const totalIncome = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalExpense = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalDebt = debtsData?.reduce((sum, d) => sum + (d.remaining || 0), 0) || 0

    setStats({
      totalSales: salesCount || 0, totalCustomers: customersCount || 0,
      totalInventory: inventoryCount || 0, totalWarranties: warrantiesCount || 0,
      totalDevices: devicesCount || 0, totalIncome, totalExpense, totalDebt
    })
    setLoading(false)
  }

  const cards = [
    { title: 'Toplam Satış', value: stats.totalSales, color: 'text-blue-400', icon: '💰' },
    { title: 'Müşteri Sayısı', value: stats.totalCustomers, color: 'text-emerald-400', icon: '👥' },
    { title: 'Stok Ürünü', value: stats.totalInventory, color: 'text-yellow-400', icon: '📦' },
    { title: 'Aktif Garanti', value: stats.totalWarranties, color: 'text-purple-400', icon: '🛡️' },
    { title: 'Teknik Servis', value: stats.totalDevices, color: 'text-orange-400', icon: '🔧' },
    { title: 'Toplam Borç', value: `₺${stats.totalDebt.toLocaleString('tr-TR')}`, color: 'text-red-400', icon: '📉' },
    { title: 'Toplam Gelir', value: `₺${stats.totalIncome.toLocaleString('tr-TR')}`, color: 'text-emerald-400', icon: '📈' },
    { title: 'Toplam Gider', value: `₺${stats.totalExpense.toLocaleString('tr-TR')}`, color: 'text-red-400', icon: '📉' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.title}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

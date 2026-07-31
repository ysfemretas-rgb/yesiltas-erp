'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0, totalDevices: 0, pendingDevices: 0,
    totalSales: 0, todaySales: 0, monthlyRevenue: 0,
    lowStock: 0, totalDebt: 0, activeWarranty: 0
  })
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [categoryChart, setCategoryChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const todayStart = today + 'T00:00:00'
      const todayEnd = today + 'T23:59:59'
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        customersRes, devicesRes, pendingRes, salesRes,
        todaySalesRes, monthlySalesRes, inventoryRes,
        salesDataRes, debtsRes, warrantiesRes
      ] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'Beklemede'),
        supabase.from('sales').select('total_price'),
        supabase.from('sales').select('total_price').gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('sales').select('total_price').gte('created_at', monthStart),
        supabase.from('inventory').select('id', { count: 'exact', head: true }).lt('quantity', 5),
        supabase.from('sales').select('created_at, total_price').gte('created_at', weekAgo),
        supabase.from('debts').select('remaining_amount'),
        supabase.from('warranties').select('id', { count: 'exact', head: true }).eq('status', 'Aktif')
      ])

      var totalSales = 0
      if (salesRes.data) { for (var i = 0; i < salesRes.data.length; i++) totalSales += salesRes.data[i].total_price || 0 }

      var todaySales = 0
      if (todaySalesRes.data) { for (var i = 0; i < todaySalesRes.data.length; i++) todaySales += todaySalesRes.data[i].total_price || 0 }

      var monthlyRevenue = 0
      if (monthlySalesRes.data) { for (var i = 0; i < monthlySalesRes.data.length; i++) monthlyRevenue += monthlySalesRes.data[i].total_price || 0 }

      var totalDebt = 0
      if (debtsRes.data) { for (var i = 0; i < debtsRes.data.length; i++) totalDebt += debtsRes.data[i].remaining_amount || 0 }

      setStats({
        totalCustomers: customersRes.count || 0,
        totalDevices: devicesRes.count || 0,
        pendingDevices: pendingRes.count || 0,
        totalSales: totalSales, todaySales: todaySales,
        monthlyRevenue: monthlyRevenue, lowStock: inventoryRes.count || 0,
        totalDebt: totalDebt, activeWarranty: warrantiesRes.count || 0
      })

      var dailySales: any = {}
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i)
        dailySales[d.toISOString().split('T')[0]] = 0
      }
      if (salesDataRes.data) {
        for (var i = 0; i < salesDataRes.data.length; i++) {
          var s = salesDataRes.data[i]
          var date = s.created_at ? s.created_at.split('T')[0] : ''
          if (date && dailySales[date] !== undefined) dailySales[date] += s.total_price || 0
        }
      }

      var chartData: any[] = []
      var weekdays = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz']
      for (var key in dailySales) {
        if (dailySales.hasOwnProperty(key)) {
          var d2 = new Date(key)
          var wd = d2.getDay(); if (wd === 0) wd = 6; else wd = wd - 1
          chartData.push({ date: weekdays[wd], amount: dailySales[key] })
        }
      }
      setSalesChart(chartData)

      const { data: invData } = await supabase.from('inventory').select('category, quantity')
      var catMap: any = {}
      if (invData) {
        for (var i = 0; i < invData.length; i++) {
          var item = invData[i]
          var cat = item.category || 'Diger'
          catMap[cat] = (catMap[cat] || 0) + (item.quantity || 0)
        }
      }
      var catChart: any[] = []
      for (var key in catMap) { if (catMap.hasOwnProperty(key)) catChart.push({ name: key, value: catMap[key] }) }
      setCategoryChart(catChart)
    } catch (err) { console.error('Dashboard hatasi:', err) }
    setLoading(false)
  }

  var maxSales = 1
  for (var i = 0; i < salesChart.length; i++) if (salesChart[i].amount > maxSales) maxSales = salesChart[i].amount
  if (maxSales < 1) maxSales = 1

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Ana Panel</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-yellow-400">{stats.pendingDevices}</div>
          <div className="text-xs text-slate-400">Bekleyen Cihaz</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-emerald-400">{stats.totalDevices - stats.pendingDevices}</div>
          <div className="text-xs text-slate-400">Hazir Cihaz</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-blue-400">&#8378;{stats.todaySales.toLocaleString('tr-TR')}</div>
          <div className="text-xs text-slate-400">Bugun Satis</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-red-400">{stats.lowStock}</div>
          <div className="text-xs text-slate-400">Kritik Stok</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-purple-400">{stats.totalCustomers}</div>
          <div className="text-xs text-slate-400">Toplam Musteri</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-emerald-400">&#8378;{stats.monthlyRevenue.toLocaleString('tr-TR')}</div>
          <div className="text-xs text-slate-400">Aylik Ciro</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-red-400">&#8378;{stats.totalDebt.toLocaleString('tr-TR')}</div>
          <div className="text-xs text-slate-400">Toplam Borc</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
          <div className="text-2xl font-bold text-blue-400">{stats.activeWarranty}</div>
          <div className="text-xs text-slate-400">Aktif Garanti</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-lg font-semibold text-white mb-4">Son 7 Gun Satislari</h3>
          <div className="flex items-end gap-2 h-48">
            {salesChart.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-emerald-500/60 rounded-t transition-all duration-500 hover:bg-emerald-500"
                  style={{ height: (day.amount / maxSales * 100) + '%', minHeight: day.amount > 0 ? '4px' : '0' }}
                  title={'&#8378;' + day.amount.toLocaleString('tr-TR')} />
                <span className="text-xs text-slate-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#1e293b] border border-[#334155]">
          <h3 className="text-lg font-semibold text-white mb-4">Stok Kategorileri</h3>
          <div className="space-y-3">
            {categoryChart.map((cat, i) => {
              var total = 0
              for (var j = 0; j < categoryChart.length; j++) total += categoryChart[j].value
              var pct = total > 0 ? (cat.value / total) * 100 : 0
              var colors = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500']
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="font-medium text-white">{cat.value} adet ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0f172a]">
                    <div className={'h-2 rounded-full ' + colors[i % colors.length] + ' transition-all duration-500'} style={{ width: pct + '%' }} />
                  </div>
                </div>
              )
            })}
            {categoryChart.length === 0 && <div className="text-center py-12 text-slate-500"><p>Henüz stok kaydi yok</p></div>}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155]">
        <h3 className="text-lg font-semibold text-white mb-3">Hizli Islemler</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/dashboard/devices" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Yeni Servis</a>
          <a href="/dashboard/sales" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Yeni Satis</a>
          <a href="/dashboard/customers" className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium">Yeni Musteri</a>
          <a href="/dashboard/appointments" className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium">Randevu Ekle</a>
        </div>
      </div>
    </div>
  )
}
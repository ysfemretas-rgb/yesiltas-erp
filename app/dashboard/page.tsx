'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Users, Package, TrendingUp, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
export default function DashboardPage() {
  const [stats, setStats] = useState({ todayServices: 0, activeCustomers: 0, lowStock: 0, dailyRevenue: 0 })
  const [recentServices, setRecentServices] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchDashboardData() }, [])
  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { count: todayServices } = await supabase.from('services').select('*', { count: 'exact', head: true }).gte('created_at', today)
    const { count: activeCustomers } = await supabase.from('customers').select('*', { count: 'exact', head: true })
    const { data: lowStock } = await supabase.from('inventory').select('*').lte('stock_quantity', 5)
    const { data: todaySales } = await supabase.from('sales').select('total_amount').gte('created_at', today)
    const dailyRevenue = todaySales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
    const { data: recent } = await supabase.from('services').select('*, customers(full_name)').order('created_at', { ascending: false }).limit(5)
    setStats({ todayServices: todayServices || 0, activeCustomers: activeCustomers || 0, lowStock: lowStock?.length || 0, dailyRevenue })
    setLowStockItems(lowStock || [])
    setRecentServices(recent || [])
    setLoading(false)
  }
  const statCards = [
    { name: 'Bugünkü Servis', value: stats.todayServices, icon: Wrench, color: 'bg-blue-500', href: '/dashboard/services' },
    { name: 'Aktif Müşteri', value: stats.activeCustomers, icon: Users, color: 'bg-green-500', href: '/dashboard/customers' },
    { name: 'Düşük Stok', value: stats.lowStock, icon: AlertTriangle, color: 'bg-red-500', href: '/dashboard/inventory' },
    { name: 'Günlük Ciro', value: `₺${stats.dailyRevenue.toLocaleString('tr-TR')}`, icon: TrendingUp, color: 'bg-purple-500', href: '/dashboard/sales' },
  ]
  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1><p className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('tr-TR')}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => { const Icon = card.icon; return (
          <Link key={card.name} href={card.href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">{card.name}</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p></div>
              <div className={`${card.color} p-3 rounded-lg`}><Icon className="text-white" size={24} /></div>
            </div>
          </Link>
        )})}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock size={20} className="text-blue-500" />Son Servis Kayıtları</h2><Link href="/dashboard/services" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">Tümü <ChevronRight size={16} /></Link></div>
          <div className="space-y-3">
            {recentServices.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Henüz servis kaydı yok</p> :
              recentServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div><p className="font-medium text-sm text-gray-900 dark:text-white">{service.customers?.full_name || 'İsimsiz'}</p><p className="text-xs text-gray-500">{service.device_type} - {service.problem}</p></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.status === 'Bekliyor' ? 'bg-yellow-100 text-yellow-700' : service.status === 'İşlemde' ? 'bg-blue-100 text-blue-700' : service.status === 'Tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{service.status}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" />Düşük Stok Uyarıları</h2><Link href="/dashboard/inventory" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">Tümü <ChevronRight size={16} /></Link></div>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Stok durumu iyi</p> :
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div><p className="font-medium text-sm text-gray-900 dark:text-white">{item.name}</p><p className="text-xs text-gray-500">SKU: {item.sku}</p></div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-xs font-bold">{item.stock_quantity} adet</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
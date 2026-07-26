'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Wrench, ShoppingCart, Package } from 'lucide-react'
export default function ReportsPage() {
  const [period, setPeriod] = useState('month')
  const [serviceData, setServiceData] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [stockData, setStockData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchData() }, [period])
  const fetchData = async () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const [{ data: services }, { data: sales }, { data: inventory }] = await Promise.all([
      supabase.from('services').select('status, created_at').gte('created_at', since),
      supabase.from('sales').select('total_amount, created_at').gte('created_at', since),
      supabase.from('inventory').select('name, stock_quantity').order('stock_quantity', { ascending: true }).limit(10)
    ])
    const statusCounts: Record<string, number> = {}
    ;(services || []).forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1 })
    setServiceData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })))
    const dailySales: Record<string, number> = {}
    ;(sales || []).forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      dailySales[d] = (dailySales[d] || 0) + (s.total_amount || 0)
    })
    setSalesData(Object.entries(dailySales).map(([name, value]) => ({ name, value })))
    setStockData((inventory || []).map(i => ({ name: i.name, value: i.stock_quantity })))
    setLoading(false)
  }
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']
  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <select className="input w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="week">Son 7 Gün</option><option value="month">Son 30 Gün</option><option value="year">Son 1 Yıl</option>
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wrench size={20} className="text-blue-500" />Servis Durumları</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={serviceData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>{serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={20} className="text-green-500" />Satış Grafiği</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#10b981" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package size={20} className="text-red-500" />Düşük Stok Ürünleri</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#ef4444" /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
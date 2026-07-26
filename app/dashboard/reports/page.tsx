'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { useToast } from '@/components/toast'
import jsPDF from 'jspdf'

export default function ReportsPage() {
  const [period, setPeriod] = useState(30)
  const [salesData, setSalesData] = useState<any[]>([])
  const [serviceData, setServiceData] = useState<any[]>([])
  const [financeData, setFinanceData] = useState<any[]>([])
  const { showToast, ToastComponent } = useToast()

  const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899']

  useEffect(() => { fetchData() }, [period])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const since = new Date(Date.now() - period * 86400000).toISOString()

    const [{ data: sales }, { data: services }, { data: finance }] = await Promise.all([
      supabase.from('sales').select('*, sale_items(*)').eq('user_id', user?.id).gte('created_at', since),
      supabase.from('services').select('*').eq('user_id', user?.id).gte('created_at', since),
      supabase.from('finance_transactions').select('*').eq('user_id', user?.id).gte('created_at', since)
    ])

    const paymentGroups: Record<string, number> = {}
    ;(sales || []).forEach(s => { paymentGroups[s.payment_type] = (paymentGroups[s.payment_type] || 0) + s.total_amount })
    setSalesData(Object.entries(paymentGroups).map(([name, value]) => ({ name, value })))

    const statusGroups: Record<string, number> = {}
    ;(services || []).forEach(s => { statusGroups[s.status] = (statusGroups[s.status] || 0) + 1 })
    setServiceData(Object.entries(statusGroups).map(([name, value]) => ({ name, value })))

    const dailyGroups: Record<string, { income: number, expense: number }> = {}
    ;(finance || []).forEach(f => {
      const day = new Date(f.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      if (!dailyGroups[day]) dailyGroups[day] = { income: 0, expense: 0 }
      if (f.type === 'income') dailyGroups[day].income += f.amount
      else dailyGroups[day].expense += f.amount
    })
    setFinanceData(Object.entries(dailyGroups).map(([date, v]) => ({ date, gelir: v.income, gider: v.expense })))
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Yeşiltaş Teknoloji - Rapor', 14, 20)
    doc.setFontSize(12)
    doc.text(`Dönem: Son ${period} gün`, 14, 30)
    doc.text(`Toplam Satış: ${salesData.reduce((s, d) => s + d.value, 0).toLocaleString('tr-TR')} ₺`, 14, 40)
    doc.save('rapor.pdf')
    showToast('PDF indirildi')
  }

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <button onClick={exportPDF} className="btn-secondary flex items-center gap-2"><Download size={16}/> PDF İndir</button>
      </div>

      <div className="flex gap-2">
        {[7, 30, 90, 365].map(d => (
          <button key={d} onClick={() => setPeriod(d)} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === d ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            Son {d} Gün
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Satışlar - Ödeme Tipi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={salesData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {salesData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => value.toLocaleString('tr-TR') + ' ₺'} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Servis Durumları</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {serviceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-4">Gelir / Gider Grafiği</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString('tr-TR') + ' ₺'} />
              <Legend />
              <Bar dataKey="gelir" fill="#16a34a" />
              <Bar dataKey="gider" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

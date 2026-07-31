'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Sale {
  id: string
  customer_id: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string
  remaining_amount: number
  warranty_months: number
  warranty_end_date: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function SoldDevicesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = sales
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(s => s.item_name.toLowerCase().includes(term))
    }
    setFiltered(result)
  }, [search, sales])

  const loadData = async () => {
    setLoading(true)
    const [salesRes, customersRes] = await Promise.all([
      supabase.from('sales').select('*').eq('item_type', 'Cihaz').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone')
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    setLoading(false)
  }

  const isWarrantyActive = (endDate: string) => {
    return endDate ? new Date(endDate) > new Date() : false
  }

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return 0
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Satilan Cihazlar</h1>
      </div>

      <input type="text" className="input" placeholder="Cihaz ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Cihaz</th>
              <th>Musteri</th>
              <th>Tutar</th>
              <th>Odeme</th>
              <th>Garanti</th>
              <th>Kalan Sure</th>
              <th>Satis Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => {
              const customer = customers.find(c => c.id === sale.customer_id)
              const active = isWarrantyActive(sale.warranty_end_date)
              const daysLeft = daysUntilExpiry(sale.warranty_end_date)
              return (
                <tr key={sale.id}>
                  <td className="font-medium text-white">{sale.item_name}</td>
                  <td className="text-slate-300">{customer?.name || 'Bilinmiyor'}<br/><span className="text-xs text-slate-500">{customer?.phone}</span></td>
                  <td className="text-slate-300">{sale.total_price?.toLocaleString('tr-TR')} TL</td>
                  <td>
                    {sale.payment_method}
                    {sale.remaining_amount > 0 && <div className="text-xs text-red-400">Kalan: {sale.remaining_amount?.toLocaleString('tr-TR')} TL</div>}
                  </td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Aktif' : 'Sona Erdi'}</span></td>
                  <td className={daysLeft < 30 ? 'text-red-400' : 'text-slate-300'}>
                    {active ? `${daysLeft} gun` : 'Sona erdi'}
                  </td>
                  <td className="text-slate-400 text-sm">{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henuz satilan cihaz kaydi yok</p>
        </div>
      )}
    </div>
  )
}

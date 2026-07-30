'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalDevices: 0,
    totalCustomers: 0,
    totalInventory: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    pendingDebts: 0,
    activeWarranties: 0
  })
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [recentDevices, setRecentDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      salesRes,
      devicesRes,
      customersRes,
      inventoryRes,
      transactionsRes,
      debtsRes,
      warrantiesRes,
      recentSalesRes,
      recentDevicesRes
    ] = await Promise.all([
      supabase.from('sales').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('inventory').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('tip, miktar').gte('oluşturulma_tarihi', firstDayOfMonth),
      supabase.from('debts').select('*').eq('durum', 'Beklemede'),
      supabase.from('warranties').select('*'),
      supabase.from('sales').select('*, customers:müşteri_kimliği(ad)').order('oluşturulma_tarihi', { ascending: false }).limit(5),
      supabase.from('devices').select('*, customers:müşteri_kimliği(ad)').order('oluşturulma_tarihi', { ascending: false }).limit(5)
    ])

    const monthlyIncome = (transactionsRes.data || []).filter(t => t.tip === 'gelir').reduce((sum, t) => sum + (t.miktar || 0), 0)
    const monthlyExpense = (transactionsRes.data || []).filter(t => t.tip === 'gider').reduce((sum, t) => sum + (t.miktar || 0), 0)
    const activeWarranties = (warrantiesRes.data || []).filter(w => w.garanti_bitiş_tarihi ? new Date(w.garanti_bitiş_tarihi) > now : false).length

    setStats({
      totalSales: salesRes.count || 0,
      totalDevices: devicesRes.count || 0,
      totalCustomers: customersRes.count || 0,
      totalInventory: inventoryRes.count || 0,
      monthlyIncome,
      monthlyExpense,
      pendingDebts: debtsRes.data?.length || 0,
      activeWarranties
    })

    if (recentSalesRes.data) setRecentSales(recentSalesRes.data)
    if (recentDevicesRes.data) setRecentDevices(recentDevicesRes.data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Toplam Satış</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalSales}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Teknik Servis</div>
          <div className="text-2xl font-bold text-blue-400">{stats.totalDevices}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Müşteriler</div>
          <div className="text-2xl font-bold text-purple-400">{stats.totalCustomers}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Stok Ürünleri</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.totalInventory}</div>
        </div>
      </div>

      {/* Finans Özeti */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div className="text-sm" style={{ color: '#4ade80' }}>Bu Ay Gelir</div>
          <div className="text-xl font-bold text-emerald-400">₺{stats.monthlyIncome.toLocaleString('tr-TR')}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-sm" style={{ color: '#f87171' }}>Bu Ay Gider</div>
          <div className="text-xl font-bold text-red-400">₺{stats.monthlyExpense.toLocaleString('tr-TR')}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <div className="text-sm" style={{ color: '#facc15' }}>Bekleyen Borçlar</div>
          <div className="text-xl font-bold text-yellow-400">{stats.pendingDebts}</div>
        </div>
      </div>

      {/* Son İşlemler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Son Satışlar</h2>
          {recentSales.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz satış yok</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'var(--bg-body)' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.ürün_adı}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.customers?.ad || 'Bilinmiyor'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">₺{s.toplam_fiyat?.toLocaleString('tr-TR')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(s.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Son Teknik Servis</h2>
          {recentDevices.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz cihaz kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {recentDevices.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: 'var(--bg-body)' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.marka} {d.model}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.customers?.ad || 'Bilinmiyor'}</div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${d.durum === 'Tamamlandı' ? 'badge-green' : d.durum === 'Beklemede' ? 'badge-yellow' : 'badge-blue'}`}>{d.durum}</span>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(d.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

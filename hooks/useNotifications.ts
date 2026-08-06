'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchInventory } from '@/lib/inventory'
import { fetchWarranties } from '@/lib/warranties'
import { fetchCustomers } from '@/lib/customers'
import { fetchRepairs } from '@/lib/repairs'

export interface AppNotification {
  id: string
  message: string
  link: string
  severity: 'warning' | 'danger'
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// Artık gerçek verileri (envanter, garanti, müşteri borcu, bekleyen tamir)
// doğrudan Supabase'den okuyup aksiyon alınması gereken durumları tek bir
// bildirim listesinde toplar.
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const refresh = useCallback(async () => {
    const list: AppNotification[] = []

    try {
      const inventory = await fetchInventory()
      inventory.forEach((item) => {
        if (item.quantity <= item.minQuantity) {
          list.push({
            id: `inv-${item.id}`,
            message: `📦 Stok azaldı: ${item.name} (${item.quantity} adet kaldı)`,
            link: '/dashboard/inventory',
            severity: item.quantity === 0 ? 'danger' : 'warning',
          })
        }
      })
    } catch (e) {
      console.error('Envanter bildirimleri yüklenemedi:', e)
    }

    try {
      const warranties = await fetchWarranties()
      warranties.forEach((w) => {
        if (w.status === 'expired' || !w.endDate) return
        const d = daysUntil(w.endDate)
        if (d < 0) {
          list.push({
            id: `war-${w.id}`,
            message: `🛡️ Garanti süresi doldu: ${w.deviceName} (${w.customerName})`,
            link: '/dashboard/warranties',
            severity: 'danger',
          })
        } else if (d <= 30) {
          list.push({
            id: `war-${w.id}`,
            message: `🛡️ Garanti ${d} gün içinde bitiyor: ${w.deviceName} (${w.customerName})`,
            link: '/dashboard/warranties',
            severity: 'warning',
          })
        }
      })
    } catch (e) {
      console.error('Garanti bildirimleri yüklenemedi:', e)
    }

    try {
      const customers = await fetchCustomers()
      customers.forEach((c) => {
        if (c.totalDebt > 0) {
          list.push({
            id: `debt-${c.id}`,
            message: `💰 ${c.name} adlı müşterinin ${c.totalDebt.toLocaleString('tr-TR')} TL borcu var`,
            link: '/dashboard/customers',
            severity: 'warning',
          })
        }
      })
    } catch (e) {
      console.error('Müşteri bildirimleri yüklenemedi:', e)
    }

    try {
      const repairs = await fetchRepairs()
      repairs.forEach((r) => {
        if (r.status !== 'waiting' || !r.createdAt) return
        const waitingDays = -daysUntil(r.createdAt)
        if (waitingDays >= 2) {
          list.push({
            id: `rep-${r.id}`,
            message: `🔧 ${r.customerName} — ${waitingDays} gündür bekliyor`,
            link: '/dashboard/repairs',
            severity: waitingDays >= 5 ? 'danger' : 'warning',
          })
        }
      })
    } catch (e) {
      console.error('Tamir bildirimleri yüklenemedi:', e)
    }

    setNotifications(list)
  }, [])

  useEffect(() => {
    refresh()
    // Sayfa arka planda açık kalırsa diye periyodik tazeleme
    const interval = setInterval(refresh, 120000)
    return () => clearInterval(interval)
  }, [refresh])

  return { notifications, refresh }
}

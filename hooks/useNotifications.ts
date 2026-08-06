'use client'

import { useState, useEffect, useCallback } from 'react'

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

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

// Uygulamada zaten var olan verileri (envanter, garanti, müşteri borcu, bekleyen
// tamir) tarayıp aksiyon alınması gereken durumları tek bir bildirim listesinde
// toplar. Ayrı bir bildirim veritabanı gerektirmez, mevcut localStorage
// verilerinden türetilir.
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return
    const list: AppNotification[] = []

    // Kritik/düşük stok
    const inventory = safeParse<any[]>('yt_inventory', [])
    inventory.forEach((item) => {
      if (typeof item?.quantity === 'number' && typeof item?.minQuantity === 'number' && item.quantity <= item.minQuantity) {
        list.push({
          id: `inv-${item.id}`,
          message: `📦 Stok azaldı: ${item.name} (${item.quantity} adet kaldı)`,
          link: '/dashboard/inventory',
          severity: item.quantity === 0 ? 'danger' : 'warning',
        })
      }
    })

    // Süresi yaklaşan/dolmuş garantiler
    const warranties = safeParse<any[]>('yt_warranties', [])
    warranties.forEach((w) => {
      if (w?.status === 'expired') return
      if (!w?.endDate) return
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

    // Ödenmemiş müşteri borçları
    const customers = safeParse<any[]>('yt_customers', [])
    customers.forEach((c) => {
      if (typeof c?.totalDebt === 'number' && c.totalDebt > 0) {
        list.push({
          id: `debt-${c.id}`,
          message: `💰 ${c.name} adlı müşterinin ${c.totalDebt.toLocaleString('tr-TR')} TL borcu var`,
          link: '/dashboard/customers',
          severity: 'warning',
        })
      }
    })

    // 2 günden uzun süredir bekleyen tamirler
    const repairs = safeParse<any[]>('yt_repairs', [])
    repairs.forEach((r) => {
      if (r?.status !== 'waiting' || !r?.createdAt) return
      const waitingDays = -daysUntil(r.createdAt)
      if (waitingDays >= 2) {
        list.push({
          id: `rep-${r.id}`,
          message: `🔧 #${r.id} ${waitingDays} gündür bekliyor: ${r.customerName}`,
          link: '/dashboard/repairs',
          severity: waitingDays >= 5 ? 'danger' : 'warning',
        })
      }
    })

    setNotifications(list)
  }, [])

  useEffect(() => {
    refresh()
    // Sayfa arka planda açık kalırsa diye periyodik tazeleme
    const interval = setInterval(refresh, 60000)
    window.addEventListener('storage', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return { notifications, refresh }
}

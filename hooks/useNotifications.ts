'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchInventory } from '@/lib/inventory'
import { fetchWarranties } from '@/lib/warranties'
import { fetchCustomers } from '@/lib/customers'
import { fetchRepairs } from '@/lib/repairs'
import { fetchSales } from '@/lib/sales'
import { computeCustomerDebts } from '@/lib/customerDebt'

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
const SEEN_KEY = 'yt_seen_notifications'
const DISMISSED_KEY = 'yt_dismissed_notifications'

function getSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveDismissedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // yoksay
  }
}

export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedIds())
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getSeenIds())

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
        if (!w.endDate) return
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
      const [customers, allRepairs, allSales] = await Promise.all([
        fetchCustomers(),
        fetchRepairs().catch(() => []),
        fetchSales().catch(() => []),
      ])
      // Borç = tamir + satış kalanı + elle girilen borçlar (ortak hesaplama)
      const debts = computeCustomerDebts(customers, allRepairs as any, allSales as any)
      customers.forEach((c) => {
        const debt = debts.get(c.id) || 0
        if (debt > 0) {
          list.push({
            id: `debt-${c.id}`,
            message: `💰 ${c.name} adlı müşterinin ${debt.toLocaleString('tr-TR')} TL borcu var`,
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

    setAllNotifications(list)
    // Sorunu çözülen (artık listede olmayan) bildirimlerin "silindi" işareti temizlenir;
    // aynı sorun ileride tekrar çıkarsa yeniden bildirilir.
    setDismissedIds((prev) => {
      const currentIds = new Set(list.map((n) => n.id))
      const next = new Set<string>((Array.from(prev) as string[]).filter((id) => currentIds.has(id)))
      if (next.size !== prev.size) saveDismissedIds(next)
      return next.size !== prev.size ? next : prev
    })
  }, [])

  useEffect(() => {
    refresh()
    // Sayfa arka planda açık kalırsa diye periyodik tazeleme
    const interval = setInterval(refresh, 120000)
    return () => clearInterval(interval)
  }, [refresh])

  // Bildirimleri "görüldü" olarak işaretler — bunları bir daha kırmızı
  // rozette saymaz, ama aynı sorun devam ettiği sürece listede görünmeye
  // devam eder (sorun çözülene kadar tamamen kaybolmaz).
  const notifications = allNotifications.filter((n) => !dismissedIds.has(n.id))

  // Tek bildirimi sil (sorun çözülene kadar tekrar gösterilmez)
  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set<string>(prev)
      next.add(id)
      saveDismissedIds(next)
      return next
    })
  }, [])

  // Hepsini sil
  const dismissAll = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set<string>(prev)
      allNotifications.forEach((n) => next.add(n.id))
      saveDismissedIds(next)
      return next
    })
  }, [allNotifications])

  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => next.add(n.id))
      if (typeof window !== 'undefined') {
        localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(next)))
      }
      return next
    })
  }, [notifications])

  const unseenCount = notifications.filter((n) => !seenIds.has(n.id)).length

  return { notifications, refresh, markAllSeen, unseenCount, dismissNotification, dismissAll }
}

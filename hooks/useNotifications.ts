'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchInventory } from '@/lib/inventory'
import { fetchWarranties } from '@/lib/warranties'
import { fetchCustomers } from '@/lib/customers'
import { fetchRepairs } from '@/lib/repairs'
import { fetchSales } from '@/lib/sales'
import { computeCustomerDebts } from '@/lib/customerDebt'
import { fetchScheduledPayments } from '@/lib/scheduledPayments'

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

// Gerçek verileri (envanter, garanti, müşteri borcu, bekleyen tamir) Supabase'den
// BİR KEZ okuyup aksiyon alınması gereken durumları tek bir bildirim listesinde toplar.
// (Eskiden tamir ve satış listeleri aynı turda iki kez indiriliyordu.)
const SEEN_KEY = 'yt_seen_notifications'
const DISMISSED_KEY = 'yt_dismissed_notifications'

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<string>()
  }
}

function writeSet(key: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)))
  } catch {
    // yoksay
  }
}

export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => readSet(DISMISSED_KEY))
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readSet(SEEN_KEY))

  const refresh = useCallback(async () => {
    const list: AppNotification[] = []

    const [invR, warR, custR, repR, salR, payR] = await Promise.allSettled([
      fetchInventory(),
      fetchWarranties(),
      fetchCustomers(),
      fetchRepairs(),
      fetchSales(),
      fetchScheduledPayments(),
    ])

    if (invR.status === 'fulfilled') {
      invR.value.forEach((item) => {
        if (item.minQuantity > 0 && item.quantity <= item.minQuantity) {
          list.push({
            id: `inv-${item.id}`,
            message: `📦 Stok azaldı: ${item.name} (${item.quantity} adet kaldı)`,
            link: '/dashboard/inventory',
            severity: item.quantity === 0 ? 'danger' : 'warning',
          })
        }
      })
    }

    if (warR.status === 'fulfilled') {
      warR.value.forEach((w) => {
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
    }

    const repairs = repR.status === 'fulfilled' ? repR.value : []
    const sales = salR.status === 'fulfilled' ? salR.value : []

    if (custR.status === 'fulfilled') {
      // Borç = tamir + satış kalanı + elle girilen borçlar (ortak hesaplama)
      const debts = computeCustomerDebts(custR.value, repairs as any, sales as any)
      custR.value.forEach((c) => {
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
    }

    if (repR.status === 'fulfilled') {
      // Tahmini teslim tarihi geçen / yaklaşan tamirler
      repairs.forEach((r) => {
        if (!r.estimatedDelivery || r.status === 'completed') return
        const d = daysUntil(r.estimatedDelivery)
        if (d > 1) return
        list.push({
          id: `eta-${r.id}`,
          message: d < 0 ? `⏰ Teslim tarihi geçti (${-d} gün): ${r.customerName} — ${r.brand} ${r.model}` : d === 0 ? `⏰ Bugün teslim edilecek: ${r.customerName} — ${r.brand} ${r.model}` : `⏰ Yarın teslim edilecek: ${r.customerName} — ${r.brand} ${r.model}`,
          link: '/dashboard/repairs',
          severity: d < 0 ? 'danger' : 'warning',
        })
      })
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
    }

    // Ödeme takvimi: gecikmiş veya 3 gün içinde vadesi gelen ödemeler
    if (payR.status === 'fulfilled') {
      payR.value.forEach((p) => {
        if (p.status !== 'pending') return
        const d = daysUntil(p.dueDate)
        if (d > 3) return
        list.push({
          id: `pay-${p.id}`,
          message: d < 0 ? `📅 Ödeme gecikti (${-d} gün): ${p.title} — ${p.amount.toLocaleString('tr-TR')} TL` : d === 0 ? `📅 Bugün ödeme günü: ${p.title} — ${p.amount.toLocaleString('tr-TR')} TL` : `📅 ${d} gün sonra ödeme: ${p.title} — ${p.amount.toLocaleString('tr-TR')} TL`,
          link: '/dashboard/finance',
          severity: d < 0 ? 'danger' : 'warning',
        })
      })
    }

    setAllNotifications(list)

    // Sorunu çözülen (artık listede olmayan) bildirimlerin "silindi" işareti temizlenir; aynı sorun
    // ileride tekrar çıkarsa yeniden bildirilir. Bir veri kaynağı yüklenemediyse (ağ hatası) temizlik
    // yapılmaz, yoksa silinen bildirimler geri gelirdi.
    const allOk = [invR, warR, custR, repR, salR].every((r) => r.status === 'fulfilled')
    if (allOk) {
      const currentIds = new Set<string>(list.map((n) => n.id))
      setDismissedIds((prev) => {
        const next = new Set<string>((Array.from(prev) as string[]).filter((id) => currentIds.has(id)))
        return next.size !== prev.size ? next : prev
      })
    }
  }, [])

  useEffect(() => {
    refresh()
    // Sayfa arka planda açık kalırsa diye periyodik tazeleme
    const interval = setInterval(refresh, 120000)
    return () => clearInterval(interval)
  }, [refresh])

  // Kalıcı kayıt (state güncelleyicisinin içinde değil, ayrı efektte yapılır)
  useEffect(() => { writeSet(DISMISSED_KEY, dismissedIds) }, [dismissedIds])
  useEffect(() => { writeSet(SEEN_KEY, seenIds) }, [seenIds])

  const notifications = allNotifications.filter((n) => !dismissedIds.has(n.id))

  // Tek bildirimi sil (sorun çözülene kadar tekrar gösterilmez)
  const dismissNotification = useCallback((id: string) => {
    setDismissedIds((prev) => new Set<string>(prev).add(id))
  }, [])

  // Hepsini sil
  const dismissAll = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set<string>(prev)
      allNotifications.forEach((n) => next.add(n.id))
      return next
    })
  }, [allNotifications])

  // Bildirimleri "görüldü" olarak işaretler — rozet sayısına bir daha girmez
  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const next = new Set<string>(prev)
      notifications.forEach((n) => next.add(n.id))
      return next
    })
  }, [notifications])

  const unseenCount = notifications.filter((n) => !seenIds.has(n.id)).length

  return { notifications, refresh, markAllSeen, unseenCount, dismissNotification, dismissAll }
}

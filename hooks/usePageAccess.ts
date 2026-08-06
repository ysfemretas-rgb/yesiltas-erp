'use client'

import { useState, useEffect } from 'react'

interface UserData {
  role?: string
  permissions?: string[]
}

// Tek merkezi sayfa yetki kontrolü. Önceden her sayfa (appointments, consumables,
// customers, finance, inventory, repairs, reports, sales, settings, staff,
// suppliers, warranties) bu mantığı ayrı ayrı kopyalamıştı — bazılarında
// "Yönetici" yerine yanlışlıkla "admin" string'i aranıyordu. Artık tek yerden
// yönetiliyor.
export function usePageAccess(requiredPermission: string) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const userStr = localStorage.getItem('yt_user')
      if (!userStr) {
        window.location.href = '/login'
        return
      }

      const user: UserData = JSON.parse(userStr)
      const hasAccess = user.role === 'Yönetici' || (user.permissions || []).includes(requiredPermission)

      if (hasAccess) {
        setAuthorized(true)
        setChecking(false)
      } else {
        window.location.href = '/dashboard'
      }
    } catch (e) {
      console.error('Yetki kontrolü hatası:', e)
      window.location.href = '/login'
    }
  }, [requiredPermission])

  return { authorized, checking }
}

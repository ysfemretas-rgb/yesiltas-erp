'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserData {
  role?: string
  permissions?: string[]
  [key: string]: unknown
}

// Tek merkezi sayfa yetki kontrolü.
// Eskiden rol/izinler sadece tarayıcıdaki localStorage'dan okunuyordu; konsoldan
// role "Yönetici" yazan herkes tüm sayfaları açabiliyordu. Artık geçerli bir
// Supabase oturumu ve veritabanındaki (profiles) güncel rol/izinler doğrulanıyor;
// doğrulanan değerler localStorage'a geri yazılır. (Ağ hatasında yerel bilgiyle devam eder.)
export function usePageAccess(requiredPermission: string) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const goLogin = () => {
      try { localStorage.removeItem('yt_user') } catch { /* yoksay */ }
      window.location.href = '/login'
    }

    const run = async () => {
      let user: UserData
      try {
        const userStr = localStorage.getItem('yt_user')
        if (!userStr) { goLogin(); return }
        user = JSON.parse(userStr)
      } catch (e) {
        console.error('Yetki kontrolü hatası:', e)
        goLogin()
        return
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session
        if (!session) { goLogin(); return }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, permissions, is_active')
          .eq('id', session.user.id)
          .single()

        if (!error && profile) {
          if (profile.is_active === false) { await supabase.auth.signOut(); goLogin(); return }
          user = { ...user, role: profile.role, permissions: profile.permissions || [] }
          localStorage.setItem('yt_user', JSON.stringify(user))
        }
      } catch (e) {
        console.error('Oturum doğrulanamadı, yerel bilgiyle devam ediliyor:', e)
      }

      if (cancelled) return
      const hasAccess = user.role === 'Yönetici' || (user.permissions || []).includes(requiredPermission)
      if (hasAccess) {
        setAuthorized(true)
        setChecking(false)
      } else {
        window.location.href = '/dashboard'
      }
    }

    run()
    return () => { cancelled = true }
  }, [requiredPermission])

  return { authorized, checking }
}

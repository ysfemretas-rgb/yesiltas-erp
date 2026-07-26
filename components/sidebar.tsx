'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Wrench, Package, ShoppingCart, Receipt, Briefcase, BarChart3, Settings, LogOut, Sun, Moon, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Müşteriler', href: '/dashboard/customers', icon: Users },
  { name: 'Teknik Servis', href: '/dashboard/services', icon: Wrench },
  { name: 'Stok', href: '/dashboard/inventory', icon: Package },
  { name: 'Satış', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Tedarik', href: '/dashboard/purchases', icon: Truck },
  { name: 'Finans', href: '/dashboard/finance', icon: Receipt },
  { name: 'Ortaklık', href: '/dashboard/partners', icon: Briefcase },
  { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email || '')
    }
    getUser()
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true)
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (typeof window === 'undefined') return
    if (darkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    } else {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img src="/logo.png" alt="Yeşiltaş" className="w-10 h-10 object-contain" onError={() => setLogoError(true)} />
          ) : (
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">Y</div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Yeşiltaş</h1>
            <p className="text-xs text-green-600 font-medium">ERP Sistemi</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              <Icon size={18} />{item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 px-3"><p className="truncate">{userEmail}</p></div>
        <button onClick={toggleDarkMode} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}{darkMode ? 'Açık Tema' : 'Koyu Tema'}
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={18} />Çıkış Yap
        </button>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center pt-2">Geliştirici: Yusuf Emre TAŞ</p>
      </div>
    </aside>
  )
}
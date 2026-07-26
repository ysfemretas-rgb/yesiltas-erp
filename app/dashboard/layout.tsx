'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, Wrench, Package, ShoppingCart, ShoppingBag, Wallet, BarChart3, Settings, LogOut, Menu, X, Users2 } from 'lucide-react'

const menuItems = [
  { href: '/dashboard/customers', label: 'Müşteriler', icon: Users },
  { href: '/dashboard/services', label: 'Teknik Servis', icon: Wrench },
  { href: '/dashboard/inventory', label: 'Stok', icon: Package },
  { href: '/dashboard/sales', label: 'Satış', icon: ShoppingCart },
  { href: '/dashboard/purchases', label: 'Alış / Tedarik', icon: ShoppingBag },
  { href: '/dashboard/finance', label: 'Finans', icon: Wallet },
  { href: '/dashboard/partners', label: 'Ortaklık', icon: Users2 },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUser(data.user)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Yeşiltaş ERP</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X size={20}/></button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <Icon size={18}/> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-xs text-gray-500 mb-2 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 w-full px-3 py-2 rounded-lg">
            <LogOut size={16}/> Çıkış Yap
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu size={20}/></button>
          <span className="font-bold text-gray-900 dark:text-white">Yeşiltaş ERP</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

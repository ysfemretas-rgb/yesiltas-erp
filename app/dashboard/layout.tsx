'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { href: '/dashboard', label: '📊 Dashboard', icon: '📊' },
  { href: '/dashboard/settings', label: '⚙️ Ayarlar', icon: '⚙️' },
  { href: '/dashboard/customers', label: '👥 Müşteriler', icon: '👥' },
  { href: '/dashboard/devices', label: '🔧 Teknik Servis', icon: '🔧' },
  { href: '/dashboard/sold-devices', label: '📱 Satılan Cihazlar', icon: '📱' },
  { href: '/dashboard/sales', label: '💰 Satış (POS)', icon: '💰' },
  { href: '/dashboard/inventory', label: '📦 Stok', icon: '📦' },
  { href: '/dashboard/consumables', label: '🔩 Sarf Malzeme', icon: '🔩' },
  { href: '/dashboard/finance', label: '💳 Kasa', icon: '💳' },
  { href: '/dashboard/appointments', label: '📅 Randevular', icon: '📅' },
  { href: '/dashboard/warranties', label: '🛡️ Garantiler', icon: '🛡️' },
  { href: '/dashboard/staff', label: '👨‍🔧 Personel', icon: '👨‍🔧' },
  { href: '/dashboard/reports', label: '📈 Raporlar', icon: '📈' },
  { href: '/dashboard/suppliers', label: '🏭 Tedarikçiler', icon: '🏭' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('logo_url').single()
    if (data?.logo_url) setLogoUrl(data.logo_url)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1e293b] border-r border-[#334155]
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-[#334155] flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                YT
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Yeşiltaş</h1>
              <p className="text-emerald-400 text-xs">Teknoloji ERP</p>
            </div>
          </Link>
        </div>

        {/* Menu - scrollable */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label.replace(/^. /, '')}</span>
            </Link>
          ))}
        </nav>

        {/* Logout - fixed at bottom */}
        <div className="p-3 border-t border-[#334155] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#1e293b] border-b border-[#334155] p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#334155] text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white font-semibold">Yeşiltaş ERP</h1>
        </header>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

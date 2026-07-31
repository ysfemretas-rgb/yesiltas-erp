'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { href: '/dashboard', label: 'Ana Panel', icon: '📊' },
  { href: '/dashboard/sales', label: 'Satış (POS)', icon: '💰' },
  { href: '/dashboard/devices', label: 'Teknik Servis', icon: '🔧' },
  { href: '/dashboard/customers', label: 'Müşteriler', icon: '👥' },
  { href: '/dashboard/appointments', label: 'Randevular', icon: '📅' },
  { href: '/dashboard/inventory', label: 'Stok', icon: '📦' },
  { href: '/dashboard/consumables', label: 'Sarf Malzeme', icon: '🔩' },
  { href: '/dashboard/finance', label: 'Kasa', icon: '💳' },
  { href: '/dashboard/warranties', label: 'Garantiler', icon: '🛡️' },
  { href: '/dashboard/staff', label: 'Personel', icon: '👨‍🔧' },
  { href: '/dashboard/reports', label: 'Raporlar', icon: '📈' },
  { href: '/dashboard/suppliers', label: 'Tedarikçiler', icon: '🏭' },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('Yeşiltaş Teknoloji')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('logo_url, company_name').single()
      if (data) {
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.company_name) setCompanyName(data.company_name)
      }
    } catch (e) {}
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 
        bg-[#1e293b] border-r border-[#334155]
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
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
              <h1 className="font-bold text-sm leading-tight text-white">{companyName}</h1>
              <p className="text-emerald-500 text-xs">Teknoloji ERP</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'text-slate-400 hover:bg-[#334155] hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-[#334155] flex-shrink-0 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="text-lg">🚪</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0f172a]">
        <header className="lg:hidden p-4 flex items-center gap-3 border-b bg-[#1e293b] border-[#334155]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#334155] text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-white">{companyName}</h1>
        </header>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
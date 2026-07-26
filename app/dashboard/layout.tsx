'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLiveRate } from '@/hooks/useLiveRate'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/sales', label: 'Satış (POS)', icon: '💰' },
  { href: '/dashboard/devices', label: 'Teknik Servis', icon: '🔧' },
  { href: '/dashboard/sold-devices', label: 'Satılan Cihazlar', icon: '📱' },
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
  const [darkMode, setDarkMode] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { rate, loading, refresh } = useLiveRate()

  useEffect(() => {
    loadSettings()
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') setDarkMode(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('logo_url, company_name').single()
    if (data) {
      if (data.logo_url) setLogoUrl(data.logo_url)
      if (data.company_name) setCompanyName(data.company_name)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 
        ${darkMode ? 'bg-[#1e293b] border-r border-[#334155]' : 'bg-white border-r border-gray-200'}
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className={`p-4 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-200'} flex-shrink-0`}>
          <Link href="/dashboard" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                YT
              </div>
            )}
            <div>
              <h1 className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{companyName}</h1>
              <p className="text-emerald-500 text-xs">Teknoloji ERP</p>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : darkMode
                    ? 'text-slate-400 hover:bg-[#334155] hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`p-3 border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'} flex-shrink-0 space-y-2`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              darkMode
                ? 'text-slate-400 hover:bg-[#334155] hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Açık Mod' : 'Koyu Mod'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="text-lg">🚪</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
        <header className={`lg:hidden p-4 flex items-center gap-3 border-b ${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{companyName}</h1>
        </header>

        {/* ✅ TEK CANLI DÖVİZ KURU - Sağ Üstte (Alış + Satış + Yenile + Zaman) */}
        <div className="flex justify-end px-4 lg:px-6 pt-4">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
            darkMode 
              ? 'bg-[#1e293b] border border-[#334155] text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            <span className="text-lg">💵</span>
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider opacity-70">USD/TRY (CANLI)</div>
              <div className="flex items-center gap-3 mt-0.5">
                {loading ? (
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Yükleniyor...</span>
                ) : rate.buying && rate.selling ? (
                  <>
                    <span className="text-emerald-500 font-bold">Alış: ₺{rate.buying.toFixed(4)}</span>
                    <span className={`${darkMode ? 'text-slate-500' : 'text-gray-300'}`}>|</span>
                    <span className="text-red-400 font-bold">Satış: ₺{rate.selling.toFixed(4)}</span>
                  </>
                ) : (
                  <span className="text-red-400 text-xs">Hata</span>
                )}
                <button 
                  onClick={refresh} 
                  className="text-emerald-500 hover:text-emerald-400 text-xs ml-1"
                  title="Yenile"
                >
                  🔄
                </button>
              </div>
              {rate.lastUpdated && (
                <div className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  Son Güncelleme: {rate.lastUpdated.toLocaleTimeString('tr-TR')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

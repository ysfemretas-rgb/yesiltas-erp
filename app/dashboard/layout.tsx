'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLiveRate } from '@/hooks/useLiveRate'

const menuItems = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/dashboard/sales', label: '💰 Satış (POS)' },
  { href: '/dashboard/devices', label: '🔧 Teknik Servis' },
  { href: '/dashboard/sold-devices', label: '📱 Satılan Cihazlar' },
  { href: '/dashboard/customers', label: '👥 Müşteriler' },
  { href: '/dashboard/appointments', label: '📅 Randevular' },
  { href: '/dashboard/inventory', label: '📦 Stok' },
  { href: '/dashboard/consumables', label: '🔩 Sarf Malzeme' },
  { href: '/dashboard/finance', label: '💳 Kasa' },
  { href: '/dashboard/warranties', label: '🛡️ Garantiler' },
  { href: '/dashboard/staff', label: '👨‍🔧 Personel' },
  { href: '/dashboard/reports', label: '📈 Raporlar' },
  { href: '/dashboard/suppliers', label: '🏭 Tedarikçiler' },
  { href: '/dashboard/settings', label: '⚙️ Ayarlar' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [theme, setTheme] = useState('dark')
  const { rate, loading, lastUpdated, refresh } = useLiveRate()

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase')
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-emerald-400">Yeşiltaş ERP</h2>
        </div>

        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-emerald-600/20 text-emerald-400 font-medium'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
              title={theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}
            >
              {theme === 'dark' ? '☀️ Açık' : '🌙 Koyu'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm"
            >
              Çıkış
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Sağ üst: Canlı Dolar Kuru */}
        <div className="flex justify-end mb-4">
          <div className="live-rate-card">
            <div>
              <div className="live-rate-label">💵 USD/TRY (Canlı)</div>
              <div className="live-rate-value">
                {loading ? (
                  <span className="text-sm">Yükleniyor...</span>
                ) : rate ? (
                  <span>₺{rate.toFixed(4)}</span>
                ) : (
                  <span className="text-sm text-red-400">Hata</span>
                )}
              </div>
              {lastUpdated && (
                <div className="live-rate-label flex items-center gap-2">
                  <span>Son Güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}</span>
                  <button onClick={refresh} className="text-emerald-400 hover:text-emerald-300" title="Yenile">🔄</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/sales', label: 'Satış', icon: '💰' },
  { href: '/dashboard/devices', label: 'Teknik Servis', icon: '🔧' },
  { href: '/dashboard/customers', label: 'Müşteriler', icon: '👥' },
  { href: '/dashboard/inventory', label: 'Stok', icon: '📦' },
  { href: '/dashboard/finance', label: 'Kasa', icon: '💵' },
  { href: '/dashboard/warranties', label: 'Garantiler', icon: '🛡️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`} style={{ backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-color)' }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Yeşiltaş Teknoloji" className="h-8 w-auto object-contain" />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Yeşiltaş</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-lg" style={{ color: 'var(--text-muted)' }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5'
            }`}
            style={{ color: pathname === item.href ? undefined : 'var(--text-secondary)' }}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 text-xs text-center" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        {!collapsed && 'Yeşiltaş Teknoloji ERP v1.0'}
      </div>
    </aside>
  )
}

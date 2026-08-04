'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: string
  permission: string
}

const allMenuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', permission: 'Dashboard' },
  { href: '/dashboard/sales', label: 'Satış', icon: '💰', permission: 'Satış' },
  { href: '/dashboard/repairs', label: 'Teknik Servis', icon: '🔧', permission: 'Tamir' },
  { href: '/dashboard/appointments', label: 'Randevular', icon: '📅', permission: 'Randevular' },
  { href: '/dashboard/customers', label: 'Müşteriler', icon: '👥', permission: 'Müşteriler' },
  { href: '/dashboard/inventory', label: 'Envanter', icon: '📦', permission: 'Envanter' },
  { href: '/dashboard/consumables', label: 'Sarf Malzemeler', icon: '🔩', permission: 'Sarf Malzemeler' },
  { href: '/dashboard/finance', label: 'Finans', icon: '💵', permission: 'Finans' },
  { href: '/dashboard/warranties', label: 'Garantiler', icon: '🛡️', permission: 'Garantiler' },
  { href: '/dashboard/suppliers', label: 'Tedarikçiler', icon: '🚚', permission: 'Tedarikçiler' },
  { href: '/dashboard/staff', label: 'Personel', icon: '👤', permission: 'Personel' },
  { href: '/dashboard/reports', label: 'Raporlar', icon: '📈', permission: 'Raporlar' },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: '⚙️', permission: 'Ayarlar' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(allMenuItems)
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserName(user.name || "")
        setUserRole(user.role || "")

        // Yönetici tüm menüyü görsün
        if (user.role === "Yönetici") {
          setMenuItems(allMenuItems)
          return
        }

        // Diğer roller sadece izinli menüleri görsün
        const permissions = user.permissions || []
        const filtered = allMenuItems.filter(item => 
          permissions.includes(item.permission) || item.permission === 'Dashboard'
        )
        setMenuItems(filtered)
      } catch {
        setMenuItems(allMenuItems)
      }
    }
  }, [])

  const handleLogout = () => {
    // Çıkış kaydı ekle
    try {
      const userData = localStorage.getItem("yt_user")
      if (userData) {
        const user = JSON.parse(userData)
        const records = JSON.parse(localStorage.getItem("yt_login_records") || "[]")
        records.unshift({
          id: Date.now(),
          userId: user.username,
          username: user.username,
          name: user.name,
          action: "logout",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          ip: "local"
        })
        localStorage.setItem("yt_login_records", JSON.stringify(records.slice(0, 100)))
      }
    } catch {
      // ignore
    }

    localStorage.removeItem("yt_user")
    window.location.href = "/"
  }

  return (
    <aside className={`flex flex-col transition-all duration-300 bg-slate-900 border-r border-slate-700 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              YT
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">Yeşiltaş</span>
              <span className="text-[10px] text-slate-400">Teknoloji</span>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="text-lg text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Kullanıcı Bilgisi */}
      {!collapsed && userName && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="text-sm font-medium text-white">{userName}</div>
          <div className="text-xs text-slate-400">{userRole}</div>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Çıkış Yap</span>}
        </button>
      </div>

      <div className="p-3 text-xs text-center text-slate-500 border-t border-slate-700">
        {!collapsed && 'Yeşiltaş Teknoloji ERP v1.0'}
      </div>
    </aside>
  )
}
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
  { href: "/dashboard/repairs", label: "Teknik Servis", icon: Wrench },
  { href: "/dashboard/sales", label: "Satışlar", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Müşteriler", icon: Users },
  { href: "/dashboard/inventory", label: "Stok", icon: Package },
  { href: "/dashboard/finance", label: "Finans", icon: DollarSign },
  { href: "/dashboard/analytics", label: "Raporlar", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-sm text-white">Yeşiltaş Teknoloji</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:block
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="font-bold text-white text-sm leading-tight">Yeşiltaş</h1>
                <p className="text-xs text-slate-400">Teknoloji</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
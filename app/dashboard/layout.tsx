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
  ChevronRight,
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

function YesiltasLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 188.42 217.57"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lg1" x1="94.21" y1="217.12" x2="94.21" y2="2.15">
          <stop offset="0" stopColor="#e8b218" />
          <stop offset="0" stopColor="#00361c" />
          <stop offset=".32" stopColor="#01984c" />
          <stop offset=".51" stopColor="#7ae8a9" />
          <stop offset=".76" stopColor="#3ac276" />
          <stop offset=".93" stopColor="#1b3f29" />
        </linearGradient>
        <linearGradient id="lg2" x1="94.21" y1="191.35" x2="94.21" y2="-119.65">
          <stop offset="0" stopColor="#bbb" />
          <stop offset=".67" stopColor="#fff" />
          <stop offset="1" stopColor="#bbb" />
        </linearGradient>
      </defs>
      <path
        d="M94.21,0L0,54.39v108.78l94.21,54.39,94.21-54.39V54.39L94.21,0ZM169.69,152.36l-75.48,43.58-75.48-43.58v-87.15L94.21,21.63l75.48,43.58v87.15Z"
        fill="url(#lg1)"
      />
      <g>
        <path
          d="M53.91,65.99h-24.59l38.06,49.88.26,52.34,18.03,16.98v-69.16l16.05-23.39h11.61v73.77l17.76-17.59v-55.67l.51-.51h15.2l12.29-18.44h-65.06l-16.08,22.51-.97.7-23.09-31.41Z"
          fill="url(#lg2)"
        />
        <polygon
          points="53.91 65.99 77 97.39 77.96 96.7 94.04 74.18 159.1 74.18 146.8 92.63 131.61 92.63 131.09 93.14 131.09 148.81 113.33 166.39 113.33 92.63 101.72 92.63 85.67 116.02 85.67 185.18 67.64 168.2 67.38 115.86 29.32 65.99 53.91 65.99"
          fill="url(#lg2)"
        />
      </g>
    </svg>
  )
}

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
          <YesiltasLogo className="w-8 h-8" />
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
              <YesiltasLogo className="w-10 h-10" />
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
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />}
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
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  ShoppingCart, 
  Users, 
  Calendar, 
  DollarSign, 
  Shield, 
  BarChart3, 
  Users2, 
  Truck, 
  Settings,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa" },
  { href: "/dashboard/repairs", icon: Wrench, label: "Tamirler" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Satislar" },
  { href: "/dashboard/customers", icon: Users, label: "Musteriler" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Randevular" },
  { href: "/dashboard/inventory", icon: Package, label: "Envanter" },
  { href: "/dashboard/consumables", icon: FlaskConical, label: "Sarf Malzeme" },
  { href: "/dashboard/finance", icon: DollarSign, label: "Finans" },
  { href: "/dashboard/warranties", icon: Shield, label: "Garantiler" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Raporlar" },
  { href: "/dashboard/staff", icon: Users2, label: "Personel" },
  { href: "/dashboard/suppliers", icon: Truck, label: "Tedarikciler" },
  { href: "/dashboard/settings", icon: Settings, label: "Ayarlar" },
]

type Theme = "dark" | "light" | "system"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<Theme>("dark")

  const handleLogout = () => {
    localStorage.removeItem("yt_user")
    router.push("/login")
  }

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }

  const ThemeIcon = theme === "dark" ? Moon : Sun

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo + Theme Toggle */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-3">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <span className="text-base font-bold text-white truncate">Teknik Servis</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              title={theme === "dark" ? "Aydinlik Mod" : "Karanlik Mod"}
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center mx-2 rounded-md transition-colors ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2 gap-3"
                } ${
                  isActive 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-slate-800 p-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full text-slate-400 hover:text-red-400 hover:bg-red-900/20 ${
              collapsed ? "justify-center px-2 h-9" : "justify-start px-3 gap-3 h-9"
            }`}
            title={collapsed ? "Cikis Yap" : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cikis Yap</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
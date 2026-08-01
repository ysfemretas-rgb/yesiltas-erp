// app/dashboard/layout.tsx - Sidebar menüyü kompakt yap

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Menu
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-3">
          {!collapsed && (
            <span className="text-lg font-bold text-white truncate">Yesiltas ERP</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-slate-800 p-3">
            <div className="text-xs text-slate-500 text-center">
              Yesiltas ERP v1.0
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
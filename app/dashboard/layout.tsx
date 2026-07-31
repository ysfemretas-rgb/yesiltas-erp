"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  var pathname = usePathname()
  var [sidebarOpen, setSidebarOpen] = useState(false)

  var menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/dashboard/sales", label: "Satış", icon: "💰" },
    { href: "/dashboard/devices", label: "Teknik Servis", icon: "🔧" },
    { href: "/dashboard/customers", label: "Müşteriler", icon: "👥" },
    { href: "/dashboard/finance", label: "Finans", icon: "📊" },
    { href: "/dashboard/inventory", label: "Stok", icon: "📦" },
    { href: "/dashboard/warranties", label: "Garantiler", icon: "🛡️" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 btn btn-primary"
        onClick={function() { setSidebarOpen(!sidebarOpen) }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Yeşiltaş ERP</h1>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map(function(item) {
            var isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " +
                  (isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                }
                onClick={function() { setSidebarOpen(false) }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={function() { setSidebarOpen(false) }}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:ml-0">
          {children}
        </div>
      </main>
    </div>
  )
}

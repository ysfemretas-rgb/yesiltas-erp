"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: "🏠" },
  { href: "/dashboard/devices", label: "Cihazlar", icon: "📱" },
  { href: "/dashboard/customers", label: "Müşteriler", icon: "👥" },
  { href: "/dashboard/sales", label: "Satış", icon: "💰" },
  { href: "/dashboard/inventory", label: "Stok", icon: "📦" },
  { href: "/dashboard/consumables", label: "Sarf Malzeme", icon: "🔧" },
  { href: "/dashboard/finance", label: "Kasa", icon: "💳" },
  { href: "/dashboard/suppliers", label: "Tedarikçiler", icon: "🏭" },
  { href: "/dashboard/appointments", label: "Randevular", icon: "📅" },
  { href: "/dashboard/settings", label: "Ayarlar", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo - Sabit üstte */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">
              YT
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Yeşiltaş</h1>
              <p className="text-xs text-slate-400">Teknoloji ERP</p>
            </div>
          </div>
        </div>

        {/* Menü - Scrollable orta kısım */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Çıkış Yap - Sabit altta */}
        <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span>🚪</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-300">Yeşiltaş Teknoloji</span>
          <div className="w-9" />
        </header>

        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

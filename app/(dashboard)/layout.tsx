'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Wrench, Package, ShoppingCart, 
  Truck, DollarSign, Building2, Handshake, FileText, 
  Settings, Bell, Menu, X, ChevronLeft, ChevronRight,
  LogOut, Sun, Moon
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Musteriler', href: '/customers', icon: Users },
  { name: 'Teknik Servis', href: '/services', icon: Wrench },
  { name: 'Stok', href: '/stock', icon: Package },
  { name: 'Satis', href: '/sales', icon: ShoppingCart },
  { name: 'Satin Alma', href: '/purchases', icon: Truck },
  { name: 'Finans', href: '/finance', icon: DollarSign },
  { name: 'Demirbas', href: '/assets', icon: Building2 },
  { name: 'Ortaklik', href: '/partners', icon: Handshake },
  { name: 'Raporlar', href: '/reports', icon: FileText },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={cn("min-h-screen bg-background", darkMode && "dark")}>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/" className={cn(
            "flex items-center gap-3 transition-all",
            !sidebarOpen && "lg:justify-center"
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">YT</span>
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-sm leading-tight">Yesiltas</h1>
                <p className="text-xs text-muted-foreground">ERP Sistemi</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "lg:justify-center lg:px-2"
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                {sidebarOpen && <span className="animate-fade-in">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-2 space-y-1">
          <button
            onClick={toggleDarkMode}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{darkMode ? 'Acik Tema' : 'Koyu Tema'}</span>}
          </button>
          <button
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Cikis Yap</span>}
          </button>
        </div>
      </aside>

      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {navigation.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">YE</span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

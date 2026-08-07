"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ListChecks, 
  ClipboardList, 
  Wrench, 
  Package, 
  Package2, 
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
  UserCircle,
  Menu,
  X,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { supabase } from "@/lib/supabase"
import { NotificationBell } from "@/components/NotificationBell"

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa", color: "text-emerald-400" },
  { href: "/dashboard/today", icon: ListChecks, label: "Bugün", color: "text-fuchsia-400" },
  { href: "/dashboard/repairs", icon: Wrench, label: "Teknik Servis", color: "text-orange-400" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Satışlar", color: "text-cyan-400" },
  { href: "/dashboard/customers", icon: Users, label: "Müşteriler", color: "text-violet-400" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Randevular", color: "text-pink-400" },
  { href: "/dashboard/tasks", icon: ClipboardList, label: "Görevler", color: "text-fuchsia-400" },
  { href: "/dashboard/inventory", icon: Package, label: "Envanter", color: "text-amber-400" },
  { href: "/dashboard/assets", icon: Package2, label: "Demirbaşlar", color: "text-slate-400" },
  { href: "/dashboard/consumables", icon: FlaskConical, label: "Sarf Malzeme", color: "text-lime-400" },
  { href: "/dashboard/finance", icon: DollarSign, label: "Finans", color: "text-green-400" },
  { href: "/dashboard/warranties", icon: Shield, label: "Garantiler", color: "text-indigo-400" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Raporlar", color: "text-teal-400" },
  { href: "/dashboard/staff", icon: Users2, label: "Personel", color: "text-sky-400" },
  { href: "/dashboard/suppliers", icon: Truck, label: "Tedarikçiler", color: "text-rose-400" },
  { href: "/dashboard/settings", icon: Settings, label: "Ayarlar", color: "text-slate-400" },
]

interface UserData {
  username: string
  name: string
  role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [usdInput, setUsdInput] = useState<string>("")
  // Kur bilgisi artık merkezi useExchangeRates() hook'undan geliyor —
  // envanter ve sarf malzeme sayfalarıyla AYNI kaynağı kullanır, böylece
  // her yerde aynı USD/TRY değeri gösterilir.
  const { rates, isLoadingRates: isLoading, fetchRates: fetchCurrency } = useExchangeRates()
  const usdRate = rates.USD || null
  const lastUpdate = rates.lastUpdated

  useEffect(() => {
    if (typeof window === "undefined") return

    ;(async () => {
      try {
        // Gerçek oturum kontrolü: sadece localStorage'a değil, Supabase
        // Auth'un kendi (sunucu tarafından doğrulanan) session'ına bakılır.
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          localStorage.removeItem("yt_user")
          window.location.href = "/login"
          return
        }

        const userData = localStorage.getItem("yt_user")
        if (!userData) {
          window.location.href = "/login"
          return
        }
        const parsed = JSON.parse(userData)
        setCurrentUser(parsed)
      } catch (err) {
        console.error("Auth error:", err)
        window.location.href = "/login"
      } finally {
        setCheckingAuth(false)
      }
    })()

    try {
      const savedTheme = localStorage.getItem("yt_theme")
      if (savedTheme === "light") {
        setDarkMode(false)
        document.documentElement.classList.remove("dark")
      } else {
        setDarkMode(true)
        document.documentElement.classList.add("dark")
      }
    } catch (e) {
      console.log("Theme error:", e)
    }
  }, [])

  // Oturum süresi dolarsa (ya da başka bir sekmeden çıkış yapılırsa) otomatik
  // olarak giriş sayfasına yönlendir — aksi halde kullanıcı anlaşılmaz
  // hatalarla karşılaşabiliyordu.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("yt_user")
        window.location.href = "/login"
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Bir yönetici, personelin rolünü/yetkilerini değiştirirse, bu değişikliğin
  // o kullanıcının ekranına çıkış yapmasını beklemeden birkaç dakika içinde
  // yansıması için profilini periyodik olarak tazeler.
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name, role, permissions, is_active")
          .eq("id", session.user.id)
          .single()
        if (!profile) return
        if (!profile.is_active) {
          await supabase.auth.signOut()
          localStorage.removeItem("yt_user")
          window.location.href = "/login"
          return
        }
        const existingRaw = localStorage.getItem("yt_user")
        const existing = existingRaw ? JSON.parse(existingRaw) : {}
        const updated = {
          ...existing,
          username: profile.username,
          name: profile.full_name,
          role: profile.role,
          permissions: profile.permissions,
        }
        localStorage.setItem("yt_user", JSON.stringify(updated))
        setCurrentUser(updated)
      } catch (e) {
        console.error("Profil tazeleme hatası:", e)
      }
    }

    const interval = setInterval(refreshProfile, 3 * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshProfile()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  // İnternet bağlantısı durumu — koptuğunda kullanıcıya net bir uyarı göster.
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("yt_user")
    window.location.href = "/login"
  }

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      localStorage.setItem("yt_theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      localStorage.setItem("yt_theme", "light")
    }
  }

  const tlValue = usdRate && usdInput ? (parseFloat(usdInput) * usdRate).toFixed(2) : "--"

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Yukleniyor...</div>
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-sm text-center py-1.5">
          ⚠️ İnternet bağlantısı yok — değişiklikler kaydedilmiyor olabilir.
        </div>
      )}
      <div className="flex h-screen bg-background transition-colors">
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside 
          className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 ${
            collapsed ? "w-16" : "w-60"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="flex h-14 items-center justify-between border-b px-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img src="/header-logo.png" alt="Yeşiltaş Teknoloji" className="h-6 w-6" />
                <span className="text-base font-bold text-foreground truncate">Yeşiltaş Teknoloji</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentUser && !collapsed && (
            <div className="border-b px-3 py-3">
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                <UserCircle className="h-8 w-8 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Hoş geldiniz,</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentUser.role} {currentUser.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center mx-2 rounded-md transition-colors ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2 gap-3"
                  } ${
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "" : item.color}`} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-2">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
                collapsed ? "justify-center px-2 h-9" : "justify-start px-3 gap-3 h-9"
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Çıkış Yap</span>}
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-background min-w-0">
          <div className="lg:hidden flex items-center justify-between h-14 border-b px-4 bg-card">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <img src="/header-logo.png" alt="Yeşiltaş Teknoloji" className="h-6 w-6" />
              <span className="text-sm font-bold text-foreground">Yeşiltaş</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-end gap-3 px-6 pt-4 pb-2">
            <NotificationBell />
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
              <Input
                type="number"
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                placeholder="USD"
                className="w-20 h-7 bg-transparent border-0 text-white text-sm p-0 focus-visible:ring-0"
              />
              <span className="text-slate-400 text-sm">$</span>
              <span className="text-slate-400 text-sm">=</span>
              <span className="text-emerald-400 font-bold text-sm">{tlValue}</span>
              <span className="text-slate-400 text-sm">₺</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
              <span className="text-slate-400 text-xs">USD/TRY:</span>
              <span className="text-blue-400 font-bold text-sm">
                {usdRate ? `₺${usdRate.toFixed(2)}` : "--"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchCurrency}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {lastUpdate && (
              <span className="text-slate-500 text-xs">{lastUpdate}</span>
            )}
          </div>

          <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                placeholder="USD"
                className="w-16 h-7 bg-slate-800 border-slate-700 text-white text-xs"
              />
              <span className="text-emerald-400 font-bold text-xs">{tlValue}₺</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400 text-xs font-bold">
                {usdRate ? `₺${usdRate.toFixed(2)}` : "--"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchCurrency}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-slate-400"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
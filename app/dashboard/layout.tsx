"use client"

import { useState, useEffect } from "react"
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
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa", color: "text-emerald-400" },
  { href: "/dashboard/repairs", icon: Wrench, label: "Teknik Servis", color: "text-orange-400" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Satislar", color: "text-cyan-400" },
  { href: "/dashboard/customers", icon: Users, label: "Musteriler", color: "text-violet-400" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Randevular", color: "text-pink-400" },
  { href: "/dashboard/inventory", icon: Package, label: "Envanter", color: "text-amber-400" },
  { href: "/dashboard/consumables", icon: FlaskConical, label: "Sarf Malzeme", color: "text-lime-400" },
  { href: "/dashboard/finance", icon: DollarSign, label: "Finans", color: "text-green-400" },
  { href: "/dashboard/warranties", icon: Shield, label: "Garantiler", color: "text-indigo-400" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Raporlar", color: "text-teal-400" },
  { href: "/dashboard/staff", icon: Users2, label: "Personel", color: "text-sky-400" },
  { href: "/dashboard/suppliers", icon: Truck, label: "Tedarikciler", color: "text-rose-400" },
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

  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [usdInput, setUsdInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
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

  const fetchCurrency = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD")
      const data = await res.json()
      if (data.rates && data.rates.TRY) {
        setUsdRate(data.rates.TRY)
        const now = new Date()
        setLastUpdate(now.toLocaleString("tr-TR", { 
          day: "2-digit", month: "2-digit", year: "numeric", 
          hour: "2-digit", minute: "2-digit", second: "2-digit" 
        }))
      }
    } catch (err) {
      console.error("Currency fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrency()
    const interval = setInterval(fetchCurrency, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
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
          {/* Logo Header */}
          <div className="flex h-14 items-center justify-between border-b px-3">
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-8 w-8 shrink-0">
                  <Image 
                    src="/logo-yesiltas.svg" 
                    alt="Yesiltas Logo" 
                    fill 
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="text-base font-bold text-foreground truncate">Yesiltas Teknoloji</span>
              </div>
            )}
            {collapsed && (
              <div className="relative h-8 w-8 mx-auto">
                <Image 
                  src="/logo-yesiltas.svg" 
                  alt="Yesiltas Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
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
                <div className="relative h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Hos geldiniz,</p>
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
              {!collapsed && <span className="text-sm font-medium">Cikis Yap</span>}
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-background min-w-0">
          {/* Mobile Header */}
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
              <div className="relative h-7 w-7">
                <Image 
                  src="/logo-yesiltas.svg" 
                  alt="Yesiltas Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-bold text-foreground">Yesiltas</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Currency Widget - Desktop */}
          <div className="hidden lg:flex items-center justify-end gap-3 px-6 pt-4 pb-2">
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

          {/* Currency Widget - Mobile */}
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
"use client"

import { useState, useEffect, useCallback } from "react"
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
  Monitor,
  UserCircle,
  RefreshCw,
  ArrowRightLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Ana Sayfa", color: "text-emerald-400" },
  { href: "/dashboard/repairs", icon: Wrench, label: "Teknik Servis", color: "text-orange-400" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Satışlar", color: "text-cyan-400" },
  { href: "/dashboard/customers", icon: Users, label: "Müşteriler", color: "text-violet-400" },
  { href: "/dashboard/appointments", icon: Calendar, label: "Randevular", color: "text-pink-400" },
  { href: "/dashboard/inventory", icon: Package, label: "Envanter", color: "text-amber-400" },
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

interface CurrencyData {
  rate: number
  lastUpdate: string
  loading: boolean
  error: string | null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Döviz state
  const [currency, setCurrency] = useState<CurrencyData>({
    rate: 0,
    lastUpdate: "",
    loading: true,
    error: null
  })
  const [usdAmount, setUsdAmount] = useState<string>("")
  const [tlResult, setTlResult] = useState<string>("")

  const fetchCurrency = useCallback(async () => {
    setCurrency(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD")
      const data = await response.json()

      if (data.result === "success" && data.rates?.TRY) {
        const tryRate = data.rates.TRY
        const now = new Date()
        const formatted = now.toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })

        setCurrency({
          rate: tryRate,
          lastUpdate: formatted,
          loading: false,
          error: null
        })
      } else {
        throw new Error("Kur alınamadı")
      }
    } catch (err) {
      setCurrency(prev => ({
        ...prev,
        loading: false,
        error: "Kur yüklenemedi"
      }))
    }
  }, [])

  // USD -> TL çevirme (otomatik)
  useEffect(() => {
    if (usdAmount && currency.rate > 0) {
      const usd = parseFloat(usdAmount.replace(/,/g, "."))
      if (!isNaN(usd) && usd > 0) {
        const tl = usd * currency.rate
        setTlResult(tl.toFixed(2))
      } else {
        setTlResult("")
      }
    } else {
      setTlResult("")
    }
  }, [usdAmount, currency.rate])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const userData = localStorage.getItem("yt_user")
      if (!userData) {
        window.location.href = "/login"
        return
      }
      setCurrentUser(JSON.parse(userData))
    } catch (err) {
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
    } catch (e) {}

    fetchCurrency()
    const interval = setInterval(fetchCurrency, 30000)
    return () => clearInterval(interval)
  }, [fetchCurrency])

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

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-background transition-colors">
        <aside 
          className={`flex flex-col border-r bg-card transition-all duration-300 ${
            collapsed ? "w-16" : "w-60"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b px-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <span className="text-base font-bold text-foreground truncate">Yeşiltaş Teknoloji</span>
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
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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

        <main className="flex-1 overflow-auto bg-background">
          {/* Döviz Widget - Sağ Üst */}
          <div className="flex justify-end px-6 pt-4 pb-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                {/* Dolar Kuru */}
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">
                        {currency.loading ? "..." : currency.error ? "--" : `₺${currency.rate.toFixed(2)}`}
                      </span>
                      <span className="text-xs text-slate-400">/ USD</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>Son güncelleme:</span>
                      <span className="text-slate-400">{currency.lastUpdate || "--"}</span>
                    </div>
                  </div>
                </div>

                {/* Ayraç */}
                <div className="h-8 w-px bg-slate-700" />

                {/* USD -> TL Çevirici */}
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-3 w-3 text-slate-500" />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="text"
                      placeholder="USD"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="h-7 w-20 border-slate-600 bg-slate-900 text-xs text-white placeholder:text-slate-600"
                    />
                    <span className="text-xs text-slate-400">$</span>
                    <span className="text-xs text-slate-500">=</span>
                    <span className="min-w-[50px] text-sm font-semibold text-green-400">
                      {tlResult ? `₺${tlResult}` : "--"}
                    </span>
                  </div>
                </div>

                {/* Ayraç */}
                <div className="h-8 w-px bg-slate-700" />

                {/* Güncelle Butonu */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchCurrency}
                  disabled={currency.loading}
                  className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${currency.loading ? "animate-spin" : ""}`} />
                  Güncelle
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
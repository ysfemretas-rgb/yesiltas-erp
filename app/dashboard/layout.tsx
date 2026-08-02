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
  Monitor,
  UserCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [darkMode, setDarkMode] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Client-side only
    if (typeof window === "undefined") return
    
    try {
      const userData = localStorage.getItem("yt_user")
      console.log("Dashboard auth check:", userData)
      
      if (!userData) {
        console.log("No user found, redirecting to login")
        window.location.href = "/login"
        return
      }
      
      const parsed = JSON.parse(userData)
      setCurrentUser(parsed)
      console.log("User found:", parsed.name)
    } catch (err) {
      console.error("Auth error:", err)
      window.location.href = "/login"
    } finally {
      setCheckingAuth(false)
    }

    // Theme
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
        <div className="text-white">Yukleniyor...</div>
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
                <span className="text-base font-bold text-foreground truncate">Yesiltas Teknoloji</span>
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

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Wrench,
  ShoppingCart,
  Users,
  CalendarDays,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Plus,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Timer,
  DollarSign,
  BarChart3,
  ClipboardList,
  Phone
} from "lucide-react"

interface DashboardStats {
  pendingDevices: number
  readyDevices: number
  todaySales: number
  criticalStock: number
  totalCustomers: number
  monthlyRevenue: number
  totalDebt: number
  activeWarranties: number
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  color: string
  description: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats] = useState<DashboardStats>({
    pendingDevices: 12,
    readyDevices: 5,
    todaySales: 8,
    criticalStock: 3,
    totalCustomers: 156,
    monthlyRevenue: 28800,
    totalDebt: 12000,
    activeWarranties: 24
  })

  const [recentActivities] = useState([
    { id: 1, type: "repair", message: "iPhone 14 Pro ekran degisimi tamamlandi", time: "10 dk once", status: "success" },
    { id: 2, type: "sale", message: "Samsung S23 satisi gerceklesti", time: "25 dk once", status: "success" },
    { id: 3, type: "stock", message: "USB-C sarj portu kritik stok seviyesinde", time: "1 saat once", status: "warning" },
    { id: 4, type: "appointment", message: "Yeni randevu: Ahmet Yilmaz - 14:30", time: "2 saat once", status: "info" },
    { id: 5, type: "warranty", message: "MacBook Air garanti suresi doluyor", time: "3 saat once", status: "warning" }
  ])

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const quickActions: QuickAction[] = [
    {
      id: "new-repair",
      label: "Yeni Servis",
      icon: <Wrench className="h-5 w-5" />,
      href: "/dashboard/service",
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Yeni cihaz kaydi olustur"
    },
    {
      id: "new-sale",
      label: "Yeni Satis",
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/dashboard/pos",
      color: "bg-green-600 hover:bg-green-700",
      description: "Hizli satis islemi yap"
    },
    {
      id: "new-customer",
      label: "Yeni Musteri",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/customers",
      color: "bg-purple-600 hover:bg-purple-700",
      description: "Musteri kaydi olustur"
    },
    {
      id: "new-appointment",
      label: "Randevu Al",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/dashboard/appointments",
      color: "bg-orange-600 hover:bg-orange-700",
      description: "Yeni randevu olustur"
    },
    {
      id: "stock-check",
      label: "Stok Kontrol",
      icon: <Package className="h-5 w-5" />,
      href: "/dashboard/inventory",
      color: "bg-cyan-600 hover:bg-cyan-700",
      description: "Stok durumunu kontrol et"
    },
    {
      id: "debt-check",
      label: "Borc Sorgula",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/dashboard/customers",
      color: "bg-red-600 hover:bg-red-700",
      description: "Musteri borclarini gor"
    }
  ]

  const statCards = [
    {
      id: "pending",
      title: "Bekleyen Cihaz",
      value: stats.pendingDevices,
      icon: <Smartphone className="h-5 w-5" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      href: "/dashboard/service",
      clickable: true
    },
    {
      id: "ready",
      title: "Hazir Cihaz",
      value: stats.readyDevices,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      href: "/dashboard/service",
      clickable: true
    },
    {
      id: "sales",
      title: "Bugun Satis",
      value: stats.todaySales,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/dashboard/pos",
      clickable: true
    },
    {
      id: "stock",
      title: "Kritik Stok",
      value: stats.criticalStock,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      href: "/dashboard/inventory",
      clickable: true
    },
    {
      id: "customers",
      title: "Toplam Musteri",
      value: stats.totalCustomers,
      icon: <Users className="h-5 w-5" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      href: "/dashboard/customers",
      clickable: true
    },
    {
      id: "revenue",
      title: "Aylik Ciro",
      value: `₺${stats.monthlyRevenue.toLocaleString("tr-TR")}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      href: "/dashboard/finance",
      clickable: true
    },
    {
      id: "debt",
      title: "Toplam Borc",
      value: `₺${stats.totalDebt.toLocaleString("tr-TR")}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      href: "/dashboard/finance",
      clickable: true
    },
    {
      id: "warranty",
      title: "Aktif Garanti",
      value: stats.activeWarranties,
      icon: <Shield className="h-5 w-5" />,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      href: "/dashboard/warranties",
      clickable: true
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "repair": return <Wrench className="h-4 w-4 text-blue-400" />
      case "sale": return <ShoppingCart className="h-4 w-4 text-green-400" />
      case "stock": return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "appointment": return <CalendarDays className="h-4 w-4 text-orange-400" />
      case "warranty": return <Shield className="h-4 w-4 text-cyan-400" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getActivityBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Basarili</Badge>
      case "warning": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Uyari</Badge>
      case "info": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">Bilgi</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Ana Panel</h1>
          <p className="text-slate-400 mt-1">
            Hos geldiniz, <span className="text-blue-400 font-medium">{user?.name || "Kullanici"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            <Clock className="mr-1 h-3 w-3" />
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Badge>
        </div>
      </div>

      {/* Istatistik Kartlari */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.id}
            className={`bg-slate-900 border-slate-800 ${stat.clickable ? 'cursor-pointer hover:border-slate-600 transition-colors' : ''}`}
            onClick={() => stat.clickable && router.push(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              {stat.clickable && (
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  Detaylari gor <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hizli Islemler */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Hizli Islemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 text-left"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`${action.color} p-2 rounded-lg text-white`}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="font-medium text-white">{action.label}</div>
                    <div className="text-xs text-slate-400">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Son Aktiviteler */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{activity.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">{activity.time}</span>
                      {getActivityBadge(activity.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stok Kategorileri */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-500" />
            Stok Kategorileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Aksesuar", count: 50, percent: 84.7, color: "bg-emerald-500" },
              { name: "Ekran", count: 9, percent: 15.3, color: "bg-blue-500" },
              { name: "Batarya", count: 0, percent: 0, color: "bg-slate-500" }
            ].map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{category.name}</span>
                  <span className="text-slate-400">{category.count} adet ({category.percent}%)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${category.color} rounded-full transition-all`} style={{ width: `${category.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Eksik import
import { Zap } from "lucide-react"
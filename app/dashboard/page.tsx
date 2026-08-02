"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Wrench,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Monitor
} from "lucide-react"

interface UserData {
  name: string
  role: string
}

interface Activity {
  id: number
  type: "repair" | "sale" | "appointment" | "customer"
  title: string
  description: string
  date: string
  status: string
  amount?: number
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }

    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting("Günaydın")
    } else if (hour >= 12 && hour < 18) {
      setGreeting("İyi günler")
    } else {
      setGreeting("İyi akşamlar")
    }
  }, [])

  // Demo veriler - gerçek uygulamada API'den gelecek
  const stats = [
    {
      title: "Toplam Müşteri",
      value: "128",
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      href: "/dashboard/customers"
    },
    {
      title: "Aktif Tamir",
      value: "24",
      icon: Wrench,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      href: "/dashboard/repairs"
    },
    {
      title: "Bugünkü Satış",
      value: "₺12.450",
      icon: ShoppingCart,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      href: "/dashboard/sales"
    },
    {
      title: "Bekleyen Randevu",
      value: "8",
      icon: Calendar,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      href: "/dashboard/appointments"
    },
    {
      title: "Kritik Stok",
      value: "5",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      href: "/dashboard/consumables"
    },
    {
      title: "Toplam Borç",
      value: "₺8.320",
      icon: DollarSign,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      href: "/dashboard/customers"
    },
    {
      title: "Aylık Ciro",
      value: "₺145.600",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      href: "/dashboard/finance"
    },
  ]

  const quickActions = [
    { label: "Yeni Tamir", href: "/dashboard/repairs", icon: Wrench, color: "bg-orange-600 hover:bg-orange-700" },
    { label: "Yeni Satış", href: "/dashboard/sales", icon: ShoppingCart, color: "bg-green-600 hover:bg-green-700" },
    { label: "Yeni Müşteri", href: "/dashboard/customers", icon: Users, color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Yeni Randevu", href: "/dashboard/appointments", icon: Calendar, color: "bg-pink-600 hover:bg-pink-700" },
    { label: "Yeni Garanti", href: "/dashboard/warranties", icon: AlertTriangle, color: "bg-purple-600 hover:bg-purple-700" },
    { label: "Yeni Gelir/Gider", href: "/dashboard/finance", icon: DollarSign, color: "bg-emerald-600 hover:bg-emerald-700" },
  ]

  const recentActivities: Activity[] = [
    { id: 1, type: "repair", title: "iPhone 14 Pro Ekran Değişimi", description: "Ahmet Yılmaz - ₺2.500", date: "10 dakika önce", status: "Tamamlandı", amount: 2500 },
    { id: 2, type: "sale", title: "Samsung Şarj Aleti Satışı", description: "Mehmet Kaya - ₺450", date: "25 dakika önce", status: "Satış", amount: 450 },
    { id: 3, type: "appointment", title: "iPad Air 5 Tamiri", description: "Ayşe Demir - Yarın 14:00", date: "1 saat önce", status: "Bekliyor" },
    { id: 4, type: "customer", title: "Yeni Müşteri Kaydı", description: "Fatma Şahin - 0555 456 7890", date: "2 saat önce", status: "Yeni" },
    { id: 5, type: "repair", title: "Samsung S23 Batarya Değişimi", description: "Ali Veli - ₺1.800", date: "3 saat önce", status: "Devam Ediyor", amount: 1800 },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "repair": return <Wrench className="h-4 w-4 text-orange-400" />
      case "sale": return <ShoppingCart className="h-4 w-4 text-green-400" />
      case "appointment": return <Calendar className="h-4 w-4 text-pink-400" />
      case "customer": return <Users className="h-4 w-4 text-blue-400" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getActivityHref = (type: string) => {
    switch (type) {
      case "repair": return "/dashboard/repairs"
      case "sale": return "/dashboard/sales"
      case "appointment": return "/dashboard/appointments"
      case "customer": return "/dashboard/customers"
      default: return "/dashboard"
    }
  }

  return (
    <div className="space-y-6">
      {/* Hoş Geldiniz */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {greeting}, {currentUser?.role} {currentUser?.name}
        </h1>
        <p className="mt-1 text-slate-400">
          Yeşiltaş Teknoloji Teknik Servis Yönetim Sistemine hoş geldiniz.
        </p>
      </div>

      {/* Hızlı Erişim */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button className={`${action.color} text-white`} size="sm">
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block">
            <Card className={`bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors cursor-pointer ${stat.borderColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">Detaylar için tıklayın →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Son İşlemler */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Son İşlemler</CardTitle>
          <Link href="/dashboard/repairs">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Tümünü Gör
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <Link key={activity.id} href={getActivityHref(activity.type)}>
                <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {activity.date}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
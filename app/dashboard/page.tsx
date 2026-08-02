"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wrench, 
  ShoppingCart, 
  Users, 
  Calendar, 
  DollarSign, 
  Package,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react"

interface Repair {
  id: number
  customerName: string
  device: string
  brand: string
  status: string
  cost: number
  createdAt: string
}

interface Sale {
  id: number
  customerName: string
  totalAmount: number
  date: string
}

interface Customer {
  id: number
  name: string
  phone: string
}

interface Appointment {
  id: number
  customerName: string
  date: string
  time: string
  status: string
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<{name: string, role: string} | null>(null)
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("yt_user")
      if (userData) {
        try {
          setCurrentUser(JSON.parse(userData))
        } catch (e) {
          console.error(e)
        }
      }

      const savedRepairs = localStorage.getItem("yt_repairs")
      const savedSales = localStorage.getItem("yt_sales")
      const savedCustomers = localStorage.getItem("yt_customers")
      const savedAppointments = localStorage.getItem("yt_appointments")

      if (savedRepairs) {
        try { setRepairs(JSON.parse(savedRepairs)) } catch (e) {}
      }
      if (savedSales) {
        try { setSales(JSON.parse(savedSales)) } catch (e) {}
      }
      if (savedCustomers) {
        try { setCustomers(JSON.parse(savedCustomers)) } catch (e) {}
      }
      if (savedAppointments) {
        try { setAppointments(JSON.parse(savedAppointments)) } catch (e) {}
      }
    }
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Gunaydin"
    if (hour < 18) return "Iyi gunler"
    return "Iyi aksamlar"
  }, [])

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const activeRepairs = repairs.filter(r => r.status !== "completed").length
    const completedRepairs = repairs.filter(r => r.status === "completed").length
    const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const repairRevenue = repairs.filter(r => r.status === "completed").reduce((sum, r) => sum + (r.paid || r.cost || 0), 0)
    const totalIncome = totalRevenue + repairRevenue
    const pendingRepairs = repairs.filter(r => r.status === "waiting").length
    const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length

    return {
      totalCustomers,
      activeRepairs,
      completedRepairs,
      totalIncome,
      pendingRepairs,
      todayAppointments,
      totalSales: sales.filter(s => s.status === "completed").length
    }
  }, [customers, repairs, sales, appointments])

  const recentActivities = useMemo(() => {
    const activities: {type: string, title: string, desc: string, date: string, link: string}[] = []

    repairs.slice(0, 5).forEach(r => {
      activities.push({
        type: "repair",
        title: `Tamir: ${r.customerName}`,
        desc: `${r.brand} ${r.device} - ${r.status === "completed" ? "Tamamlandi" : r.status === "waiting" ? "Bekliyor" : "Devam Ediyor"}`,
        date: r.createdAt,
        link: "/dashboard/repairs"
      })
    })

    sales.slice(0, 5).forEach(s => {
      activities.push({
        type: "sale",
        title: `Satis: ${s.customerName}`,
        desc: `Toplam: ₺${s.totalAmount}`,
        date: s.date,
        link: "/dashboard/sales"
      })
    })

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }, [repairs, sales])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          {greeting}, {currentUser?.role} {currentUser?.name}
        </h1>
        <p className="text-slate-400 mt-1 text-sm lg:text-base">
          Yesiltas Teknoloji Teknik Servis Yonetim Sistemine hos geldiniz.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
        <Link href="/dashboard/repairs">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <Wrench className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Tamir
          </Button>
        </Link>
        <Link href="/dashboard/sales">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <ShoppingCart className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Satis
          </Button>
        </Link>
        <Link href="/dashboard/customers">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Musteri
          </Button>
        </Link>
        <Link href="/dashboard/appointments">
          <Button className="w-full bg-pink-600 hover:bg-pink-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Randevu
          </Button>
        </Link>
        <Link href="/dashboard/warranties">
          <Button className="w-full bg-violet-600 hover:bg-violet-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <Package className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Garanti
          </Button>
        </Link>
        <Link href="/dashboard/finance">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-xs lg:text-sm h-auto py-2 lg:py-3">
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />Yeni Gelir/Gider
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Link href="/dashboard/customers">
          <Card className="bg-slate-900 border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Toplam Musteri
                <Users className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-white">{stats.totalCustomers}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/repairs">
          <Card className="bg-slate-900 border-slate-700 hover:border-orange-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Aktif Tamir
                <Wrench className="h-3 w-3 lg:h-4 lg:w-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-white">{stats.activeRepairs}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/repairs">
          <Card className="bg-slate-900 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Tamamlanan
                <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-emerald-400">{stats.completedRepairs}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/finance">
          <Card className="bg-slate-900 border-slate-700 hover:border-green-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Toplam Gelir
                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-green-400">{formatCurrency(stats.totalIncome)}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/repairs">
          <Card className="bg-slate-900 border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Bekleyen Tamir
                <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-amber-400">{stats.pendingRepairs}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/sales">
          <Card className="bg-slate-900 border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Toplam Satis
                <ShoppingCart className="h-3 w-3 lg:h-4 lg:w-4 text-cyan-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-cyan-400">{stats.totalSales}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/appointments">
          <Card className="bg-slate-900 border-slate-700 hover:border-pink-500/50 transition-colors cursor-pointer">
            <CardHeader className="pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm text-slate-400 flex items-center justify-between">
                Bugun Randevu
                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-pink-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-3xl font-bold text-pink-400">{stats.todayAppointments}</div>
              <p className="text-xs text-slate-500 mt-1">Detaylar icin tiklayin →</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activities */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base lg:text-lg flex items-center justify-between">
            <span>Son Islemler</span>
            <Link href="/dashboard/repairs">
              <span className="text-xs text-blue-400 hover:text-blue-300">Tumunu Gor →</span>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Heniz islem bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity, idx) => (
                <Link key={idx} href={activity.link}>
                  <div className="flex items-center justify-between p-2 lg:p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                      <Badge variant={activity.type === "repair" ? "default" : "secondary"} className="text-xs shrink-0">
                        {activity.type === "repair" ? "Tamir" : "Satis"}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-slate-400 text-xs truncate">{activity.desc}</p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0 ml-2">{activity.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
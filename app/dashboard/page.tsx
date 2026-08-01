"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wrench, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertCircle,
  ArrowRight,
  Hand
} from "lucide-react"

interface UserData {
  username: string
  name: string
  role: string
}

const recentActivities = [
  { id: 1, type: "repair", title: "iPhone 14 Pro ekran degisimi", customer: "Ahmet Yilmaz", time: "10 dk once", status: "completed" },
  { id: 2, type: "sale", title: "iPhone kilif + ekran koruyucu", customer: "Mehmet Kaya", time: "25 dk once", status: "paid" },
  { id: 3, type: "repair", title: "Samsung S23 batarya degisimi", customer: "Ayse Demir", time: "1 saat once", status: "in_progress" },
  { id: 4, type: "appointment", title: "Randevu: iPad Air 5 tamiri", customer: "Fatma Sahin", time: "2 saat once", status: "pending" },
  { id: 5, type: "sale", title: "Sarj aleti + kulaklik", customer: "Ali Veli", time: "3 saat once", status: "paid" },
]

export default function DashboardHomePage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }

    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Gunaydin")
    else if (hour < 18) setGreeting("Iyi gunler")
    else setGreeting("Iyi aksamlar")
  }, [])

  const stats = [
    { title: "Bekleyen Servis", value: "3", icon: Wrench, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { title: "Bugunku Satis", value: "₺4.250", icon: ShoppingCart, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Aktif Musteri", value: "24", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Aylik Gelir", value: "₺42.000", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-500/10" },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "repair": return <Wrench className="h-4 w-4 text-orange-400" />
      case "sale": return <ShoppingCart className="h-4 w-4 text-green-400" />
      case "appointment": return <Clock className="h-4 w-4 text-blue-400" />
      default: return <AlertCircle className="h-4 w-4 text-slate-400" />
    }
  }

  const getActivityBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Tamamlandi</Badge>
      case "paid": return <Badge className="bg-green-900/50 text-green-300 border-green-700">Odenmis</Badge>
      case "in_progress": return <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">Devam Ediyor</Badge>
      case "pending": return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Beklemede</Badge>
      default: return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {greeting}, {currentUser ? `${currentUser.role} ${currentUser.name}` : "Yonetici"}
          </h1>
          <p className="text-slate-400 mt-1">
            Yesiltas Teknoloji Teknik Servis Yonetim Sistemine hos geldiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Hand className="h-5 w-5 text-yellow-400 animate-wave" />
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12%</span> gecen haftaya gore
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Son Islemler</CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Tumunu Gor <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{activity.title}</span>
                      {getActivityBadge(activity.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{activity.customer}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Hizli Islemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-700 hover:bg-slate-800 hover:text-white" asChild>
                <a href="/dashboard/repairs">
                  <Wrench className="h-6 w-6 text-orange-400" />
                  <span className="text-sm">Yeni Servis</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-700 hover:bg-slate-800 hover:text-white" asChild>
                <a href="/dashboard/sales">
                  <ShoppingCart className="h-6 w-6 text-green-400" />
                  <span className="text-sm">Yeni Satis</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-700 hover:bg-slate-800 hover:text-white" asChild>
                <a href="/dashboard/customers">
                  <Users className="h-6 w-6 text-blue-400" />
                  <span className="text-sm">Musteri Ekle</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-700 hover:bg-slate-800 hover:text-white" asChild>
                <a href="/dashboard/appointments">
                  <Clock className="h-6 w-6 text-pink-400" />
                  <span className="text-sm">Randevu Al</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
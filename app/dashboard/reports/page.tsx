"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { FileText, TrendingUp, Users, Wrench, DollarSign, Download, Calendar } from "lucide-react"

interface MonthlyData {
  month: string
  income: number
  expense: number
  repairs: number
  newCustomers: number
}

const monthlyData: MonthlyData[] = [
  { month: "Ocak", income: 28500, expense: 12000, repairs: 45, newCustomers: 12 },
  { month: "Şubat", income: 32000, expense: 13500, repairs: 52, newCustomers: 15 },
  { month: "Mart", income: 29000, expense: 11000, repairs: 48, newCustomers: 10 },
  { month: "Nisan", income: 35000, expense: 15000, repairs: 60, newCustomers: 18 },
  { month: "Mayıs", income: 38000, expense: 16000, repairs: 65, newCustomers: 20 },
  { month: "Haziran", income: 42000, expense: 18000, repairs: 72, newCustomers: 22 },
]

const topServices = [
  { name: "Ekran Değişimi", count: 145, revenue: 217500 },
  { name: "Batarya Değişimi", count: 89, revenue: 71200 },
  { name: "Anakart Tamir", count: 34, revenue: 153000 },
  { name: "Arka Kapak Değişimi", count: 67, revenue: 53600 },
  { name: "Şarj Portu Değişimi", count: 52, revenue: 23400 },
]

const topCustomers = [
  { name: "Ahmet Yılmaz", repairs: 5, totalSpent: 8750 },
  { name: "Mehmet Kaya", repairs: 4, totalSpent: 6200 },
  { name: "Ayşe Demir", repairs: 3, totalSpent: 12800 },
  { name: "Fatma Şahin", repairs: 3, totalSpent: 9500 },
  { name: "Ali Veli", repairs: 2, totalSpent: 3400 },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = monthlyData.reduce((sum, d) => sum + d.expense, 0)
  const totalRepairs = monthlyData.reduce((sum, d) => sum + d.repairs, 0)
  const totalCustomers = monthlyData.reduce((sum, d) => sum + d.newCustomers, 0)

  const maxIncome = Math.max(...monthlyData.map(d => d.income))
  const maxExpense = Math.max(...monthlyData.map(d => d.expense))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Raporlar & Analiz</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir (6 Ay)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{totalIncome.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gider (6 Ay)</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₺{totalExpense.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tamir</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepairs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Müşteri</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="services">Hizmetler</TabsTrigger>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Aylık Gelir-Gider Grafiği
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data) => (
                  <div key={data.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">₺{data.income.toLocaleString("tr-TR")}</span>
                        <span className="text-red-600">₺{data.expense.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div
                        className="bg-green-500 rounded-l"
                        style={{ width: `${(data.income / maxIncome) * 50}%` }}
                      />
                      <div
                        className="bg-red-500 rounded-r"
                        style={{ width: `${(data.expense / maxExpense) * 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Aylık Tamir Sayısı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm">{data.month}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <div className="h-2 bg-blue-500 rounded" style={{ width: `${(data.repairs / 80) * 100}%` }} />
                      </div>
                      <span className="font-semibold">{data.repairs}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yeni Müşteri Kazanımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm">{data.month}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <div className="h-2 bg-purple-500 rounded" style={{ width: `${(data.newCustomers / 25) * 100}%` }} />
                      </div>
                      <span className="font-semibold">{data.newCustomers}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Yapılan Hizmetler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-sm text-muted-foreground">{service.count} tamir</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₺{service.revenue.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-muted-foreground">Gelir</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Değerli Müşteriler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.repairs} tamir</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₺{customer.totalSpent.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-muted-foreground">Toplam Harcama</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Download,
  Calendar,
  BarChart3,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Printer
} from "lucide-react"

interface MonthlyData {
  month: string
  income: number
  expense: number
  repairs: number
  newCustomers: number
  sales: number
}

const monthlyData: MonthlyData[] = [
  { month: "Ocak", income: 28500, expense: 12000, repairs: 45, newCustomers: 12, sales: 30 },
  { month: "Subat", income: 32000, expense: 13500, repairs: 52, newCustomers: 15, sales: 35 },
  { month: "Mart", income: 29000, expense: 11000, repairs: 48, newCustomers: 10, sales: 28 },
  { month: "Nisan", income: 35000, expense: 15000, repairs: 60, newCustomers: 18, sales: 42 },
  { month: "Mayis", income: 38000, expense: 16000, repairs: 65, newCustomers: 20, sales: 48 },
  { month: "Haziran", income: 42000, expense: 18000, repairs: 72, newCustomers: 22, sales: 55 },
]

const topServices = [
  { name: "Ekran Degisimi", count: 145, revenue: 217500, icon: "🔧" },
  { name: "Batarya Degisimi", count: 89, revenue: 71200, icon: "🔋" },
  { name: "Anakart Tamir", count: 34, revenue: 153000, icon: "🖥️" },
  { name: "Arka Kapak Degisimi", count: 67, revenue: 53600, icon: "📱" },
  { name: "Sarj Portu Degisimi", count: 52, revenue: 23400, icon: "🔌" },
]

const topCustomers = [
  { name: "Ahmet Yilmaz", repairs: 5, totalSpent: 8750, lastVisit: "2024-07-28" },
  { name: "Mehmet Kaya", repairs: 4, totalSpent: 6200, lastVisit: "2024-07-25" },
  { name: "Ayse Demir", repairs: 3, totalSpent: 12800, lastVisit: "2024-07-20" },
  { name: "Fatma Sahin", repairs: 3, totalSpent: 9500, lastVisit: "2024-07-15" },
  { name: "Ali Veli", repairs: 2, totalSpent: 3400, lastVisit: "2024-07-10" },
]

const topProducts = [
  { name: "iPhone Kilif", sold: 120, revenue: 18000 },
  { name: "Ekran Koruyucu", sold: 200, revenue: 16000 },
  { name: "Sarj Aleti", sold: 85, revenue: 17000 },
  { name: "Kulaklik", sold: 45, revenue: 15750 },
  { name: "Batarya", sold: 60, revenue: 19200 },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [reportType, setReportType] = useState<"pdf" | "excel">("pdf")
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)

  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0)
  const totalExpense = monthlyData.reduce((sum, d) => sum + d.expense, 0)
  const totalRepairs = monthlyData.reduce((sum, d) => sum + d.repairs, 0)
  const totalCustomers = monthlyData.reduce((sum, d) => sum + d.newCustomers, 0)
  const totalSales = monthlyData.reduce((sum, d) => sum + d.sales, 0)
  const netProfit = totalIncome - totalExpense

  const maxIncome = Math.max(...monthlyData.map(d => d.income))
  const maxExpense = Math.max(...monthlyData.map(d => d.expense))

  const handleDownload = () => {
    // Simulated download
    const reportContent = `
YESILTAS TEKNIK SERVIS - RAPOR
================================
Donem: Ocak - Haziran 2024

TOPLAM GELIR: ₺${totalIncome.toLocaleString("tr-TR")}
TOPLAM GIDER: ₺${totalExpense.toLocaleString("tr-TR")}
NET KAR: ₺${netProfit.toLocaleString("tr-TR")}
TOPLAM TAMIR: ${totalRepairs}
YENI MUSTERI: ${totalCustomers}
TOPLAM SATIS: ${totalSales}

Rapor tarihi: ${new Date().toLocaleDateString("tr-TR")}
    `.trim()

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `yesiltas-rapor-${new Date().toISOString().split("T")[0]}.${reportType === "pdf" ? "txt" : "txt"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsDownloadOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Raporlar & Analiz</h1>
          <p className="text-slate-400 mt-1">Isletme performansinizi takip edin</p>
        </div>
        <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              <Download className="mr-2 h-4 w-4" />
              Rapor Indir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Rapor Indir</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Rapor Formatı</label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as "pdf" | "excel")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pdf" className="text-white">📄 PDF Raporu</SelectItem>
                    <SelectItem value="excel" className="text-white">📊 Excel Raporu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-400">
                <p><span className="text-slate-300 font-medium">Icerik:</span> Genel bakis, gelir-gider ozeti, musteri ve hizmet istatistikleri</p>
                <p className="mt-1"><span className="text-slate-300 font-medium">Donem:</span> Son 6 ay</p>
              </div>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {reportType === "pdf" ? "PDF Olarak Indir" : "Excel Olarak Indir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ana Istatistikler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gelir (6 Ay)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₺{totalIncome.toLocaleString("tr-TR")}</div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span> gecen doneme gore
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gider (6 Ay)</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₺{totalExpense.toLocaleString("tr-TR")}</div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">+8%</span> gecen doneme gore
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Net Kar</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-blue-500" : "text-red-500"}`}>
              ₺{netProfit.toLocaleString("tr-TR")}
            </div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span className="text-slate-400">Kar marji: %{((netProfit / totalIncome) * 100).toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Islem</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{totalRepairs + totalSales}</div>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span className="text-slate-400">{totalRepairs} tamir, {totalSales} satis</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px] bg-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Genel Bakis</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Hizmetler</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Musteriler</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Urunler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Gelir-Gider Grafigi */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Aylik Gelir-Gider Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data) => (
                  <div key={data.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{data.month}</span>
                      <div className="flex gap-4">
                        <span className="text-green-400">₺{data.income.toLocaleString("tr-TR")}</span>
                        <span className="text-red-400">₺{data.expense.toLocaleString("tr-TR")}</span>
                        <span className={`font-medium ${data.income - data.expense >= 0 ? "text-blue-400" : "text-red-400"}`}>
                          ₺{(data.income - data.expense).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div
                        className="bg-green-600 rounded-l"
                        style={{ width: `${(data.income / maxIncome) * 50}%` }}
                      />
                      <div
                        className="bg-red-600 rounded-r"
                        style={{ width: `${(data.expense / maxExpense) * 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  Aylik Tamir Sayisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{data.month}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <div className="h-2 bg-blue-600 rounded" style={{ width: `${(data.repairs / 80) * 100}%` }} />
                      </div>
                      <span className="font-semibold text-white">{data.repairs}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                  Aylik Satis Sayisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{data.month}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <div className="h-2 bg-purple-600 rounded" style={{ width: `${(data.sales / 60) * 100}%` }} />
                      </div>
                      <span className="font-semibold text-white">{data.sales}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                En Cok Yapilan Hizmetler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="text-2xl">{service.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{service.name}</div>
                      <div className="text-sm text-slate-400">{service.count} tamir</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">₺{service.revenue.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-slate-500">Gelir</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                En Degerli Musteriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center gap-4 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{customer.name}</div>
                      <div className="text-sm text-slate-400">{customer.repairs} tamir • Son ziyaret: {customer.lastVisit}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">₺{customer.totalSpent.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-slate-500">Toplam Harcama</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-500" />
                En Cok Satan Urunler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="text-sm text-slate-400">{product.sold} adet satildi</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">₺{product.revenue.toLocaleString("tr-TR")}</div>
                      <div className="text-sm text-slate-500">Gelir</div>
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
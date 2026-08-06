"use client"

import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { fetchTransactions } from "@/lib/finance"
import { fetchRepairs } from "@/lib/repairs"
import { fetchSales } from "@/lib/sales"
import { fetchCustomers } from "@/lib/customers"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, TrendingUp, TrendingDown, DollarSign, Wrench, ShoppingCart, Users, Calendar, FileText, Filter } from "lucide-react"
import { format, parseISO, isWithinInterval, isValid, subMonths } from "date-fns"
import { tr } from "date-fns/locale"

interface FinanceRecord {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  description: string
  date: string
  source: string
}

interface RepairRecord {
  id: string
  customerName: string
  deviceModel: string
  serviceType: string
  status: string
  cost: number
  price: number
  date: string
}

interface SaleRecord {
  id: string
  customerName: string
  productName: string
  quantity: number
  totalPrice: number
  profit: number
  date: string
}

interface CustomerRecord {
  id: string
  name: string
  phone: string
  totalSpent: number
  visitCount: number
  lastVisit: string
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

// Güvenli tarih parse fonksiyonu
function safeParseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null
  try {
    const parsed = parseISO(dateStr)
    if (isValid(parsed)) return parsed
    return null
  } catch {
    return null
  }
}

// Güvenli tarih formatlama
function safeFormatDate(dateStr: string | undefined | null, fmt: string): string {
  const parsed = safeParseDate(dateStr)
  if (!parsed) return "-"
  try {
    return format(parsed, fmt, { locale: tr })
  } catch {
    return "-"
  }
}

// Güvenli ay anahtarı
function safeMonthKey(dateStr: string | undefined | null): string | null {
  const parsed = safeParseDate(dateStr)
  if (!parsed) return null
  try {
    return format(parsed, "yyyy-MM")
  } catch {
    return null
  }
}

// Güvenli ay etiketi
function safeMonthLabel(dateStr: string | undefined | null): string | null {
  const parsed = safeParseDate(dateStr)
  if (!parsed) return null
  try {
    return format(parsed, "MMM yyyy", { locale: tr })
  } catch {
    return null
  }
}

export default function ReportsPage() {
  const { toast, showToast, hideToast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }
  const { authorized, checking } = usePageAccess("Raporlar")

  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [financeData, setFinanceData] = useState<FinanceRecord[]>([])
  const [repairsData, setRepairsData] = useState<RepairRecord[]>([])
  const [salesData, setSalesData] = useState<SaleRecord[]>([])
  const [customersData, setCustomersData] = useState<CustomerRecord[]>([])
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "excel">("excel")
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

  useEffect(() => {
    // Varsayılan tarih aralığı: son 6 ay
    const end = new Date()
    const start = subMonths(end, 6)
    setDateRange({
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd")
    })

    // Supabase'den verileri çek
    Promise.all([fetchTransactions(), fetchRepairs(), fetchSales(), fetchCustomers()])
      .then(([finance, repairs, sales, customers]) => {
        const validFinance: FinanceRecord[] = finance
          .filter(f => f.date)
          .map(f => ({
            id: f.id,
            type: f.type,
            amount: f.amount,
            category: f.category,
            description: f.description,
            date: f.date,
            source: f.source,
          }))

        const validRepairs: RepairRecord[] = repairs
          .filter(r => r.createdAt)
          .map(r => ({
            id: r.id,
            customerName: r.customerName,
            deviceModel: `${r.brand} ${r.model}`.trim(),
            serviceType: r.issue || "Tamir",
            status: r.status,
            cost: r.cost,
            price: r.cost,
            date: r.createdAt,
          }))

        const validSales: SaleRecord[] = sales
          .filter(s => s.date)
          .map(s => ({
            id: s.id,
            customerName: s.customerName,
            productName: s.items.map(i => i.name).join(", ") || "—",
            quantity: s.items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: s.totalAmount,
            profit: 0,
            date: s.date,
          }))

        const validCustomers: CustomerRecord[] = customers
          .filter(c => c.id)
          .map(c => {
            const custSales = validSales.filter(s => s.customerName === c.name)
            const custRepairs = validRepairs.filter(r => r.customerName === c.name)
            return {
              id: c.id,
              name: c.name,
              phone: c.phone || c.phone1 || "",
              totalSpent: custSales.reduce((sum, s) => sum + s.totalPrice, 0) + custRepairs.reduce((sum, r) => sum + r.cost, 0),
              visitCount: custSales.length + custRepairs.length,
              lastVisit: c.lastVisit || "",
            }
          })

        setFinanceData(validFinance)
        setRepairsData(validRepairs)
        setSalesData(validSales)
        setCustomersData(validCustomers)
      })
      .catch((e) => {
        console.error("Veri yükleme hatası:", e)
      })
      .finally(() => setIsLoaded(true))
  }, [])

  // Tarih filtresi
  const filterByDate = <T extends { date: string }>(data: T[]) => {
    if (!dateRange.start || !dateRange.end) return data
    const startDate = safeParseDate(dateRange.start)
    const endDate = safeParseDate(dateRange.end)
    if (!startDate || !endDate) return data

    return data.filter(item => {
      const itemDate = safeParseDate(item.date)
      if (!itemDate) return false
      return isWithinInterval(itemDate, { start: startDate, end: endDate })
    })
  }

  const filteredFinance = filterByDate(financeData)
  const filteredRepairs = filterByDate(repairsData)
  const filteredSales = filterByDate(salesData)

  // Genel istatistikler
  const totalIncome = filteredFinance.filter(f => f.type === "income").reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  const totalExpense = filteredFinance.filter(f => f.type === "expense").reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  const netProfit = totalIncome - totalExpense
  const totalRepairs = filteredRepairs.length
  const totalSales = filteredSales.length
  const totalCustomers = customersData.length

  // Aylık veriler
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; gelir: number; gider: number; kar: number; tamir: number; satis: number }> = {}

    filteredFinance.forEach(f => {
      const monthKey = safeMonthKey(f.date)
      const monthLabel = safeMonthLabel(f.date)
      if (!monthKey || !monthLabel) return
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, gelir: 0, gider: 0, kar: 0, tamir: 0, satis: 0 }
      }
      if (f.type === "income") months[monthKey].gelir += (Number(f.amount) || 0)
      else months[monthKey].gider += (Number(f.amount) || 0)
    })

    filteredRepairs.forEach(r => {
      const monthKey = safeMonthKey(r.date)
      const monthLabel = safeMonthLabel(r.date)
      if (!monthKey || !monthLabel) return
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, gelir: 0, gider: 0, kar: 0, tamir: 0, satis: 0 }
      }
      months[monthKey].tamir += 1
    })

    filteredSales.forEach(s => {
      const monthKey = safeMonthKey(s.date)
      const monthLabel = safeMonthLabel(s.date)
      if (!monthKey || !monthLabel) return
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, gelir: 0, gider: 0, kar: 0, tamir: 0, satis: 0 }
      }
      months[monthKey].satis += 1
    })

    Object.keys(months).forEach(key => {
      months[key].kar = months[key].gelir - months[key].gider
    })

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredFinance, filteredRepairs, filteredSales])

  // Kategori dağılımı
  const incomeByCategory = useMemo(() => {
    const cats: Record<string, number> = {}
    filteredFinance.filter(f => f.type === "income").forEach(f => {
      const cat = f.category || "Diğer"
      cats[cat] = (cats[cat] || 0) + (Number(f.amount) || 0)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [filteredFinance])

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {}
    filteredFinance.filter(f => f.type === "expense").forEach(f => {
      const cat = f.category || "Diğer"
      cats[cat] = (cats[cat] || 0) + (Number(f.amount) || 0)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [filteredFinance])

  // En çok yapılan hizmetler
  const topServices = useMemo(() => {
    const services: Record<string, { name: string; count: number; revenue: number }> = {}
    filteredRepairs.forEach(r => {
      const svc = r.serviceType || "Bilinmiyor"
      if (!services[svc]) {
        services[svc] = { name: svc, count: 0, revenue: 0 }
      }
      services[svc].count += 1
      services[svc].revenue += (Number(r.price) || 0)
    })
    return Object.values(services).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [filteredRepairs])

  // En değerli müşteriler
  const topCustomers = useMemo(() => {
    return [...customersData]
      .sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0))
      .slice(0, 5)
  }, [customersData])

  // En çok satan ürünler
  const topProducts = useMemo(() => {
    const products: Record<string, { name: string; quantity: number; revenue: number }> = {}
    filteredSales.forEach(s => {
      const prod = s.productName || "Bilinmiyor"
      if (!products[prod]) {
        products[prod] = { name: prod, quantity: 0, revenue: 0 }
      }
      products[prod].quantity += (Number(s.quantity) || 0)
      products[prod].revenue += (Number(s.totalPrice) || 0)
    })
    return Object.values(products).sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  }, [filteredSales])

  const handleDownload = () => {
    const data = {
      tarihAraligi: `${dateRange.start} - ${dateRange.end}`,
      ozet: {
        toplamGelir: totalIncome,
        toplamGider: totalExpense,
        netKar: netProfit,
        toplamTamir: totalRepairs,
        toplamSatis: totalSales
      },
      aylikRapor: monthlyData,
      gelirKategorileri: incomeByCategory,
      giderKategorileri: expenseByCategory,
      topHizmetler: topServices,
      topMusteriler: topCustomers,
      topUrunler: topProducts
    }

    if (downloadFormat === "excel") {
      const csvContent = [
        ["Yeşiltaş Teknoloji - Rapor"],
        [`Tarih Aralığı: ${data.tarihAraligi}`],
        [],
        ["Özet"],
        ["Toplam Gelir", data.ozet.toplamGelir],
        ["Toplam Gider", data.ozet.toplamGider],
        ["Net Kâr", data.ozet.netKar],
        ["Toplam Tamir", data.ozet.toplamTamir],
        ["Toplam Satış", data.ozet.toplamSatis],
        [],
        ["Aylık Rapor"],
        ["Ay", "Gelir", "Gider", "Kâr", "Tamir", "Satış"],
        ...data.aylikRapor.map(m => [m.month, m.gelir, m.gider, m.kar, m.tamir, m.satis]),
        [],
        ["En Çok Yapılan Hizmetler"],
        ["Hizmet", "Adet", "Gelir"],
        ...data.topHizmetler.map(h => [h.name, h.count, h.revenue]),
        [],
        ["En Değerli Müşteriler"],
        ["Müşteri", "Toplam Harcama", "Ziyaret Sayısı"],
        ...data.topMusteriler.map(c => [c.name, c.totalSpent, c.visitCount]),
        [],
        ["En Çok Satan Ürünler"],
        ["Ürün", "Adet", "Gelir"],
        ...data.topUrunler.map(p => [p.name, p.quantity, p.revenue])
      ].map(row => row.join(";")).join("\n")

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `yesiltas-rapor-${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()
    } else {
      const rows = (label: string, arr: (string | number)[][]) =>
        `<h3>${label}</h3><table><tbody>${arr.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Yeşiltaş Teknoloji - Rapor</title>
            <style>
              body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
              h1 { color: #059669; margin-bottom: 4px; }
              h2 { color: #444; font-weight: normal; margin-top: 0; font-size: 14px; }
              h3 { margin-top: 24px; margin-bottom: 6px; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 4px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
              td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
              tr:first-child td { font-weight: bold; background: #f0fdf4; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>Yeşiltaş Teknoloji</h1>
            <h2>Rapor — ${data.tarihAraligi}</h2>
            ${rows("Özet", [
              ["Toplam Gelir", formatCurrency(data.ozet.toplamGelir)],
              ["Toplam Gider", formatCurrency(data.ozet.toplamGider)],
              ["Net Kâr", formatCurrency(data.ozet.netKar)],
              ["Toplam Tamir", String(data.ozet.toplamTamir)],
              ["Toplam Satış", String(data.ozet.toplamSatis)],
            ])}
            ${rows("Aylık Rapor", [
              ["Ay", "Gelir", "Gider", "Kâr", "Tamir", "Satış"],
              ...data.aylikRapor.map(m => [m.month, formatCurrency(m.gelir), formatCurrency(m.gider), formatCurrency(m.kar), String(m.tamir), String(m.satis)])
            ])}
            ${rows("En Çok Yapılan Hizmetler", [
              ["Hizmet", "Adet", "Gelir"],
              ...data.topHizmetler.map(h => [h.name, String(h.count), formatCurrency(h.revenue)])
            ])}
            ${rows("En Değerli Müşteriler", [
              ["Müşteri", "Toplam Harcama", "Ziyaret Sayısı"],
              ...data.topMusteriler.map(c => [c.name, formatCurrency(c.totalSpent), String(c.visitCount)])
            ])}
            ${rows("En Çok Satan Ürünler", [
              ["Ürün", "Adet", "Gelir"],
              ...data.topUrunler.map(p => [p.name, String(p.quantity), formatCurrency(p.revenue)])
            ])}
          </body>
        </html>
      `

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.focus()
          printWindow.print()
        }
      } else {
        showToast("Yazdırma penceresi açılamadı. Tarayıcınızın pop-up engelleyicisini kontrol edin.", "error")
      }
    }

    setShowDownloadDialog(false)
  }


  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetki kontrol ediliyor...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetkisiz erişim. Yönlendiriliyor...</div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Başlık */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Raporlar</h1>
            <p className="text-slate-400 mt-1">İşletme performansınızı analiz edin</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Rapor İndir
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Rapor İndir</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Format Seçin</label>
                    <Select value={downloadFormat} onValueChange={(v: "pdf" | "excel") => setDownloadFormat(v)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="excel">Excel (CSV)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    İndir
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tarih Filtresi */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Tarih Aralığı:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <span className="text-slate-500 self-center">-</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ₺{totalIncome.toLocaleString("tr-TR")}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Toplam Gider</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    ₺{totalExpense.toLocaleString("tr-TR")}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Net Kâr</p>
                  <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ₺{netProfit.toLocaleString("tr-TR")}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Toplam İşlem</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {totalRepairs + totalSales}
                  </p>
                  <p className="text-xs text-slate-500">
                    {totalRepairs} Tamir · {totalSales} Satış
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab'lar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Genel Bakış</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-blue-600">Hizmetler</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-blue-600">Müşteriler</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-600">Ürünler</TabsTrigger>
          </TabsList>

          {/* Genel Bakış */}
          <TabsContent value="overview" className="space-y-6">
            {/* Aylık Grafik */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Aylık Gelir - Gider - Kâr</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
                      <Bar dataKey="gider" fill="#ef4444" name="Gider" />
                      <Bar dataKey="kar" fill="#3b82f6" name="Kâr" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-8">Bu dönemde veri bulunmuyor.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gelir Kategorileri */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gelir Kategorileri</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={incomeByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incomeByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-center py-8">Gelir verisi bulunmuyor.</p>
                  )}
                </CardContent>
              </Card>

              {/* Gider Kategorileri */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gider Kategorileri</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400 text-center py-8">Gider verisi bulunmuyor.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hizmetler */}
          <TabsContent value="services" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  En Çok Yapılan Hizmetler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.length > 0 ? (
                    topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-600">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-white">{service.name}</p>
                            <p className="text-sm text-slate-400">{service.count} adet tamir</p>
                          </div>
                        </div>
                        <p className="text-emerald-400 font-bold">₺{service.revenue.toLocaleString("tr-TR")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">Bu dönemde hizmet kaydı bulunmuyor.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aylık Tamir Grafiği */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Aylık Tamir İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.some(m => m.tamir > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                      <Bar dataKey="tamir" fill="#3b82f6" name="Tamir Sayısı" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-8">Tamir verisi bulunmuyor.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Müşteriler */}
          <TabsContent value="customers" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  En Değerli Müşteriler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.length > 0 ? (
                    topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-600">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-white">{customer.name || "İsimsiz"}</p>
                            <p className="text-sm text-slate-400">{(customer.visitCount || 0)} ziyaret</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">₺{(Number(customer.totalSpent) || 0).toLocaleString("tr-TR")}</p>
                          <p className="text-xs text-slate-500">
                            Son ziyaret: {safeFormatDate(customer.lastVisit, "dd.MM.yyyy")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">Müşteri kaydı bulunmuyor.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ürünler */}
          <TabsContent value="products" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  En Çok Satan Ürünler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-600">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-white">{product.name}</p>
                            <p className="text-sm text-slate-400">{product.quantity} adet satıldı</p>
                          </div>
                        </div>
                        <p className="text-emerald-400 font-bold">₺{product.revenue.toLocaleString("tr-TR")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-8">Bu dönemde satış kaydı bulunmuyor.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aylık Satış Grafiği */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Aylık Satış İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.some(m => m.satis > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                      <Bar dataKey="satis" fill="#10b981" name="Satış Sayısı" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-8">Satış verisi bulunmuyor.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
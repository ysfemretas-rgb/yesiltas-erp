"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Package, Shield, Wrench, TrendingUp, TrendingDown } from "lucide-react"

interface Stats {
  totalSales: number
  totalCustomers: number
  totalInventory: number
  totalWarranties: number
  totalDevices: number
  totalIncome: number
  totalExpense: number
  totalDebt: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalCustomers: 0,
    totalInventory: 0,
    totalWarranties: 0,
    totalDevices: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalDebt: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)

    const { count: salesCount } = await supabase.from("sales").select("*", { count: "exact", head: true })
    const { count: customersCount } = await supabase.from("customers").select("*", { count: "exact", head: true })
    const { count: inventoryCount } = await supabase.from("inventory").select("*", { count: "exact", head: true })
    const { count: warrantiesCount } = await supabase.from("warranties").select("*", { count: "exact", head: true })
    const { count: devicesCount } = await supabase.from("devices").select("*", { count: "exact", head: true })

    const { data: incomeData } = await supabase.from("transactions").select("amount").eq("type", "income")
    const { data: expenseData } = await supabase.from("transactions").select("amount").eq("type", "expense")
    const { data: debtsData } = await supabase.from("debts").select("remaining")

    const totalIncome = incomeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalExpense = expenseData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalDebt = debtsData?.reduce((sum, d) => sum + (d.remaining || 0), 0) || 0

    setStats({
      totalSales: salesCount || 0,
      totalCustomers: customersCount || 0,
      totalInventory: inventoryCount || 0,
      totalWarranties: warrantiesCount || 0,
      totalDevices: devicesCount || 0,
      totalIncome,
      totalExpense,
      totalDebt
    })
    setLoading(false)
  }

  const cards = [
    { title: "Toplam Satış", value: stats.totalSales, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Müşteri Sayısı", value: stats.totalCustomers, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { title: "Stok Ürünü", value: stats.totalInventory, icon: Package, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Aktif Garanti", value: stats.totalWarranties, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Teknik Servis", value: stats.totalDevices, icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Toplam Borç", value: stats.totalDebt.toLocaleString("tr-TR") + " ₺", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { title: "Toplam Gelir", value: stats.totalIncome.toLocaleString("tr-TR") + " ₺", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "Toplam Gider", value: stats.totalExpense.toLocaleString("tr-TR") + " ₺", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

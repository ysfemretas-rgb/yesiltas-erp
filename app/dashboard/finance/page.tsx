"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, Wrench, ShoppingCart, HandCoins } from "lucide-react"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  customer?: string
  source: "repair" | "sale" | "manual"
  sourceId?: number
}

const initialTransactions: Transaction[] = [
  { id: 1, description: "iPhone 14 Pro Ekran Degisimi", amount: 4500, type: "income", category: "Tamir Geliri", date: "2026-07-29", customer: "Ahmet Yilmaz", source: "repair", sourceId: 1 },
  { id: 2, description: "Ekran Tedarik", amount: 1200, type: "expense", category: "Parca Maliyeti", date: "2026-07-28", customer: "Tedarikci A", source: "manual" },
  { id: 3, description: "Satis - iPhone 14 Pro Kilif + Ekran Koruyucu", amount: 550, type: "income", category: "Satis Geliri", date: "2026-08-01", customer: "Ahmet Yilmaz", source: "sale", sourceId: 1 },
  { id: 4, description: "Kira Odemesi", amount: 5000, type: "expense", category: "Kira", date: "2026-08-01", source: "manual" },
  { id: 5, description: "Samsung S23 Batarya Degisimi", amount: 800, type: "income", category: "Tamir Geliri", date: "2026-07-30", customer: "Mehmet Kaya", source: "repair", sourceId: 2 },
  { id: 6, description: "Elektrik Faturasi", amount: 850, type: "expense", category: "Fatura", date: "2026-08-01", source: "manual" },
]

const categories = ["Tamir Geliri", "Satis Geliri", "Parca Maliyeti", "Kira", "Fatura", "Maas", "Diger"]

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "income",
    category: "Tamir Geliri",
    date: new Date().toISOString().split("T")[0],
    source: "manual",
  })

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedFinance = localStorage.getItem("yt_finance")
        if (savedFinance) {
          const parsed = JSON.parse(savedFinance)
          if (parsed.length > 0) {
            setTransactions(parsed)
          }
        }
      } catch (e) {
        console.error("Load error:", e)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yt_finance", JSON.stringify(transactions))
    }
  }, [transactions])

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType
    const matchesCategory = filterCategory === "all" || t.category === filterCategory
    const matchesSource = filterSource === "all" || t.source === filterSource
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer && t.customer.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesCategory && matchesSource && matchesSearch
  })

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const incomeByCategory = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return
    const transaction: Transaction = {
      id: Date.now(),
      description: newTransaction.description,
      amount: Number(newTransaction.amount),
      type: newTransaction.type as "income" | "expense",
      category: newTransaction.category || "Diger",
      date: newTransaction.date || new Date().toISOString().split("T")[0],
      customer: newTransaction.customer,
      source: "manual",
    }
    setTransactions([transaction, ...transactions])
    setNewTransaction({
      type: "income",
      category: "Tamir Geliri",
      date: new Date().toISOString().split("T")[0],
      source: "manual",
    })
    setIsDialogOpen(false)
  }

  const handleDeleteTransaction = (id: number) => {
    if (confirm("Bu islemi silmek istediginize emin misiniz?")) {
      setTransactions(transactions.filter(t => t.id !== id))
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "repair": return <Wrench className="h-3 w-3 mr-1" />
      case "sale": return <ShoppingCart className="h-3 w-3 mr-1" />
      default: return <HandCoins className="h-3 w-3 mr-1" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "repair": return "Teknik Servis"
      case "sale": return "Satislar"
      default: return "Manuel"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Finans Yonetimi</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Islem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Finansal Islem</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Islem Tipi</label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as "income" | "expense" })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="income" className="text-white">Gelir</SelectItem>
                      <SelectItem value="expense" className="text-white">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tutar</label>
                  <Input
                    type="number"
                    value={newTransaction.amount || ""}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Aciklama</label>
                <Input
                  value={newTransaction.description || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Islem aciklamasi"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tarih</label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Musteri/Tedarikci (Opsiyonel)</label>
                <Input
                  value={newTransaction.customer || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, customer: e.target.value })}
                  placeholder="Isim girin"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleAddTransaction} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Net Bakiye</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Gelir Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(incomeByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 text-sm">{cat}</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Gider Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(expenseByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 text-sm">{cat}</span>
                  <span className="text-red-400 font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Islem Gecmisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tumu</SelectItem>
                  <SelectItem value="income" className="text-white">Gelir</SelectItem>
                  <SelectItem value="expense" className="text-white">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tum Kategoriler</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kaynak" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tum Kaynaklar</SelectItem>
                  <SelectItem value="manual" className="text-white">Manuel</SelectItem>
                  <SelectItem value="repair" className="text-white">Teknik Servis</SelectItem>
                  <SelectItem value="sale" className="text-white">Satislar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-slate-700">
            <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-slate-400 border-b border-slate-700 bg-slate-800/50">
              <div className="col-span-2">Aciklama</div>
              <div className="col-span-2">Kategori</div>
              <div className="col-span-1">Tarih</div>
              <div className="col-span-2">Musteri/Tedarikci</div>
              <div className="col-span-1">Kaynak</div>
              <div className="col-span-2 text-right">Tutar</div>
              <div className="col-span-1 text-center">Tip</div>
              <div className="col-span-1 text-center">Sil</div>
            </div>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="grid grid-cols-12 gap-2 p-3 text-sm border-b border-slate-700 last:border-0 items-center hover:bg-slate-800/50">
                <div className="col-span-2 font-medium text-white truncate">{transaction.description}</div>
                <div className="col-span-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">{transaction.category}</Badge>
                </div>
                <div className="col-span-1 text-slate-400">{transaction.date}</div>
                <div className="col-span-2 text-slate-400 truncate">{transaction.customer || "-"}</div>
                <div className="col-span-1">
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {getSourceIcon(transaction.source)}
                    {getSourceLabel(transaction.source)}
                  </Badge>
                </div>
                <div className={`col-span-2 text-right font-semibold ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                  {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </div>
                <div className="col-span-1 text-center">
                  <Badge className={transaction.type === "income" ? "bg-green-900/50 text-green-300 border-green-700" : "bg-red-900/50 text-red-300 border-red-700"}>
                    {transaction.type === "income" ? "Gelir" : "Gider"}
                  </Badge>
                </div>
                <div className="col-span-1 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Islem bulunamadi.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
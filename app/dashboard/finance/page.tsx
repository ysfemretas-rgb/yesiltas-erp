"use client"

import { useState } from "react"
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
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter } from "lucide-react"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  customer?: string
}

const initialTransactions: Transaction[] = [
  { id: 1, description: "iPhone 14 Pro Tamir", amount: 3500, type: "income", category: "Tamir Geliri", date: "2024-01-15", customer: "Ahmet Yilmaz" },
  { id: 2, description: "Ekran Tedarik", amount: 1200, type: "expense", category: "Parca Maliyeti", date: "2024-01-14", customer: "Tedarikci A" },
  { id: 3, description: "Samsung S23 Batarya Degisimi", amount: 800, type: "income", category: "Tamir Geliri", date: "2024-01-13", customer: "Mehmet Kaya" },
  { id: 4, description: "Kira Odemesi", amount: 5000, type: "expense", category: "Kira", date: "2024-01-01" },
  { id: 5, description: "MacBook Air Anakart Tamir", amount: 4500, type: "income", category: "Tamir Geliri", date: "2024-01-10", customer: "Ayse Demir" },
  { id: 6, description: "Elektrik Faturasi", amount: 850, type: "expense", category: "Fatura", date: "2024-01-05" },
]

const categories = Array.from(new Set(initialTransactions.map(t => t.category)))

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "income",
    category: "Tamir Geliri",
    date: new Date().toISOString().split("T")[0],
  })

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType
    const matchesCategory = filterCategory === "all" || t.category === filterCategory
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer && t.customer.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesCategory && matchesSearch
  })

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

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
    }
    setTransactions([transaction, ...transactions])
    setNewTransaction({
      type: "income",
      category: "Tamir Geliri",
      date: new Date().toISOString().split("T")[0],
    })
    setIsDialogOpen(false)
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
                      <SelectItem value="Diger" className="text-white">Diger</SelectItem>
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
            <div className="text-2xl font-bold text-green-500">₺{totalIncome.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₺{totalExpense.toLocaleString("tr-TR")}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Net Bakiye</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              ₺{balance.toLocaleString("tr-TR")}
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
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tumu</SelectItem>
                  <SelectItem value="income" className="text-white">Gelir</SelectItem>
                  <SelectItem value="expense" className="text-white">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tum Kategoriler</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-slate-700">
            <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-slate-400 border-b border-slate-700 bg-slate-800/50">
              <div className="col-span-3">Aciklama</div>
              <div className="col-span-2">Kategori</div>
              <div className="col-span-2">Tarih</div>
              <div className="col-span-2">Musteri/Tedarikci</div>
              <div className="col-span-2 text-right">Tutar</div>
              <div className="col-span-1 text-center">Tip</div>
            </div>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="grid grid-cols-12 gap-2 p-3 text-sm border-b border-slate-700 last:border-0 items-center hover:bg-slate-800/50">
                <div className="col-span-3 font-medium text-white">{transaction.description}</div>
                <div className="col-span-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">{transaction.category}</Badge>
                </div>
                <div className="col-span-2 text-slate-400">{transaction.date}</div>
                <div className="col-span-2 text-slate-400">{transaction.customer || "-"}</div>
                <div className={`col-span-2 text-right font-semibold ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                  {transaction.type === "income" ? "+" : "-"}₺{transaction.amount.toLocaleString("tr-TR")}
                </div>
                <div className="col-span-1 text-center">
                  <Badge className={transaction.type === "income" ? "bg-green-900/50 text-green-300 border-green-700" : "bg-red-900/50 text-red-300 border-red-700"}>
                    {transaction.type === "income" ? "Gelir" : "Gider"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
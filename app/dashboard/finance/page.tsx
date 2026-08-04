"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpDown, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Plus, Trash2, Edit, Save, X, Download } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface Transaction {
  id: string
  type: "income" | "expense"
  category: string
  description: string
  amount: number
  date: string
  relatedId?: string
  relatedType?: string
}

interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  netProfit: number
  monthlyData: { month: string; income: number; expense: number }[]
  categoryBreakdown: { category: string; amount: number; type: "income" | "expense" }[]
}

const CATEGORIES = {
  income: ["Tamir Geliri", "Satış Geliri", "Diğer Gelir"],
  expense: ["Sarf Malzeme", "Personel", "Kira", "Fatura", "Diğer Gider"],
}

export default function FinancePage() {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "expense",
    category: "",
    description: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  })
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    monthlyData: [],
    categoryBreakdown: [],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("yt_user")
      if (!userData) {
        window.location.href = "/"
        return
      }
      try {
        const user = JSON.parse(userData)
        if (user.role === "admin" || (user.permissions && user.permissions.includes("Finans"))) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
        }
      } catch {
        window.location.href = "/"
        return
      }
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (!checking && !authorized) {
      window.location.href = "/dashboard"
    }
  }, [checking, authorized])

  useEffect(() => {
    const saved = localStorage.getItem("yt_finance_transactions")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTransactions(parsed)
      } catch {
        setTransactions([])
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("yt_finance_transactions", JSON.stringify(transactions))
      calculateSummary()
    }
  }, [transactions, isLoaded])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-500">Bu sayfaya erişim izniniz yok.</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const calculateSummary = () => {
    const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const monthlyData: { month: string; income: number; expense: number }[] = []
    const months = [...new Set(transactions.map((t) => t.date.substring(0, 7)))].sort()

    months.forEach((month) => {
      const monthTransactions = transactions.filter((t) => t.date.startsWith(month))
      monthlyData.push({
        month,
        income: monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
      })
    })

    const categoryBreakdown: { category: string; amount: number; type: "income" | "expense" }[] = []
    const categories = [...new Set(transactions.map((t) => t.category))]
    categories.forEach((category) => {
      const categoryTransactions = transactions.filter((t) => t.category === category)
      if (categoryTransactions.length > 0) {
        categoryBreakdown.push({
          category,
          amount: categoryTransactions.reduce((sum, t) => sum + t.amount, 0),
          type: categoryTransactions[0].type,
        })
      }
    })

    setSummary({
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      monthlyData,
      categoryBreakdown,
    })
  }

  const handleAddTransaction = () => {
    if (!newTransaction.category || !newTransaction.description || !newTransaction.amount) {
      console.error("Hata: Lütfen tüm alanları doldurun.")
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: newTransaction.type as "income" | "expense",
      category: newTransaction.category,
      description: newTransaction.description,
      amount: Number(newTransaction.amount),
      date: newTransaction.date || format(new Date(), "yyyy-MM-dd"),
    }

    setTransactions([...transactions, transaction])
    setNewTransaction({
      type: "expense",
      category: "",
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
    })
    setIsAddOpen(false)

    console.log("Başarılı: İşlem başarıyla eklendi.")
  }

  const handleUpdateTransaction = () => {
    if (!editingTransaction) return

    setTransactions(transactions.map((t) => (t.id === editingTransaction.id ? editingTransaction : t)))
    setIsEditOpen(false)
    setEditingTransaction(null)

    console.log("Başarılı: İşlem başarıyla güncellendi.")
  }

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id))

    console.log("Başarılı: İşlem başarıyla silindi.")
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false
    if (filterCategory !== "all" && t.category !== filterCategory) return false
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    return true
  })

  const exportToCSV = () => {
    const csv = [
      ["Tarih", "Tip", "Kategori", "Açıklama", "Tutar"],
      ...filteredTransactions.map((t) => [t.date, t.type === "income" ? "Gelir" : "Gider", t.category, t.description, t.amount.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finans-raporu-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    console.log("Başarılı: Rapor indirildi.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Finans Yönetimi</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.totalIncome.toLocaleString("tr-TR")} ₺</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.totalExpense.toLocaleString("tr-TR")} ₺</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Kâr</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summary.netProfit.toLocaleString("tr-TR")} ₺
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aylık Gelir/Gider Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ay</TableHead>
                    <TableHead>Gelir</TableHead>
                    <TableHead>Gider</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.monthlyData.map((data) => (
                    <TableRow key={data.month}>
                      <TableCell>{data.month}</TableCell>
                      <TableCell className="text-green-600">{data.income.toLocaleString("tr-TR")} ₺</TableCell>
                      <TableCell className="text-red-600">{data.expense.toLocaleString("tr-TR")} ₺</TableCell>
                      <TableCell className={data.income - data.expense >= 0 ? "text-green-600" : "text-red-600"}>
                        {(data.income - data.expense).toLocaleString("tr-TR")} ₺
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kategori Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === "income" ? "default" : "destructive"}>
                        {item.type === "income" ? "Gelir" : "Gider"}
                      </Badge>
                      <span>{item.category}</span>
                    </div>
                    <span className={`font-semibold ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {item.amount.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>İşlem Listesi</CardTitle>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Yeni İşlem
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Yeni İşlem Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>İşlem Tipi</Label>
                        <Select
                          value={newTransaction.type}
                          onValueChange={(value: "income" | "expense") =>
                            setNewTransaction({ ...newTransaction, type: value, category: "" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Gelir</SelectItem>
                            <SelectItem value="expense">Gider</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Select
                          value={newTransaction.category}
                          onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES[newTransaction.type as "income" | "expense"].map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Açıklama</Label>
                        <Input
                          value={newTransaction.description}
                          onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                          placeholder="İşlem açıklaması..."
                        />
                      </div>
                      <div>
                        <Label>Tutar</Label>
                        <Input
                          type="number"
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Tarih</Label>
                        <Input
                          type="date"
                          value={newTransaction.date}
                          onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddTransaction} className="w-full bg-blue-600 hover:bg-blue-700">
                        <Save className="mr-2 h-4 w-4" />
                        Kaydet
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={filterType} onValueChange={(value: "all" | "income" | "expense") => setFilterType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="income">Gelir</SelectItem>
                      <SelectItem value="expense">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-32" />
                  <span>-</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-32" />
                </div>

                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date), "dd MMM yyyy", { locale: tr })}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                            {transaction.type === "income" ? "Gelir" : "Gider"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell
                          className={transaction.type === "income" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {transaction.amount.toLocaleString("tr-TR")} ₺
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTransaction(transaction)
                                setIsEditOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTransaction(transaction.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İşlem Düzenle</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={editingTransaction.category}
                  onValueChange={(value) => setEditingTransaction({ ...editingTransaction, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[editingTransaction.type].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Tutar</Label>
                <Input
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateTransaction} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Güncelle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
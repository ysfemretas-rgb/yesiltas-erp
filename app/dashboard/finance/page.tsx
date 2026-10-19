"use client"

import { localDateStr } from "@/lib/dates"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"

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
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, Wrench, ShoppingCart, HandCoins, Save, Pencil, Calendar, Download } from "lucide-react"
import { exportToExcel } from "@/lib/exportExcel"
import { Pagination } from "@/components/Pagination"
import { printDayClose } from "@/lib/dayClose"
import { diffFields } from "@/lib/diff"
import { logChange } from "@/lib/activityLog"
import { ReconcileDialog } from "@/components/finance/ReconcileDialog"
import { CashCountDialog } from "@/components/finance/CashCountDialog"
import { PaymentCalendarDialog } from "@/components/finance/PaymentCalendarDialog"
import { Transaction, fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/lib/finance"

const categories = ["Tamir Geliri", "Satış Geliri", "Parça Maliyeti", "Kira", "Fatura", "Maaş", "Diğer"]

export default function FinancePage() {
  const { toast, showToast, hideToast } = useToast()

  const { authorized, checking } = usePageAccess("Finans")
  const isManager = useIsManager()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [listPage, setListPage] = useState(1)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [cashOpen, setCashOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const PAGE_SIZE = 30

  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "income",
    category: "Tamir Geliri",
    date: localDateStr(),
    source: "manual",
  })

  // Supabase'den yükle (eski localStorage verisi varsa bir kere otomatik aktarılır)
  useEffect(() => {
    let cancelled = false
    fetchTransactions()
      .then((data) => {
        if (!cancelled) setTransactions(data)
      })
      .catch((e) => {
        console.error("Load error:", e)
        if (!cancelled) showToast("İşlemler yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // (Eskiden kasa kayıtları tarayıcıya da kopyalanıyordu; artık gerek kalmadığı için kaldırıldı.)

  useEffect(() => { setListPage(1) }, [filterType, filterCategory, filterSource, searchTerm])

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType
    const matchesCategory = filterCategory === "all" || t.category === filterCategory
    const matchesSource = filterSource === "all" || t.source === filterSource
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer && t.customer.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesCategory && matchesSource && matchesSearch
  })

  const todayStr = localDateStr()

  const exportFinance = () => {
    exportToExcel("kasa", "Kasa Hareketleri", filteredTransactions.map(t => ({
      "Tarih": t.date,
      "Tür": t.type === "income" ? "Gelir" : "Gider",
      "Kategori": t.category,
      "Açıklama": t.description,
      "Müşteri/Tedarikçi": t.customer || "",
      "Kaynak": t.source === "sale" ? "Satış" : t.source === "repair" ? "Tamir" : "Manuel",
      "Tutar (TL)": t.type === "income" ? t.amount : -t.amount,
    })))
  }
  const todayIncome = transactions.filter(t => t.type === "income" && t.date === todayStr).reduce((sum, t) => sum + t.amount, 0)
  const todayExpense = transactions.filter(t => t.type === "expense" && t.date === todayStr).reduce((sum, t) => sum + t.amount, 0)
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

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      showToast("Lütfen açıklama ve tutar girin!", "error")
      return
    }
    try {
      const transaction = await createTransaction({
        description: newTransaction.description,
        amount: Number(newTransaction.amount),
        type: newTransaction.type as "income" | "expense",
        category: newTransaction.category || "Diğer",
        date: newTransaction.date || localDateStr(),
        customer: newTransaction.customer,
        source: "manual",
      })
      setTransactions([transaction, ...transactions])
      setNewTransaction({
        type: "income",
        category: "Tamir Geliri",
        date: localDateStr(),
        source: "manual",
      })
      setIsDialogOpen(false)
      showToast("İşlem eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("İşlem eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return
    if (!editingTransaction.description || !editingTransaction.amount) {
      showToast("Lütfen açıklama ve tutar girin!", "error")
      return
    }
    try {
      const before = transactions.find(t => t.id === editingTransaction.id)
      const updated = await updateTransaction(editingTransaction.id, editingTransaction)
      if (before) {
        logChange("Finans", "updated", `Kasa kaydı düzenlendi: ${before.description}`, diffFields(
          before as any,
          updated as any,
          [{ key: "amount", label: "Tutar" }, { key: "type", label: "Tür" }, { key: "category", label: "Kategori" }, { key: "description", label: "Açıklama" }, { key: "date", label: "Tarih" }, { key: "customer", label: "Müşteri/Tedarikçi" }]
        ))
      }
      setTransactions(transactions.map(t => t.id === updated.id ? updated : t))
      setIsEditOpen(false)
      setEditingTransaction(null)
      showToast("İşlem güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("İşlem güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    const t = transactions.find(tx => tx.id === id)
    if (!t) return
    if (!confirm(`\u{26A0} *${t.description}* işlemini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    try {
      await deleteTransaction(id)
      logChange("Finans", "deleted", `Kasa kaydı SİLİNDİ: ${t.description} — ${t.type === "income" ? "gelir" : "gider"} ${t.amount.toLocaleString("tr-TR")} TL (${t.date})`, [])
      setTransactions(transactions.filter(t => t.id !== id))
      showToast("İşlem silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("İşlem silinirken bir sorun oluştu.", "error")
    }
  }

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction })
    setIsEditOpen(true)
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
      case "sale": return "Satışlar"
      default: return "Manuel"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }


  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yetki kontrolü yapılıyor...</div>
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">💰 Finans Yönetimi</h1>
        <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={() => printDayClose(todayStr, transactions)} className="border-slate-600 text-slate-300 hover:text-white">
          📊 Gün Sonu
        </Button>
        <Button variant="outline" onClick={exportFinance} className="border-slate-600 text-slate-300 hover:text-white">
          <Download className="mr-2 h-4 w-4" />Excel
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Finansal İşlem</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">İşlem Tipi</label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as "income" | "expense" })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="income" className="text-white">Gelir</SelectItem>
                      <SelectItem value="expense" className="text-white">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tutar <span className="text-red-400">*</span></label>
                  <Input
                    type="number"
                    value={newTransaction.amount || ""}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Açıklama <span className="text-red-400">*</span></label>
                <Input
                  value={newTransaction.description || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="İşlem açıklaması"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
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
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Müşteri/Tedarikçi (Opsiyonel)</label>
                <Input
                  value={newTransaction.customer || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, customer: e.target.value })}
                  placeholder="İsim girin"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleAddTransaction} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setReconcileOpen(true)} className="border-slate-600 text-slate-300 hover:text-white">🔎 Mutabakat</Button>
        <Button variant="outline" onClick={() => setCashOpen(true)} className="border-slate-600 text-slate-300 hover:text-white">💵 Kasa Sayımı</Button>
        <Button variant="outline" onClick={() => setCalendarOpen(true)} className="border-slate-600 text-slate-300 hover:text-white">📅 Ödeme Takvimi</Button>
      </div>
      <ReconcileDialog open={reconcileOpen} onOpenChange={setReconcileOpen} notify={showToast} onChanged={() => fetchTransactions().then(setTransactions).catch(() => undefined)} />
      <CashCountDialog open={cashOpen} onOpenChange={setCashOpen} transactions={transactions} notify={showToast} />
      <PaymentCalendarDialog open={calendarOpen} onOpenChange={setCalendarOpen} isManager={isManager} notify={showToast} onChanged={() => fetchTransactions().then(setTransactions).catch(() => undefined)} />

      {/* Today's summary */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Bugünkü Özet ({new Date().toLocaleDateString("tr-TR")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400 text-sm">Gelir:</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(todayIncome)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-slate-400 text-sm">Gider:</span>
              <span className="text-red-400 font-semibold">{formatCurrency(todayExpense)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-slate-400 text-sm">Net:</span>
              <span className={`font-semibold ${todayIncome - todayExpense >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(todayIncome - todayExpense)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Toplam Gider</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Net Bakiye</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Gelir Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(incomeByCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 text-sm">{cat}</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
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

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>İşlem Geçmişi</span>
            <span className="text-sm text-slate-400">{filteredTransactions.length} kayıt</span>
          </CardTitle>
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
                  <SelectItem value="all" className="text-white">Tümü</SelectItem>
                  <SelectItem value="income" className="text-white">Gelir</SelectItem>
                  <SelectItem value="expense" className="text-white">Gider</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tüm Kategoriler</SelectItem>
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
                  <SelectItem value="all" className="text-white">Tüm Kaynaklar</SelectItem>
                  <SelectItem value="manual" className="text-white">Manuel</SelectItem>
                  <SelectItem value="repair" className="text-white">Teknik Servis</SelectItem>
                  <SelectItem value="sale" className="text-white">Satışlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-slate-700 overflow-x-auto">
            <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-slate-400 border-b border-slate-700 bg-slate-800/50">
              <div className="col-span-2">Açıklama</div>
              <div className="col-span-2">Kategori</div>
              <div className="col-span-1">Tarih</div>
              <div className="col-span-2">Müşteri/Tedarikçi</div>
              <div className="col-span-1">Kaynak</div>
              <div className="col-span-2 text-right">Tutar</div>
              <div className="col-span-1 text-center">Tip</div>
              <div className="col-span-1 text-center">İşlem</div>
            </div>
            {filteredTransactions.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE).map((transaction) => (
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
                <div className={`col-span-2 text-right font-semibold ${transaction.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </div>
                <div className="col-span-1 text-center">
                  <Badge className={transaction.type === "income" ? "bg-emerald-900/50 text-emerald-300 border-emerald-700" : "bg-red-900/50 text-red-300 border-red-700"}>
                    {transaction.type === "income" ? "Gelir" : "Gider"}
                  </Badge>
                </div>
                <div className="col-span-1 text-center flex justify-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(transaction)}
                    className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {isManager && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                İşlem bulunamadı.
              </div>
            )}
            </div>
          </div>
          <Pagination
            currentPage={listPage}
            totalPages={Math.ceil(filteredTransactions.length / PAGE_SIZE)}
            goToPage={(p) => setListPage(Math.max(1, Math.min(p, Math.ceil(filteredTransactions.length / PAGE_SIZE))))}
            goToNext={() => setListPage(p => Math.min(p + 1, Math.ceil(filteredTransactions.length / PAGE_SIZE)))}
            goToPrev={() => setListPage(p => Math.max(p - 1, 1))}
            totalItems={filteredTransactions.length}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">İşlem Düzenle</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">İşlem Tipi</label>
                  <Select
                    value={editingTransaction.type}
                    onValueChange={(value) => setEditingTransaction({ ...editingTransaction, type: value as "income" | "expense" })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="income" className="text-white">Gelir</SelectItem>
                      <SelectItem value="expense" className="text-white">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tutar <span className="text-red-400">*</span></label>
                  <Input
                    type="number"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Açıklama <span className="text-red-400">*</span></label>
                <Input
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Kategori</label>
                  <Select
                    value={editingTransaction.category}
                    onValueChange={(value) => setEditingTransaction({ ...editingTransaction, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
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
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Müşteri/Tedarikçi</label>
                <Input
                  value={editingTransaction.customer || ""}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, customer: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleUpdateTransaction} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />Güncelle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
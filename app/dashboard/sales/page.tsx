"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  UserPlus,
  X,
  Save,
  Minus,
  Package,
  Wallet,
  Banknote,
  CreditCard,
  Receipt,
  MessageCircle
} from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
  phone2?: string
  email?: string
}

interface SaleItem {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Sale {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  items: SaleItem[]
  totalAmount: number
  paid: number
  remaining: number
  paymentType: "cash" | "card" | "transfer" | "partial" | "unpaid"
  date: string
  status: "completed" | "cancelled"
}

interface FinanceTransaction {
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

const initialCustomers: Customer[] = [
  { id: 1, name: "Ahmet Yilmaz", phone: "0555 123 4567", phone2: "0532 987 6543" },
  { id: 2, name: "Mehmet Kaya", phone: "0555 234 5678" },
  { id: 3, name: "Ayse Demir", phone: "0555 345 6789", phone2: "0543 111 2222" },
]

const initialSales: Sale[] = [
  {
    id: 1,
    customerId: 1,
    customerName: "Ahmet Yilmaz",
    customerPhone: "0555 123 4567",
    items: [
      { id: 1, productName: "iPhone 14 Pro Kilif", quantity: 1, unitPrice: 250, totalPrice: 250 },
      { id: 2, productName: "Ekran Koruyucu", quantity: 2, unitPrice: 150, totalPrice: 300 }
    ],
    totalAmount: 550,
    paid: 550,
    remaining: 0,
    paymentType: "cash",
    date: "2026-08-01",
    status: "completed"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Mehmet Kaya",
    customerPhone: "0555 234 5678",
    items: [
      { id: 3, productName: "Samsung S23 Kilif", quantity: 1, unitPrice: 200, totalPrice: 200 }
    ],
    totalAmount: 200,
    paid: 200,
    remaining: 0,
    paymentType: "card",
    date: "2026-08-01",
    status: "completed"
  }
]

const initialStock = [
  { id: 1, name: "iPhone 14 Pro Kilif", quantity: 15, unitPrice: 150 },
  { id: 2, name: "Samsung S23 Kilif", quantity: 10, unitPrice: 120 },
  { id: 3, name: "Ekran Koruyucu", quantity: 50, unitPrice: 80 },
  { id: 4, name: "Sarj Aleti", quantity: 20, unitPrice: 200 },
  { id: 5, name: "Kulaklik", quantity: 8, unitPrice: 350 },
]

const initialFinance: FinanceTransaction[] = [
  { id: 1, description: "Satis - iPhone 14 Pro Kilif + Ekran Koruyucu", amount: 550, type: "income", category: "Satis Geliri", date: "2026-08-01", customer: "Ahmet Yilmaz", source: "sale", sourceId: 1 },
]

export default function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [stock, setStock] = useState(initialStock)
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(initialFinance)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  const [paymentType, setPaymentType] = useState<string>("cash")
  const [paidAmount, setPaidAmount] = useState<string>("")

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    phone2: "",
    email: ""
  })

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSales = localStorage.getItem("yt_sales")
        const savedCustomers = localStorage.getItem("yt_customers")
        const savedStock = localStorage.getItem("yt_stock")
        const savedFinance = localStorage.getItem("yt_finance")
        if (savedSales) setSales(JSON.parse(savedSales))
        if (savedCustomers) setCustomers(JSON.parse(savedCustomers))
        if (savedStock) setStock(JSON.parse(savedStock))
        if (savedFinance) setFinanceTransactions(JSON.parse(savedFinance))
      } catch (e) {
        console.error("Load error:", e)
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yt_sales", JSON.stringify(sales))
      localStorage.setItem("yt_customers", JSON.stringify(customers))
      localStorage.setItem("yt_stock", JSON.stringify(stock))
      localStorage.setItem("yt_finance", JSON.stringify(financeTransactions))
    }
  }, [sales, customers, stock, financeTransactions])

  const filteredSales = sales.filter(s => 
    s.status === "completed" && (
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  )

  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.paid, 0)
  const totalSales = sales.filter(s => s.status === "completed").length
  const cancelledSales = sales.filter(s => s.status === "cancelled")
  const totalRemaining = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.remaining, 0)

  const addToCart = (productName: string, unitPrice: number) => {
    const existing = cartItems.find(item => item.productName === productName)
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.productName === productName 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        id: Date.now(),
        productName,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice
      }])
    }

    setStock(stock.map(s => 
      s.name === productName ? { ...s, quantity: s.quantity - 1 } : s
    ))
  }

  const removeFromCart = (productName: string) => {
    const item = cartItems.find(i => i.productName === productName)
    if (item && item.quantity > 1) {
      setCartItems(cartItems.map(i => 
        i.productName === productName 
          ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.unitPrice }
          : i
      ))
    } else {
      setCartItems(cartItems.filter(i => i.productName !== productName))
    }

    setStock(stock.map(s => 
      s.name === productName ? { ...s, quantity: s.quantity + 1 } : s
    ))
  }

  const calculateRemaining = (total: number, paid: number) => {
    return Math.max(0, total - paid)
  }

  const addFinanceTransaction = (sale: Sale) => {
    if (sale.paid <= 0) return
    const itemsDesc = sale.items.map(i => `${i.productName} x${i.quantity}`).join(", ")
    const newTransaction: FinanceTransaction = {
      id: Date.now(),
      description: `Satis - ${itemsDesc}`,
      amount: sale.paid,
      type: "income",
      category: "Satis Geliri",
      date: new Date().toISOString().split("T")[0],
      customer: sale.customerName,
      source: "sale",
      sourceId: sale.id,
    }
    setFinanceTransactions(prev => [newTransaction, ...prev])
  }

  const handleCompleteSale = () => {
    if (!selectedCustomer || cartItems.length === 0) return

    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const paidNum = paymentType === "partial" ? (parseFloat(paidAmount) || 0) : (paymentType === "unpaid" ? 0 : total)
    const remainingNum = calculateRemaining(total, paidNum)

    const newSale: Sale = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [...cartItems],
      totalAmount: total,
      paid: paidNum,
      remaining: remainingNum,
      paymentType: paymentType as Sale["paymentType"],
      date: new Date().toISOString().split("T")[0],
      status: "completed"
    }

    setSales([newSale, ...sales])

    // Add to finance
    if (paidNum > 0) {
      addFinanceTransaction(newSale)
    }

    setCartItems([])
    setSelectedCustomer("")
    setPaymentType("cash")
    setPaidAmount("")
    setIsNewSaleOpen(false)
  }

  const handleCancelSale = (saleId: number) => {
    const sale = sales.find(s => s.id === saleId)
    if (!sale) return

    sale.items.forEach(item => {
      setStock(prev => prev.map(s => 
        s.name === item.productName ? { ...s, quantity: s.quantity + item.quantity } : s
      ))
    })

    setSales(sales.map(s => 
      s.id === saleId ? { ...s, status: "cancelled" } : s
    ))

    // Remove related finance transactions
    setFinanceTransactions(prev => prev.filter(t => !(t.source === "sale" && t.sourceId === saleId)))
  }

  const handleDeleteSale = (saleId: number) => {
    const sale = sales.find(s => s.id === saleId)
    if (sale && sale.status === "completed") {
      sale.items.forEach(item => {
        setStock(prev => prev.map(s => 
          s.name === item.productName ? { ...s, quantity: s.quantity + item.quantity } : s
        ))
      })
    }
    setSales(sales.filter(s => s.id !== saleId))
    // Remove related finance transactions
    setFinanceTransactions(prev => prev.filter(t => !(t.source === "sale" && t.sourceId === saleId)))
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return

    const customer: Customer = {
      id: Date.now(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      phone2: newCustomer.phone2 || undefined,
      email: newCustomer.email || undefined
    }

    setCustomers([customer, ...customers])
    setNewCustomer({ name: "", phone: "", phone2: "", email: "" })
    setIsNewCustomerOpen(false)
    setSelectedCustomer(String(customer.id))
  }

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale)
    setSelectedCustomer(String(sale.customerId))
    setCartItems([...sale.items])
    setPaymentType(sale.paymentType)
    setPaidAmount(sale.paid.toString())
    setIsNewSaleOpen(true)
  }

  const handleUpdateSale = () => {
    if (!editingSale || !selectedCustomer || cartItems.length === 0) return

    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const paidNum = paymentType === "partial" ? (parseFloat(paidAmount) || 0) : (paymentType === "unpaid" ? 0 : total)
    const remainingNum = calculateRemaining(total, paidNum)

    const updatedSale: Sale = {
      ...editingSale,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [...cartItems],
      totalAmount: total,
      paid: paidNum,
      remaining: remainingNum,
      paymentType: paymentType as Sale["paymentType"],
    }

    setSales(sales.map(s => 
      s.id === editingSale.id ? updatedSale : s
    ))

    // Update finance if payment changed
    if (paidNum > editingSale.paid) {
      const diff = paidNum - editingSale.paid
      const newTransaction: FinanceTransaction = {
        id: Date.now(),
        description: `Satis - Ek Odeme (${updatedSale.items.map(i => i.productName).join(", ")})`,
        amount: diff,
        type: "income",
        category: "Satis Geliri",
        date: new Date().toISOString().split("T")[0],
        customer: updatedSale.customerName,
        source: "sale",
        sourceId: updatedSale.id,
      }
      setFinanceTransactions(prev => [newTransaction, ...prev])
    }

    setEditingSale(null)
    setCartItems([])
    setSelectedCustomer("")
    setPaymentType("cash")
    setPaidAmount("")
    setIsNewSaleOpen(false)
  }

  const sendWhatsApp = (sale: Sale) => {
    const cleanPhone = sale.customerPhone.replace(/\D/g, "")
    let message = `Merhaba ${sale.customerName}, siparisiniz hazir!`

    sale.items.forEach(item => {
      message += ` ${item.productName} x${item.quantity},`
    })

    message += ` Toplam: ${formatCurrency(sale.totalAmount)}.`

    if (sale.remaining > 0) {
      message += ` Alinan: ${formatCurrency(sale.paid)}, kalan bakiye: ${formatCurrency(sale.remaining)}. Lutfen kalan tutari getirin.`
    } else {
      message += ` Ucret tamamen odenmistir.`
    }

    message += ` Yesiltas Teknoloji`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/90${cleanPhone}?text=${encodedMessage}`, "_blank")
  }

  const getPaymentBadge = (type: string, remaining: number) => {
    if (remaining > 0 && type !== "unpaid") {
      return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kismi</Badge>
    }
    switch (type) {
      case "cash": return <Badge className="bg-emerald-600"><Banknote className="h-3 w-3 mr-1" />Nakit</Badge>
      case "card": return <Badge className="bg-blue-600"><CreditCard className="h-3 w-3 mr-1" />Kart</Badge>
      case "transfer": return <Badge className="bg-violet-600"><Receipt className="h-3 w-3 mr-1" />Havale</Badge>
      case "partial": return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kismi</Badge>
      default: return <Badge variant="secondary">Odenmedi</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.totalPrice, 0)
  const cartRemaining = paymentType === "partial" ? calculateRemaining(cartTotal, parseFloat(paidAmount) || 0) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Satislar</h1>
        <Dialog open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSale(null)
              setCartItems([])
              setSelectedCustomer("")
              setPaymentType("cash")
              setPaidAmount("")
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Satis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSale ? "Satis Duzenle" : "Yeni Satis"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Musteri</label>
                <div className="flex gap-2">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Musteri secin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {customers.map(c => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-white">
                          {c.name} - {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="border-slate-700 text-slate-300 hover:text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Urunler</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {stock.filter(s => s.quantity > 0).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                        <div>
                          <div className="text-sm text-white">{item.name}</div>
                          <div className="text-xs text-slate-400">Stok: {item.quantity} | {formatCurrency(item.unitPrice)}</div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(item.name, item.unitPrice)}
                          disabled={item.quantity <= 0}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Sepet</label>
                  <div className="space-y-2 min-h-[120px]">
                    {cartItems.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">Sepet bos</div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                          <div>
                            <div className="text-sm text-white">{item.productName}</div>
                            <div className="text-xs text-slate-400">{item.quantity} x {formatCurrency(item.unitPrice)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{formatCurrency(item.totalPrice)}</span>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeFromCart(item.productName)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {cartItems.length > 0 && (
                    <div className="border-t border-slate-700 pt-2 space-y-2">
                      <div className="flex justify-between text-white font-bold">
                        <span>Toplam:</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Odeme Sekli</Label>
                        <Select value={paymentType} onValueChange={setPaymentType}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="cash" className="text-white">Nakit</SelectItem>
                            <SelectItem value="card" className="text-white">Kredi Karti</SelectItem>
                            <SelectItem value="transfer" className="text-white">Havale/EFT</SelectItem>
                            <SelectItem value="partial" className="text-white">Kismi Odeme</SelectItem>
                            <SelectItem value="unpaid" className="text-white">Odenmedi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentType === "partial" && (
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs">Alinan Tutar (TL)</Label>
                          <Input 
                            type="number" 
                            value={paidAmount} 
                            onChange={(e) => setPaidAmount(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                            placeholder="Orn: 500"
                          />
                        </div>
                      )}

                      {paymentType === "partial" && paidAmount && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Toplam:</span>
                            <span className="text-white font-bold">{formatCurrency(cartTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Alinan:</span>
                            <span className="text-emerald-400 font-bold">{formatCurrency(parseFloat(paidAmount) || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Kalan:</span>
                            <span className="text-amber-400 font-bold">{formatCurrency(cartRemaining)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={editingSale ? handleUpdateSale : handleCompleteSale}
                disabled={!selectedCustomer || cartItems.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {editingSale ? "Guncelle" : "Satis Tamamla"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Satis</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalSales}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Toplam Ciro</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Bekleyen Tahsilat</CardTitle>
            <Wallet className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatCurrency(totalRemaining)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Iptal Edilen</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{cancelledSales.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Satis Gecmisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              placeholder="Musteri veya urun ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-3">
            {filteredSales.map((sale) => (
              <div key={sale.id} className={`rounded-lg border p-4 ${sale.status === "cancelled" ? "border-red-800 bg-red-900/20" : "border-slate-700 bg-slate-800/50"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{sale.customerName}</span>
                      {sale.status === "completed" ? (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700">Tamamlandi</Badge>
                      ) : (
                        <Badge className="bg-red-900/50 text-red-300 border-red-700">Iptal Edildi</Badge>
                      )}
                      {getPaymentBadge(sale.paymentType, sale.remaining)}
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-400">
                          {item.productName} - {item.quantity} adet x {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-lg font-bold text-white">
                        Toplam: {formatCurrency(sale.totalAmount)}
                      </div>
                      {sale.remaining > 0 && (
                        <div className="text-sm text-amber-400">
                          Alinan: {formatCurrency(sale.paid)} | Kalan: {formatCurrency(sale.remaining)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{sale.date}</div>
                  </div>
                  <div className="flex gap-2">
                    {sale.status === "completed" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendWhatsApp(sale)}
                          className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditSale(sale)}
                          className="border-slate-600 text-slate-300 hover:text-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleCancelSale(sale.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Yeni Musteri Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ad Soyad *</label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ahmet Yilmaz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Telefon *</label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0555 123 4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">2. Telefon (Opsiyonel)</label>
              <Input
                value={newCustomer.phone2}
                onChange={(e) => setNewCustomer({...newCustomer, phone2: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0532 987 6543"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">E-posta (Opsiyonel)</label>
              <Input
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="ornek@email.com"
              />
            </div>
            <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
              <Save className="mr-2 h-4 w-4" />
              Musteri Ekle ve Sec
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
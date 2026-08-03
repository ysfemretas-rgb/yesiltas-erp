"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ShoppingCart, Plus, Minus, Trash2, MessageCircle, X, UserPlus, Pencil, AlertTriangle } from "lucide-react"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

interface Customer {
  id: number
  name: string
  phone: string
  phone1?: string
  phone2?: string
  balance?: number
  totalDebt?: number
  debts?: any[]
  status?: string
}

interface SaleItem {
  productId: number
  name: string
  price: number
  quantity: number
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
  paymentMethod: string
  date: string
  status: "completed" | "cancelled"
}

const initialProducts: Product[] = [
  { id: 1, name: "iPhone 15 Pro Max Kılıf", price: 450, stock: 25, category: "Kılıf" },
  { id: 2, name: "Samsung S24 Ultra Ekran Koruyucu", price: 350, stock: 18, category: "Ekran Koruyucu" },
  { id: 3, name: "USB-C Şarj Kablosu (1m)", price: 120, stock: 50, category: "Kablo" },
  { id: 4, name: "20W Hızlı Şarj Adaptörü", price: 280, stock: 30, category: "Şarj" },
  { id: 5, name: "AirPods Pro 2. Nesil", price: 8500, stock: 8, category: "Kulaklık" },
  { id: 6, name: "Bluetooth Hoparlör JBL", price: 1200, stock: 12, category: "Hoparlör" },
  { id: 7, name: "Powerbank 20000mAh", price: 650, stock: 20, category: "Powerbank" },
  { id: 8, name: "Araç Telefon Tutucu", price: 180, stock: 35, category: "Aksesuar" },
]

const paymentMethods = [
  { value: "cash", label: "💵 Nakit" },
  { value: "card", label: "💳 Kredi Kartı" },
  { value: "transfer", label: "🏦 Havale/EFT" },
  { value: "partial", label: "💰 Kısmi Ödeme" },
  { value: "unpaid", label: "⏳ Ödenmedi" },
]

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paidAmount, setPaidAmount] = useState("")
  const [showNewSale, setShowNewSale] = useState(false)
  const [showEditSale, setShowEditSale] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editCart, setEditCart] = useState<SaleItem[]>([])
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash")
  const [editPaidAmount, setEditPaidAmount] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedProducts = localStorage.getItem("yt_products")
      const savedCustomers = localStorage.getItem("yt_customers")
      const savedSales = localStorage.getItem("yt_sales")

      if (savedProducts) {
        const parsed = JSON.parse(savedProducts)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed)
        } else {
          localStorage.setItem("yt_products", JSON.stringify(initialProducts))
        }
      } else {
        localStorage.setItem("yt_products", JSON.stringify(initialProducts))
      }

      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers)
        if (Array.isArray(parsed)) {
          setCustomers(parsed)
        }
      }

      if (savedSales) {
        const parsed = JSON.parse(savedSales)
        if (Array.isArray(parsed)) {
          setSales(parsed)
        }
      }
    } catch (e) {
      console.error("Load error:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_products", JSON.stringify(products))
  }, [products, isLoaded])

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_customers", JSON.stringify(customers))
  }, [customers, isLoaded])

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    localStorage.setItem("yt_sales", JSON.stringify(sales))
  }, [sales, isLoaded])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch || customerSearch.length < 1) return []
    const search = customerSearch.toLowerCase()
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(search)) ||
      (c.phone && c.phone.includes(search)) ||
      (c.phone1 && c.phone1.includes(search))
    )
  }, [customers, customerSearch])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const search = searchTerm.toLowerCase()
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
    )
  }, [products, searchTerm])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
  }, [cart])

  const editCartTotal = useMemo(() => {
    return editCart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
  }, [editCart])

  const paid = paymentMethod === "partial" ? Number(paidAmount) || 0 : cartTotal
  const remaining = cartTotal - paid

  const editPaid = editPaymentMethod === "partial" ? Number(editPaidAmount) || 0 : editCartTotal
  const editRemaining = editCartTotal - editPaid

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product || quantity < 1) return
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity }])
    }
  }

  const addToEditCart = (product: Product, quantity: number = 1) => {
    if (!product || quantity < 1) return
    const existing = editCart.find(item => item.productId === product.id)
    if (existing) {
      setEditCart(editCart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setEditCart([...editCart, { productId: product.id, name: product.name, price: product.price, quantity }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const removeFromEditCart = (productId: number) => {
    setEditCart(editCart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    const product = products.find(p => p.id === productId)
    if (product && quantity > product.stock) return
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
  }

  const updateEditQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromEditCart(productId)
      return
    }
    const product = products.find(p => p.id === productId)
    if (product && quantity > product.stock) return
    setEditCart(editCart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
  }

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    const newCustomer: Customer = {
      id: Date.now(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      phone1: newCustomerPhone.trim(),
      phone2: newCustomerPhone2.trim() || undefined,
      balance: 0,
      totalDebt: 0,
      debts: [],
      status: "active",
    }
    const updated = [...customers, newCustomer]
    setCustomers(updated)
    setSelectedCustomer(String(newCustomer.id))
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerPhone2("")
    setShowNewCustomer(false)
  }

  // Update customer debt in localStorage
  const updateCustomerDebt = (customerId: number, amount: number, operation: "add" | "subtract") => {
    const savedCustomers = localStorage.getItem("yt_customers")
    if (!savedCustomers) return

    try {
      const allCustomers = JSON.parse(savedCustomers)
      if (!Array.isArray(allCustomers)) return

      const updated = allCustomers.map((c: any) => {
        if (c.id === customerId) {
          const currentDebt = c.totalDebt || c.balance || 0
          const newDebt = operation === "add" 
            ? currentDebt + amount 
            : Math.max(0, currentDebt - amount)
          return { ...c, totalDebt: newDebt, balance: newDebt }
        }
        return c
      })

      localStorage.setItem("yt_customers", JSON.stringify(updated))
      setCustomers(updated)
    } catch (e) {
      console.error("Debt update error:", e)
    }
  }

  const handleCompleteSale = () => {
    if (!selectedCustomer || cart.length === 0) return
    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    // Telefon numarası kontrolü
    const phone = customer.phone || customer.phone1 || ""
    if (!phone) {
      alert("⚠️ Müşterinin telefon numarası yok! Lütfen müşteri bilgilerini güncelleyin.")
      return
    }

    const saleId = Date.now()
    const sale: Sale = {
      id: saleId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: phone,
      items: [...cart],
      totalAmount: cartTotal,
      paid: paid,
      remaining: remaining > 0 ? remaining : 0,
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
      status: "completed",
    }

    // Update customer debt
    if (remaining > 0) {
      updateCustomerDebt(customer.id, remaining, "add")
    }

    // Update product stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id)
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
      }
      return p
    })
    setProducts(updatedProducts)

    // Save sale
    const updatedSales = [sale, ...sales]
    setSales(updatedSales)

    // Add to finance
    try {
      const financeRecord = {
        id: Date.now() + 1,
        type: "income" as const,
        category: "Satış",
        amount: paid,
        description: `🛒 Satış: ${customer.name} - ${cart.map(i => i.name).join(", ")}`,
        date: new Date().toISOString().split("T")[0],
        source: "sales" as const,
        sourceId: saleId,
      }
      const savedFinance = localStorage.getItem("yt_finance")
      const financeData = savedFinance ? JSON.parse(savedFinance) : []
      if (Array.isArray(financeData)) {
        financeData.push(financeRecord)
        localStorage.setItem("yt_finance", JSON.stringify(financeData))
      } else {
        localStorage.setItem("yt_finance", JSON.stringify([financeRecord]))
      }
    } catch (e) {
      console.error("Finance save error:", e)
    }

    // Reset
    setCart([])
    setSelectedCustomer("")
    setPaymentMethod("cash")
    setPaidAmount("")
    setShowNewSale(false)
  }

  const handleDeleteSale = (saleId: number) => {
    const sale = sales.find(s => s.id === saleId)
    if (!sale) return

    if (!confirm("🗑️ Bu satış kaydını silmek istediğinize emin misiniz?\n\nBu işlem stokları geri ekleyecek ve müşteri borcunu güncelleyecektir.")) return

    // Return stock
    const updatedProducts = products.map(p => {
      const saleItem = sale.items.find(item => item.productId === p.id)
      if (saleItem) {
        return { ...p, stock: p.stock + saleItem.quantity }
      }
      return p
    })
    setProducts(updatedProducts)

    // Subtract customer debt if there was remaining
    if (sale.remaining > 0) {
      updateCustomerDebt(sale.customerId, sale.remaining, "subtract")
    }

    // Remove from finance
    try {
      const savedFinance = localStorage.getItem("yt_finance")
      if (savedFinance) {
        const financeData = JSON.parse(savedFinance)
        if (Array.isArray(financeData)) {
          const filtered = financeData.filter((f: any) => !(f.source === "sales" && f.sourceId === saleId))
          localStorage.setItem("yt_finance", JSON.stringify(filtered))
        }
      }
    } catch (e) {
      console.error("Finance delete error:", e)
    }

    // Remove sale
    setSales(sales.filter(s => s.id !== saleId))
  }

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale)
    setEditCart([...sale.items])
    setEditPaymentMethod(sale.paymentMethod)
    setEditPaidAmount(sale.paid.toString())
    setShowEditSale(true)
  }

  const handleUpdateSale = () => {
    if (!editingSale || editCart.length === 0) return

    const oldSale = editingSale
    const oldRemaining = oldSale.remaining
    const newRemaining = editRemaining > 0 ? editRemaining : 0

    // Calculate stock differences
    const updatedProducts = products.map(p => {
      const oldItem = oldSale.items.find(item => item.productId === p.id)
      const newItem = editCart.find(item => item.productId === p.id)
      const oldQty = oldItem ? oldItem.quantity : 0
      const newQty = newItem ? newItem.quantity : 0
      const diff = oldQty - newQty
      return { ...p, stock: p.stock + diff }
    })
    setProducts(updatedProducts)

    // Update customer debt difference
    const debtDiff = newRemaining - oldRemaining
    if (debtDiff !== 0) {
      updateCustomerDebt(oldSale.customerId, Math.abs(debtDiff), debtDiff > 0 ? "add" : "subtract")
    }

    const updatedSale: Sale = {
      ...editingSale,
      items: [...editCart],
      totalAmount: editCartTotal,
      paid: editPaid,
      remaining: newRemaining,
      paymentMethod: editPaymentMethod,
    }

    setSales(sales.map(s => s.id === editingSale.id ? updatedSale : s))
    setShowEditSale(false)
    setEditingSale(null)
    setEditCart([])
    setEditPaymentMethod("cash")
    setEditPaidAmount("")
  }

  const sendWhatsApp = (sale: Sale) => {
    try {
      if (!sale) {
        alert("⚠️ Satış bilgisi bulunamadı!")
        return
      }

      let phone = ""
      let customerName = sale.customerName || "Müşteri"

      if (sale.customerPhone) {
        phone = sale.customerPhone
      }

      if (!phone && sale.customerId && customers.length > 0) {
        const customer = customers.find(c => c.id === sale.customerId)
        if (customer) {
          phone = customer.phone || customer.phone1 || ""
          customerName = customer.name
        }
      }

      if (!phone) {
        alert("📵 Müşteri telefon numarası bulunamadı! Bu eski bir kayıt olabilir.")
        return
      }

      let cleanPhone = String(phone).replace(/\D/g, "")
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1)
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        alert("❌ Geçersiz telefon numarası: " + phone)
        return
      }

      const items = (sale.items || []).map(i => `📦 ${i.name} (${i.quantity}x ₺${i.price.toLocaleString("tr-TR")})`).join("%0A")
      let message = `👋 Merhaba *${customerName}*,%0A%0A`
      message += `✅ *Yeşiltaş Teknoloji* satış işleminiz hakkında bilgi vermek istiyoruz.%0A%0A`
      message += `🛒 *Satış Detayları:*%0A${items || "Ürün bilgisi yok"}%0A%0A`
      message += `💰 *Toplam Tutar:* ₺${(sale.totalAmount || 0).toLocaleString("tr-TR")}%0A`
      if (sale.remaining > 0) {
        message += `💵 *Alınan:* ₺${(sale.paid || 0).toLocaleString("tr-TR")}%0A`
        message += `⏳ *Kalan Borç:* ₺${(sale.remaining || 0).toLocaleString("tr-TR")}%0A`
        message += `💳 *Ödeme Şekli:* ${paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}%0A`
      } else {
        message += `✅ *Ödeme:* Tamamlandı%0A`
        message += `💳 *Ödeme Şekli:* ${paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}%0A`
      }
      message += `%0A📅 *Tarih:* ${sale.date}%0A`
      message += `%0A🙏 Teşekkür ederiz, iyi günler dileriz!%0A🏪 *Yeşiltaş Teknoloji*`

      const url = `https://wa.me/90${cleanPhone}?text=${message}`
      window.open(url, "_blank")
    } catch (err) {
      console.error("WhatsApp error:", err)
      alert("❌ WhatsApp gönderilirken hata oluştu!")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">⏳ Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🛒 Satışlar</h1>
        <Button onClick={() => setShowNewSale(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <ShoppingCart className="w-4 h-4 mr-2" />Yeni Satış
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Toplam Satış</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{sales.length}</div></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Bugün</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-400">{sales.filter(s => s.date === new Date().toISOString().split("T")[0]).length}</div></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Toplam Gelir</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-400">{formatCurrency(sales.reduce((sum, s) => sum + (s.paid || 0), 0))}</div></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Bekleyen Tahsilat</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-400">{formatCurrency(sales.reduce((sum, s) => sum + (s.remaining || 0), 0))}</div></CardContent>
        </Card>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">🛒 Yeni Satış</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">👤 Müşteri</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Müşteri ara (isim veya telefon)..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                />
              </div>

              {customerSearch.length > 0 && (
                <div className="bg-slate-800 border border-slate-600 rounded-lg max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">❌ Müşteri bulunamadı</div>
                  ) : (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCustomer(String(c.id)); setCustomerSearch(""); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${selectedCustomer === String(c.id) ? "bg-emerald-600/20 text-emerald-400" : "text-white"}`}
                      >
                        {c.name} - 📞 {c.phone || c.phone1}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Badge className="bg-emerald-600/20 text-emerald-400">
                    ✅ {customers.find(c => c.id === Number(selectedCustomer))?.name || "Müşteri"}
                  </Badge>
                  <button onClick={() => setSelectedCustomer("")} className="text-slate-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <UserPlus className="w-3 h-3 mr-1" />{showNewCustomer ? "❌ İptal" : "➕ Yeni Müşteri"}
              </Button>

              {showNewCustomer && (
                <div className="space-y-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <Input placeholder="Ad Soyad *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Input placeholder="Telefon 1 *" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Input placeholder="Telefon 2" value={newCustomerPhone2} onChange={(e) => setNewCustomerPhone2(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Button size="sm" onClick={handleAddNewCustomer} className="bg-emerald-600 hover:bg-emerald-700">✅ Ekle</Button>
                </div>
              )}
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-slate-300">🔍 Ürün Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Ürün adı veya kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {filteredProducts.map(product => (
                <div key={product.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-sm font-medium text-white">{product.name}</div>
                  <div className="text-xs text-slate-400">{formatCurrency(product.price)} | 📦 Stok: {product.stock}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={product.stock}
                      defaultValue={1}
                      className="w-16 h-8 bg-slate-900 border-slate-600 text-white text-sm"
                      id={`qty-${product.id}`}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById(`qty-${product.id}`) as HTMLInputElement
                        addToCart(product, Number(input?.value) || 1)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300">🛒 Sepet</Label>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                      <div>
                        <div className="text-sm text-white">{item.name}</div>
                        <div className="text-xs text-slate-400">{formatCurrency(item.price)} x {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-emerald-400">{formatCurrency(item.price * item.quantity)}</div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => removeFromCart(item.productId)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment */}
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>💰 Toplam:</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Ödeme şekli" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {paymentMethods.map(m => (
                        <SelectItem key={m.value} value={m.value} className="text-white hover:bg-slate-700">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentMethod === "partial" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">💵 Alınan Tutar</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        placeholder="Alınan tutar..."
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">💵 Alınan: {formatCurrency(paid)}</span>
                        <span className="text-amber-400">⏳ Kalan: {formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  )}
                  {remaining > 0 && paymentMethod !== "partial" && (
                    <div className="text-sm text-amber-400">⏳ Kalan: {formatCurrency(remaining)}</div>
                  )}
                  <Button
                    onClick={handleCompleteSale}
                    disabled={!selectedCustomer || cart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    ✅ Satışı Tamamla
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={showEditSale} onOpenChange={setShowEditSale}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">✏️ Satış Düzenle #{editingSale?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              👤 Müşteri: <span className="text-white font-medium">{editingSale?.customerName}</span>
            </div>

            {/* Current Items */}
            <div className="space-y-2">
              <Label className="text-slate-300">📦 Mevcut Ürünler</Label>
              {editCart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <div>
                    <div className="text-sm text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">{formatCurrency(item.price)} x {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-emerald-400">{formatCurrency(item.price * item.quantity)}</div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateEditQuantity(item.productId, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateEditQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => removeFromEditCart(item.productId)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Products */}
            <div className="space-y-2">
              <Label className="text-slate-300">➕ Ürün Ekle</Label>
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div key={product.id} className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="text-sm text-white">{product.name}</div>
                    <div className="text-xs text-slate-400">{formatCurrency(product.price)} | 📦 {product.stock}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        min={1}
                        max={product.stock}
                        defaultValue={1}
                        className="w-14 h-7 bg-slate-900 border-slate-600 text-white text-xs"
                        id={`edit-qty-${product.id}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`edit-qty-${product.id}`) as HTMLInputElement
                          addToEditCart(product, Number(input?.value) || 1)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <div className="flex justify-between text-lg font-bold text-white">
                <span>💰 Toplam:</span>
                <span>{formatCurrency(editCartTotal)}</span>
              </div>
              <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Ödeme şekli" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {paymentMethods.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-white">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editPaymentMethod === "partial" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">💵 Alınan Tutar</Label>
                  <Input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">💵 Alınan: {formatCurrency(editPaid)}</span>
                    <span className="text-amber-400">⏳ Kalan: {formatCurrency(editRemaining)}</span>
                  </div>
                </div>
              )}
              {editRemaining > 0 && editPaymentMethod !== "partial" && (
                <div className="text-sm text-amber-400">⏳ Kalan: {formatCurrency(editRemaining)}</div>
              )}
              <Button onClick={handleUpdateSale} className="w-full bg-blue-600 hover:bg-blue-700">
                💾 Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales List */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>📋 Satış Listesi</span>
            <span className="text-sm text-slate-400">{sales.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-slate-500 text-center py-8">📝 Henüz satış bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {sales.map(sale => (
                <div key={sale.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{sale.customerName}</div>
                      <div className="text-xs text-slate-400">📅 {sale.date} | 📦 {(sale.items || []).length} ürün</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</div>
                      <Badge className={sale.remaining > 0 ? "bg-amber-600/20 text-amber-400" : "bg-emerald-600/20 text-emerald-400"}>
                        {sale.remaining > 0 ? `⏳ Kısmi - Kalan: ${formatCurrency(sale.remaining)}` : "✅ Tamamlandı"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10" 
                      onClick={() => sendWhatsApp(sale)}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />📱 WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" 
                      onClick={() => openEditSale(sale)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />✏️ Düzenle
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                      onClick={() => handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />🗑️ Sil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
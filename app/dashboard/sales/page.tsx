"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ShoppingCart, Plus, Minus, Trash2, MessageCircle, X, UserPlus } from "lucide-react"

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
  phone2?: string
  balance?: number
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
  { value: "cash", label: "Nakit" },
  { value: "card", label: "Kredi Kartı" },
  { value: "transfer", label: "Havale/EFT" },
  { value: "partial", label: "Kısmi Ödeme" },
  { value: "unpaid", label: "Ödenmedi" },
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
  const [searchTerm, setSearchTerm] = useState("")
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedProducts = localStorage.getItem("yt_products")
        const savedCustomers = localStorage.getItem("yt_customers")
        const savedSales = localStorage.getItem("yt_sales")

        if (savedProducts) {
          const parsed = JSON.parse(savedProducts)
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed)
        } else {
          localStorage.setItem("yt_products", JSON.stringify(initialProducts))
        }

        if (savedCustomers) {
          const parsed = JSON.parse(savedCustomers)
          if (Array.isArray(parsed)) setCustomers(parsed)
        }

        if (savedSales) {
          const parsed = JSON.parse(savedSales)
          if (Array.isArray(parsed)) setSales(parsed)
        }
      } catch (e) {
        console.error("Load error:", e)
      }
      setIsLoaded(true)
    }
  }, [])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch || !Array.isArray(customers)) return customers || []
    return customers.filter(c =>
      c && c.name && c.phone && (
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
      )
    )
  }, [customers, customerSearch])

  const filteredProducts = useMemo(() => {
    if (!searchTerm || !Array.isArray(products)) return products || []
    return products.filter(p =>
      p && p.name && p.category && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [products, searchTerm])

  const cartTotal = useMemo(() => {
    if (!Array.isArray(cart)) return 0
    return cart.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 0), 0)
  }, [cart])

  const paid = paymentMethod === "partial" ? Number(paidAmount) || 0 : cartTotal
  const remaining = cartTotal - paid

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

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId))
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

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    const newCustomer: Customer = {
      id: Date.now(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      phone2: newCustomerPhone2.trim() || undefined,
      balance: 0,
    }
    const updated = [...customers, newCustomer]
    setCustomers(updated)
    localStorage.setItem("yt_customers", JSON.stringify(updated))
    setSelectedCustomer(String(newCustomer.id))
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerPhone2("")
    setShowNewCustomer(false)
  }

  const handleCompleteSale = () => {
    if (!selectedCustomer || cart.length === 0) return
    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    const saleId = Date.now()
    const sale: Sale = {
      id: saleId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [...cart],
      totalAmount: cartTotal,
      paid: paid,
      remaining: remaining > 0 ? remaining : 0,
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
      status: "completed",
    }

    // Update customer balance
    const updatedCustomers = customers.map(c => {
      if (c.id === customer.id) {
        return { ...c, balance: (c.balance || 0) + (remaining > 0 ? remaining : 0) }
      }
      return c
    })
    setCustomers(updatedCustomers)
    localStorage.setItem("yt_customers", JSON.stringify(updatedCustomers))

    // Update product stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id)
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
      }
      return p
    })
    setProducts(updatedProducts)
    localStorage.setItem("yt_products", JSON.stringify(updatedProducts))

    // Save sale
    const updatedSales = [sale, ...sales]
    setSales(updatedSales)
    localStorage.setItem("yt_sales", JSON.stringify(updatedSales))

    // Add to finance
    try {
      const financeRecord = {
        id: Date.now() + 1,
        type: "income" as const,
        category: "Satış",
        amount: paid,
        description: `Satış: ${customer.name} - ${cart.map(i => i.name).join(", ")}`,
        date: new Date().toISOString().split("T")[0],
        source: "sales" as const,
        sourceId: saleId,
      }
      const savedFinance = localStorage.getItem("yt_finance")
      const financeData = savedFinance ? JSON.parse(savedFinance) : []
      if (!Array.isArray(financeData)) {
        localStorage.setItem("yt_finance", JSON.stringify([financeRecord]))
      } else {
        financeData.push(financeRecord)
        localStorage.setItem("yt_finance", JSON.stringify(financeData))
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

  const sendWhatsApp = (sale: Sale) => {
    if (!sale) return
    const customer = customers.find(c => c.id === sale.customerId)
    if (!customer || !customer.phone) return
    const phone = String(customer.phone).replace(/[^0-9]/g, "")
    if (!phone) return

    const items = sale.items.map(i => `${i.name} (${i.quantity}x)`).join("%0A")
    let message = `Merhaba ${customer.name},%0A%0A`
    message += `Yeşiltaş Teknoloji'den satış işleminiz hakkında bilgi vermek istiyoruz.%0A%0A`
    message += `Satış Detayları:%0A${items}%0A%0A`
    message += `Toplam Tutar: ₺${(sale.totalAmount || 0).toLocaleString("tr-TR")}%0A`
    if (sale.remaining > 0) {
      message += `Alınan: ₺${(sale.paid || 0).toLocaleString("tr-TR")}%0A`
      message += `Kalan Borç: ₺${(sale.remaining || 0).toLocaleString("tr-TR")}%0A`
    } else {
      message += `Ödeme: Tamamlandı%0A`
    }
    message += `%0ATeşekkür ederiz, iyi günler dileriz!%0AYeşiltaş Teknoloji`
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Satışlar</h1>
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
          <DialogHeader><DialogTitle className="text-xl">Yeni Satış</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Müşteri</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Müşteri ara (isim veya telefon)..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                />
              </div>
              {customerSearch && (
                <div className="bg-slate-800 border border-slate-600 rounded-lg max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">Müşteri bulunamadı</div>
                  ) : (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCustomer(String(c.id)); setCustomerSearch(""); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${selectedCustomer === String(c.id) ? "bg-emerald-600/20 text-emerald-400" : "text-white"}`}
                      >
                        {c.name} - {c.phone}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedCustomer && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Badge className="bg-emerald-600/20 text-emerald-400">
                    {customers.find(c => c.id === Number(selectedCustomer))?.name || "Müşteri"}
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
                <UserPlus className="w-3 h-3 mr-1" />{showNewCustomer ? "İptal" : "Yeni Müşteri"}
              </Button>
              {showNewCustomer && (
                <div className="space-y-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <Input placeholder="Ad Soyad *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Input placeholder="Telefon 1 *" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Input placeholder="Telefon 2" value={newCustomerPhone2} onChange={(e) => setNewCustomerPhone2(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                  <Button size="sm" onClick={handleAddNewCustomer} className="bg-emerald-600 hover:bg-emerald-700">Ekle</Button>
                </div>
              )}
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-slate-300">Ürün Ara</Label>
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
                  <div className="text-xs text-slate-400">{formatCurrency(product.price)} | Stok: {product.stock}</div>
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
                <Label className="text-slate-300">Sepet</Label>
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
                    <span>Toplam:</span>
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
                      <Label className="text-slate-300">Alınan Tutar</Label>
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
                        <span className="text-slate-400">Alınan: {formatCurrency(paid)}</span>
                        <span className="text-amber-400">Kalan: {formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  )}
                  {remaining > 0 && paymentMethod !== "partial" && (
                    <div className="text-sm text-amber-400">Kalan: {formatCurrency(remaining)}</div>
                  )}
                  <Button
                    onClick={handleCompleteSale}
                    disabled={!selectedCustomer || cart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Satışı Tamamla
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales List */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Satış Listesi</span>
            <span className="text-sm text-slate-400">{sales.length} kayıt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Henüz satış bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {sales.map(sale => (
                <div key={sale.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{sale.customerName}</div>
                      <div className="text-xs text-slate-400">{sale.date} | {sale.items?.length || 0} ürün</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</div>
                      <Badge variant={sale.remaining > 0 ? "default" : "secondary"} className={sale.remaining > 0 ? "bg-amber-600/20 text-amber-400" : "bg-emerald-600/20 text-emerald-400"}>
                        {sale.remaining > 0 ? `Kısmi - Kalan: ${formatCurrency(sale.remaining)}` : "Tamamlandı"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={() => sendWhatsApp(sale)}>
                      <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
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
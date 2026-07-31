"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Package
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
  items: SaleItem[]
  totalAmount: number
  date: string
  status: "completed" | "cancelled"
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
    items: [
      { id: 1, productName: "iPhone 14 Pro Kilif", quantity: 1, unitPrice: 250, totalPrice: 250 },
      { id: 2, productName: "Ekran Koruyucu", quantity: 2, unitPrice: 150, totalPrice: 300 }
    ],
    totalAmount: 550,
    date: "2024-08-01",
    status: "completed"
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Mehmet Kaya",
    items: [
      { id: 3, productName: "Samsung S23 Kilif", quantity: 1, unitPrice: 200, totalPrice: 200 }
    ],
    totalAmount: 200,
    date: "2024-08-01",
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

export default function SalesPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [stock, setStock] = useState(initialStock)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    phone2: "",
    email: ""
  })

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.totalAmount, 0)
  const totalSales = sales.filter(s => s.status === "completed").length
  const cancelledSales = sales.filter(s => s.status === "cancelled")

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

  const handleCompleteSale = () => {
    if (!selectedCustomer || cartItems.length === 0) return
    
    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
    
    const newSale: Sale = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      items: [...cartItems],
      totalAmount: total,
      date: new Date().toISOString().split("T")[0],
      status: "completed"
    }

    setSales([newSale, ...sales])
    setCartItems([])
    setSelectedCustomer("")
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
    setIsNewSaleOpen(true)
  }

  const handleUpdateSale = () => {
    if (!editingSale || !selectedCustomer || cartItems.length === 0) return
    
    const customer = customers.find(c => c.id === Number(selectedCustomer))
    if (!customer) return

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
    
    setSales(sales.map(s => 
      s.id === editingSale.id 
        ? {
            ...s,
            customerId: customer.id,
            customerName: customer.name,
            items: [...cartItems],
            totalAmount: total
          }
        : s
    ))
    
    setEditingSale(null)
    setCartItems([])
    setSelectedCustomer("")
    setIsNewSaleOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Satis (POS)</h1>
        <Dialog open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSale(null)
              setCartItems([])
              setSelectedCustomer("")
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
                          <div className="text-xs text-slate-400">Stok: {item.quantity} | ₺{item.unitPrice}</div>
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
                            <div className="text-xs text-slate-400">{item.quantity} x ₺{item.unitPrice}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">₺{item.totalPrice}</span>
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
                    <div className="border-t border-slate-700 pt-2">
                      <div className="flex justify-between text-white font-bold">
                        <span>Toplam:</span>
                        <span>₺{cartItems.reduce((sum, i) => sum + i.totalPrice, 0)}</span>
                      </div>
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

      <div className="grid gap-4 md:grid-cols-3">
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
            <div className="text-2xl font-bold text-green-500">₺{totalRevenue.toLocaleString("tr-TR")}</div>
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
                    </div>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-400">
                          {item.productName} - {item.quantity} adet x ₺{item.unitPrice} = ₺{item.totalPrice}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-lg font-bold text-white">
                      Toplam: ₺{sale.totalAmount}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{sale.date}</div>
                  </div>
                  <div className="flex gap-2">
                    {sale.status === "completed" && (
                      <>
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
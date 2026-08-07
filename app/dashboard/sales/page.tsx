"use client"

import { Toast, useToast } from "@/components/toast"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ShoppingCart, Plus, Minus, Trash2, MessageCircle, X, UserPlus, Pencil, AlertTriangle, Package } from "lucide-react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Sale, SaleItem, fetchSales, createSale, updateSale, deleteSale } from "@/lib/sales"
import { fetchCustomers, createCustomer, addDebt, deleteDebtsBySource } from "@/lib/customers"
import { validatePhone } from "@/lib/validation"
import { createTransaction, deleteTransactionsBySource } from "@/lib/finance"
import { Product, fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products"

interface Customer {
  id: string
  name: string
  phone: string
  phone1?: string
  phone2?: string
  balance?: number
  totalDebt?: number
  debts?: any[]
  status?: string
}

const paymentMethods = [
  { value: "cash", label: "💵 Nakit" },
  { value: "card", label: "💳 Kredi Kartı" },
  { value: "transfer", label: "🏦 Havale/EFT" },
  { value: "partial", label: "💰 Kısmi Ödeme" },
  { value: "unpaid", label: "⏳ Ödenmedi" },
  { value: "gift", label: "🎁 Eşantiyon (Bedelsiz)" },
]

export default function SalesPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Satış")
  const isManager = useIsManager()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")

  const [customerSearch, setCustomerSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [saleDiscount, setSaleDiscount] = useState("")
  const [editSaleDiscount, setEditSaleDiscount] = useState("")
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(20)
  const [paidAmount, setPaidAmount] = useState("")
  const [showNewSale, setShowNewSale] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({})
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [showEditSale, setShowEditSale] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editCart, setEditCart] = useState<SaleItem[]>([])
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash")
  const [editPaidAmount, setEditPaidAmount] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerPhone2, setNewCustomerPhone2] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  const [showMoreCustomerFields, setShowMoreCustomerFields] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Ürünler, müşteriler ve satışlar artık Supabase'den geliyor.
  useEffect(() => {
    try {
      const companyRaw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
      if (companyRaw) {
        const parsed = JSON.parse(companyRaw)
        if (typeof parsed?.maxDiscountPercent === "number") setMaxDiscountPercent(parsed.maxDiscountPercent)
      }
    } catch (e) {
      console.error("Şirket ayarları okunamadı:", e)
    }

    fetchProducts()
      .then((data) => setProducts(data))
      .catch((e) => console.error("Ürünler yüklenemedi:", e))

    fetchCustomers()
      .then((data) => setCustomers(data.map(c => ({ id: c.id, name: c.name, phone: c.phone, phone1: c.phone1, phone2: c.phone2, balance: 0, totalDebt: c.totalDebt, debts: c.debts }))))
      .catch((e) => console.error("Müşteriler yüklenemedi:", e))

    fetchSales()
      .then((data) => setSales(data))
      .catch((e) => {
        console.error("Satışlar yüklenemedi:", e)
        showToast("Satışlar yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => setIsLoaded(true))
  }, [])


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

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
  }, [cart])
  const cartTotal = Math.max(0, cartSubtotal - (Number(saleDiscount) || 0))
  const maxCartDiscount = cartSubtotal * maxDiscountPercent / 100

  const editCartSubtotal = useMemo(() => {
    return editCart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
  }, [editCart])
  const editCartTotal = Math.max(0, editCartSubtotal - (Number(editSaleDiscount) || 0))
  const maxEditCartDiscount = editCartSubtotal * maxDiscountPercent / 100

  const isGiftSale = paymentMethod === "gift"
  const paid = isGiftSale ? 0 : (paymentMethod === "partial" ? Number(paidAmount) || 0 : (paymentMethod === "unpaid" ? 0 : cartTotal))
  const remaining = isGiftSale ? 0 : cartTotal - paid

  const editPaid = editPaymentMethod === "partial" ? Number(editPaidAmount) || 0 : (editPaymentMethod === "unpaid" ? 0 : editCartTotal)
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
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, purchasePrice: product.purchasePrice, quantity }])
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
      setEditCart([...editCart, { productId: product.id, name: product.name, price: product.price, purchasePrice: product.purchasePrice, quantity }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const removeFromEditCart = (productId: string) => {
    setEditCart(editCart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
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

  const updateEditQuantity = (productId: string, quantity: number) => {
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

  const handleAddProduct = async () => {
    if (!newProduct.name?.trim()) {
      showToast("Lütfen ürün adı girin!", "error")
      return
    }
    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, {
          name: newProduct.name.trim(),
          category: newProduct.category || "",
          price: Number(newProduct.price) || 0,
          purchasePrice: Number(newProduct.purchasePrice) || 0,
          stock: Number(newProduct.stock) || 0,
        })
        setProducts(products.map(p => p.id === updated.id ? updated : p))
        setEditingProductId(null)
        showToast("Ürün güncellendi.", "success")
      } else {
        const product = await createProduct({
          name: newProduct.name.trim(),
          category: newProduct.category || "",
          price: Number(newProduct.price) || 0,
          purchasePrice: Number(newProduct.purchasePrice) || 0,
          stock: Number(newProduct.stock) || 0,
        })
        setProducts([product, ...products])
        showToast("Ürün eklendi.", "success")
      }
      setNewProduct({})
    } catch (e) {
      console.error(e)
      showToast("Ürün kaydedilirken bir sorun oluştu.", "error")
    }
  }

  const handleEditProductClick = (p: Product) => {
    setEditingProductId(p.id)
    setNewProduct({ name: p.name, category: p.category, price: p.price, purchasePrice: p.purchasePrice, stock: p.stock })
  }

  const handleCancelEditProduct = () => {
    setEditingProductId(null)
    setNewProduct({})
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bu ürünü kataloğdan silmek istediğinize emin misiniz?")) return
    try {
      await deleteProduct(id)
      setProducts(products.filter((p) => p.id !== id))
      showToast("Ürün silindi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Ürün silinirken bir sorun oluştu.", "error")
    }
  }

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    if (!validatePhone(newCustomerPhone)) {
      showToast("Telefon numarası geçerli görünmüyor (05XX XXX XX XX formatında olmalı).", "error")
      return
    }
    try {
      const created = await createCustomer({
        name: newCustomerName.trim(),
        firstName: newCustomerName.trim().split(" ")[0] || newCustomerName.trim(),
        lastName: newCustomerName.trim().split(" ").slice(1).join(" "),
        phone: newCustomerPhone.trim(),
        phone2: newCustomerPhone2.trim() || "",
        email: newCustomerEmail.trim() || "",
        address: newCustomerAddress.trim() || "",
        status: "active",
        lastVisit: new Date().toISOString().split("T")[0],
      })
      const newCustomer: Customer = {
        id: created.id,
        name: created.name,
        phone: created.phone,
        phone1: created.phone,
        phone2: created.phone2 || undefined,
        balance: 0,
        totalDebt: 0,
        debts: [],
        status: "active",
      }
      setCustomers([...customers, newCustomer])
      setSelectedCustomer(String(newCustomer.id))
      setNewCustomerName("")
      setNewCustomerPhone("")
      setNewCustomerPhone2("")
      setNewCustomerEmail("")
      setNewCustomerAddress("")
      setShowMoreCustomerFields(false)
      setShowNewCustomer(false)
      showToast("Müşteri eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Müşteri eklenirken bir sorun oluştu.", "error")
    }
  }

  // Not: Borç artık Müşteriler sayfasındaki gerçek borç kayıtları (debts
  // tablosu) üzerinden hesaplanıyor. Satış tamamlanırken kalan bakiye varsa
  // gerçek bir borç kaydı oluşturuyoruz. Satış silinirken/düzenlenirken borcu
  // otomatik geri almak, hangi borcun hangi satıştan geldiğini izlemeyi
  // gerektirir (henüz yok) — bu durumlarda sadece ekrandaki görünümü optimistik
  // olarak güncelliyoruz; gerekirse borcu Müşteriler sayfasından elle düzelt.
  const updateCustomerDebt = async (customerId: string, amount: number, operation: "add" | "subtract", description?: string, saleId?: string) => {
    if (operation === "add" && amount > 0) {
      try {
        await addDebt(customerId, { amount, description: description || "Satış bakiyesi", sourceType: "sale", sourceId: saleId })
      } catch (e) {
        console.error("Borç kaydı oluşturulamadı:", e)
      }
    }
    setCustomers(customers.map((c: any) => {
      if (c.id !== customerId) return c
      const currentDebt = c.totalDebt || c.balance || 0
      const newDebt = operation === "add" ? currentDebt + amount : Math.max(0, currentDebt - amount)
      return { ...c, totalDebt: newDebt, balance: newDebt }
    }))
  }

  const handleCompleteSale = async () => {
    if (!selectedCustomer || cart.length === 0) return
    const customer = customers.find(c => c.id === selectedCustomer)
    if (!customer) return

    if (Number(saleDiscount) > maxCartDiscount) {
      showToast(`İskonto izin verilen maksimum %${maxDiscountPercent}'i (${formatCurrency(maxCartDiscount)}) aşıyor.`, "error")
      return
    }

    // Telefon numarası kontrolü
    const phone = customer.phone || customer.phone1 || ""
    if (!phone) {
      showToast("Müşterinin telefon numarası yok! Lütfen müşteri bilgilerini güncelleyin.", "error")
      return
    }

    try {
      const sale = await createSale({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: phone,
        items: [...cart],
        totalAmount: cartTotal,
        discount: Number(saleDiscount) || 0,
        paid: paid,
        remaining: remaining > 0 ? remaining : 0,
        paymentMethod,
        date: new Date().toISOString().split("T")[0],
        status: "completed",
      })

      // Update customer debt
      if (!isGiftSale && remaining > 0) {
        await updateCustomerDebt(customer.id, remaining, "add", `🛒 Satış bakiyesi: ${cart.map(i => i.name).join(", ")}`, sale.id)
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
      cart.forEach((item) => {
        const p = products.find((prod) => prod.id === item.productId)
        if (p) {
          updateProduct(p.id, { stock: Math.max(0, p.stock - item.quantity) }).catch((e) => console.error("Stok güncellenemedi:", e))
        }
      })

      // Save sale
      setSales([sale, ...sales])

      // Add to finance
      try {
        if (isGiftSale && cartTotal > 0) {
          await createTransaction({
            type: "expense",
            category: "Eşantiyon/Bedelsiz Verilen",
            amount: cartTotal,
            description: `🎁 Eşantiyon: ${customer.name} - ${cart.map(i => i.name).join(", ")}`,
            date: new Date().toISOString().split("T")[0],
            customer: customer.name,
            source: "sale",
            sourceId: sale.id,
          })
        } else if (!isGiftSale) {
          await createTransaction({
            type: "income",
            category: "Satış",
            amount: paid,
            description: `🛒 Satış: ${customer.name} - ${cart.map(i => i.name).join(", ")}`,
            date: new Date().toISOString().split("T")[0],
            customer: customer.name,
            source: "sale",
            sourceId: sale.id,
          })
        }
      } catch (e) {
        console.error("Finance save error:", e)
      }

      // Reset
      setCart([])
      setSelectedCustomer("")
      setPaymentMethod("cash")
      setPaidAmount("")
      setSaleDiscount("")
      setShowNewSale(false)
      showToast("Satış tamamlandı.", "success")
    } catch (e) {
      console.error(e)
      showToast("Satış kaydedilirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId)
    if (!sale) return

    if (!confirm(`🗑️ Bu satış kaydını silmek istediğinize emin misiniz?

⚠️ Bu işlem:
• Stokları geri ekleyecek
• Bu satıştan oluşan borç ve finans kaydını silecek

Bu işlem geri alınamaz!`)) return

    try {
      await deleteSale(saleId)
      await deleteDebtsBySource("sale", saleId)
      await deleteTransactionsBySource("sale", saleId)

      // Return stock
      const updatedProducts = products.map(p => {
        const saleItem = sale.items.find(item => item.productId === p.id)
        if (saleItem) {
          return { ...p, stock: p.stock + saleItem.quantity }
        }
        return p
      })
      setProducts(updatedProducts)
      sale.items.forEach((item) => {
        const p = products.find((prod) => prod.id === item.productId)
        if (p) {
          updateProduct(p.id, { stock: p.stock + item.quantity }).catch((e) => console.error("Stok güncellenemedi:", e))
        }
      })

      // Subtract customer debt if there was remaining (görünümü hemen güncelle)
      if (sale.remaining > 0) {
        setCustomers(customers.map((c: any) => {
          if (c.id !== sale.customerId) return c
          const currentDebt = c.totalDebt || c.balance || 0
          const newDebt = Math.max(0, currentDebt - sale.remaining)
          return { ...c, totalDebt: newDebt, balance: newDebt }
        }))
      }

      // Remove sale
      setSales(sales.filter(s => s.id !== saleId))
      showToast("Satış silindi.", "success")
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Satış silinirken bir sorun oluştu.", "error")
    }
  }

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale)
    setEditCart([...sale.items])
    setEditPaymentMethod(sale.paymentMethod)
    setEditPaidAmount(sale.paid.toString())
    setEditSaleDiscount(sale.discount ? sale.discount.toString() : "")
    setShowEditSale(true)
  }

  const handleUpdateSale = async () => {
    if (!editingSale || editCart.length === 0) return
    if (Number(editSaleDiscount) > maxEditCartDiscount) {
      showToast(`İskonto izin verilen maksimum %${maxDiscountPercent}'i (${formatCurrency(maxEditCartDiscount)}) aşıyor.`, "error")
      return
    }

    const oldSale = editingSale
    const oldRemaining = oldSale.remaining
    const newRemaining = editRemaining > 0 ? editRemaining : 0

    try {
      const updatedSale = await updateSale(editingSale.id, {
        items: [...editCart],
        totalAmount: editCartTotal,
        discount: Number(editSaleDiscount) || 0,
        paid: editPaid,
        remaining: newRemaining,
        paymentMethod: editPaymentMethod,
      })

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
      updatedProducts.forEach((p, i) => {
        if (p.stock !== products[i]?.stock) {
          updateProduct(p.id, { stock: p.stock }).catch((e) => console.error("Stok güncellenemedi:", e))
        }
      })

      // Update customer debt: eski bağlı borcu temizle, yeni bakiye varsa yeniden oluştur
      if (oldRemaining > 0 || newRemaining > 0) {
        await deleteDebtsBySource("sale", editingSale.id)
        if (newRemaining > 0) {
          await addDebt(oldSale.customerId, {
            amount: newRemaining,
            description: `🛒 Satış bakiyesi (düzenlendi): ${editCart.map(i => i.name).join(", ")}`,
            sourceType: "sale",
            sourceId: editingSale.id,
          })
        }
        setCustomers(customers.map((c: any) => {
          if (c.id !== oldSale.customerId) return c
          const currentDebt = c.totalDebt || c.balance || 0
          const newDebt = Math.max(0, currentDebt - oldRemaining + newRemaining)
          return { ...c, totalDebt: newDebt, balance: newDebt }
        }))
      }

      setSales(sales.map(s => s.id === editingSale.id ? updatedSale : s))
      setShowEditSale(false)
      setEditingSale(null)
      setEditCart([])
      setEditPaymentMethod("cash")
      setEditPaidAmount("")
      showToast("Satış güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Satış güncellenirken bir sorun oluştu.", "error")
    }
  }

  const sendWhatsApp = (sale: Sale) => {
    try {
      if (!sale) {
        showToast("Satış bilgisi bulunamadi!", "error")
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
        showToast("Müşteri telefon numarasi bulunamadi!", "error")
        return
      }

      let cleanPhone = String(phone).replace(/\D/g, "")
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1)
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        showToast("Gecersiz telefon numarasi!", "error")
        return
      }

      const items = (sale.items || []).map(i => `\u{1F4E6} ${i.name} (${i.quantity}x ${i.price.toLocaleString("tr-TR")} TL)`).join("\n")
      let message = `\u{1F44B} Merhaba *${customerName}*,\n\n`
      message += `\u{2705} *Yeşiltaş Teknoloji* satış isleminiz hakkında bilgi vermek istiyoruz.\n\n`
      message += `\u{1F6D2} *Satış Detaylari:*\n${items || "Ürün bilgisi yok"}\n\n`
      message += `\u{1F4B0} *Toplam Tutar:* ${(sale.totalAmount || 0).toLocaleString("tr-TR")} TL\n`
      if (sale.remaining > 0) {
        message += `\u{1F4B5} *Alınan:* ${(sale.paid || 0).toLocaleString("tr-TR")} TL\n`
        message += `\u{23F3} *Kalan Borç:* ${(sale.remaining || 0).toLocaleString("tr-TR")} TL\n`
        message += `\u{1F4B3} *Ödeme Sekli:* ${paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}\n`
      } else {
        message += `\u{2705} *Ödeme:* Tamamlandı\n`
        message += `\u{1F4B3} *Ödeme Sekli:* ${paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}\n`
      }
      message += `\u{1F4C5} *Tarih:* ${sale.date}\n`
      message += `\n\u{1F64F} Teşekkür ederiz, iyi günler dileriz!\n\u{1F3EA} *Yeşiltaş Teknoloji*`

      window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
    } catch (err) {
      console.error("WhatsApp error:", err)
      showToast("WhatsApp gonderilirken hata olustu!", "error")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">⏳ Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">🛒 Satışlar</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCatalog(true)} variant="outline" className="border-slate-600 text-slate-300">
            <Package className="w-4 h-4 mr-2" />Ürün Kataloğu
          </Button>
          <Button onClick={() => setShowNewSale(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingCart className="w-4 h-4 mr-2" />Yeni Satış
          </Button>
        </div>
      </div>

      {/* Ürün Kataloğu Yönetimi */}
      <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">📦 Ürün Kataloğu</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <Input placeholder="Ürün adı *" value={newProduct.name || ""} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="bg-slate-900 border-slate-600 text-white col-span-2" />
              <Input placeholder="Kategori" value={newProduct.category || ""} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="bg-slate-900 border-slate-600 text-white" />
              <Input type="number" placeholder="Satış Fiyatı" value={newProduct.price || ""} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="bg-slate-900 border-slate-600 text-white" />
              <Input type="number" placeholder="Alış Fiyatı (kâr hesabı için)" value={newProduct.purchasePrice || ""} onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: Number(e.target.value) })} className="bg-slate-900 border-slate-600 text-white" />
              <Input type="number" placeholder="Stok" value={newProduct.stock || ""} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="bg-slate-900 border-slate-600 text-white" />
              <div className="col-span-2 flex gap-2">
                <Button onClick={handleAddProduct} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                  {editingProductId ? <><Pencil className="w-4 h-4 mr-2" />Güncelle</> : <><Plus className="w-4 h-4 mr-2" />Ürünü Ekle</>}
                </Button>
                {editingProductId && (
                  <Button onClick={handleCancelEditProduct} variant="outline" className="border-slate-600 text-slate-300">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Henüz ürün eklenmemiş.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.category} · {formatCurrency(p.price)} · Stok: {p.stock}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditProductClick(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isManager && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <DialogHeader><DialogTitle className="text-xl">🛒 Yeni Satış Oluştur</DialogTitle></DialogHeader>
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
                    ✅ {customers.find(c => c.id === selectedCustomer)?.name || "Müşteri"}
                  </Badge>
                  <button onClick={() => setSelectedCustomer("")} className="text-slate-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {selectedCustomer && (() => {
                const custName = customers.find(c => c.id === selectedCustomer)?.name
                const pastSales = sales.filter(s => s.customerName === custName)
                if (pastSales.length === 0) return null
                return (
                  <div className="rounded-lg border border-indigo-700/50 bg-indigo-900/10 p-3 text-xs text-slate-400">
                    🕘 Bu müşterinin daha önce {pastSales.length} satışı var (son: {pastSales[0]?.date})
                  </div>
                )
              })()}

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
                  {!showMoreCustomerFields ? (
                    <button type="button" onClick={() => setShowMoreCustomerFields(true)} className="text-xs text-blue-400 hover:text-blue-300">
                      + Detaylı bilgi ekle (e-posta, adres)
                    </button>
                  ) : (
                    <>
                      <Input placeholder="E-posta" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                      <Input placeholder="Adres" value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                    </>
                  )}
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
                <Label className="text-slate-300">🛒 Sepetim</Label>
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
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Ara Toplam:</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">İskonto (TL)</Label>
                    <Input
                      type="number"
                      value={saleDiscount}
                      onChange={(e) => setSaleDiscount(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="0"
                    />
                    {cartSubtotal > 0 && (
                      <p className="text-xs text-slate-500">Maks. {formatCurrency(maxCartDiscount)} (%{maxDiscountPercent})</p>
                    )}
                  </div>
                  {Number(saleDiscount) > maxCartDiscount && (
                    <p className="text-xs text-red-400">⚠️ İzin verilen maksimum %{maxDiscountPercent}'i aşıyor, kaydedilemez.</p>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>💰 Toplam Tutar:</span>
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
                  {isGiftSale && (
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
                      🎁 Bu satış bedelsiz (eşantiyon) olarak işaretlenecek. Müşteriden ücret alınmayacak, borç oluşmayacak — tutar kasaya gider (zarar) olarak kaydedilecek.
                    </div>
                  )}
                  {paymentMethod === "partial" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">💵 Alınan Tutar (TL)</Label>
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
                        <span className="text-amber-400">⏳ Kalan Borç: {formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  )}
                  {remaining > 0 && paymentMethod !== "partial" && (
                    <div className="text-sm text-amber-400">⏳ Kalan Borç: {formatCurrency(remaining)}</div>
                  )}
                  <Button
                    onClick={handleCompleteSale}
                    disabled={!selectedCustomer || cart.length === 0 || Number(saleDiscount) > maxCartDiscount}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    ✅ {paymentMethod === "unpaid" ? "Satışı Kaydet (Ödenmedi)" : "Satışı Tamamla"}
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
          <DialogHeader><DialogTitle className="text-xl">✏️ Satış Düzenle #{editingSale?.id || ""}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              👤 Müşteri: <span className="text-white font-medium">{editingSale?.customerName}</span>
            </div>

            {/* Current Items */}
            <div className="space-y-2">
              <Label className="text-slate-300">📦 Satıştaki Ürünler</Label>
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
              <Label className="text-slate-300">➕ Ürün Ekle / Çıkar</Label>
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
              <div className="flex justify-between text-sm text-slate-400">
                <span>Ara Toplam:</span>
                <span>{formatCurrency(editCartSubtotal)}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">İskonto (TL)</Label>
                <Input
                  type="number"
                  value={editSaleDiscount}
                  onChange={(e) => setEditSaleDiscount(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="0"
                />
                {editCartSubtotal > 0 && (
                  <p className="text-xs text-slate-500">Maks. {formatCurrency(maxEditCartDiscount)} (%{maxDiscountPercent})</p>
                )}
              </div>
              {Number(editSaleDiscount) > maxEditCartDiscount && (
                <p className="text-xs text-red-400">⚠️ İzin verilen maksimum %{maxDiscountPercent}'i aşıyor, kaydedilemez.</p>
              )}
              <div className="flex justify-between text-lg font-bold text-white">
                <span>💰 Toplam Tutar:</span>
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
                  <Label className="text-slate-300">💵 Alınan Tutar (TL)</Label>
                  <Input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">💵 Alınan: {formatCurrency(editPaid)}</span>
                    <span className="text-amber-400">⏳ Kalan Borç: {formatCurrency(editRemaining)}</span>
                  </div>
                </div>
              )}
              {editRemaining > 0 && editPaymentMethod !== "partial" && (
                <div className="text-sm text-amber-400">⏳ Kalan Borç: {formatCurrency(editRemaining)}</div>
              )}
              <Button onClick={handleUpdateSale} className="w-full bg-blue-600 hover:bg-blue-700">
                💾 Satışı Güncelle
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
                      <div className="text-xs text-slate-400">📅 {sale.date} | 📦 {(sale.items || []).length} ürün | 💳 {paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</div>
                      <Badge className={sale.remaining > 0 ? "bg-amber-600/20 text-amber-400" : (sale.paid === 0 && sale.totalAmount > 0 ? "bg-red-600/20 text-red-400" : "bg-emerald-600/20 text-emerald-400")}>
                        {sale.remaining > 0 ? `⏳ Kısmi - Kalan: ${formatCurrency(sale.remaining)}` : (sale.paid === 0 && sale.totalAmount > 0 ? "❌ Ödenmedi" : "✅ Tamamlandı")}
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
                      <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" 
                      onClick={() => openEditSale(sale)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />Düzenle
                    </Button>
                    {isManager && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                      onClick={() => handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Sil
                    </Button>
                    )}
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
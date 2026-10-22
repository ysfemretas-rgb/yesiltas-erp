"use client"

import { StatListDialog, StatRow } from "@/components/StatListDialog"
import { openWhatsApp } from "@/lib/whatsapp"
import { localDateStr } from "@/lib/dates"
import { Toast, useToast } from "@/components/toast"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ShoppingCart, Plus, Minus, Trash2, MessageCircle, X, UserPlus, Pencil, AlertTriangle, Package, Barcode, Printer, Ban, Shield, Download, QrCode, Eye } from "lucide-react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { Sale, SaleItem, SalePayment, Installment, TradeIn, fetchSales, createSale, updateSale, deleteSale } from "@/lib/sales"
import { fetchCustomers, createCustomer, addDebt, deleteDebtsBySource } from "@/lib/customers"
import { fetchRepairs, Repair } from "@/lib/repairs"
import { openDebtInfo } from "@/lib/customerDebt"
import { diffFields } from "@/lib/diff"
import { logStockMovement } from "@/lib/stockMovements"
import { logChange } from "@/lib/activityLog"
import { validatePhone } from "@/lib/validation"
import { createTransaction, deleteTransactionsBySource, reverseTransactionsBySource, syncTransactionsToNet } from "@/lib/finance"
import { InventoryItem, fetchInventory, adjustInventoryQuantity, createInventoryItem, findActiveImeiConflict, InsufficientStockError } from "@/lib/inventory"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { printSaleReceipt } from "@/lib/saleReceipt"
import { createWarranty } from "@/lib/warranties"
import { round2, buildInstallments, computeRefund } from "@/lib/money"
import { printRecordLabel } from "@/lib/labels"
import { CustomerPicker } from "@/components/CustomerPicker"
import { exportToExcel } from "@/lib/exportExcel"
import { Pagination } from "@/components/Pagination"
import { addMonths } from "date-fns"
import { getWhatsAppTemplates, renderTemplate } from "@/lib/whatsappTemplates"
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog"

interface Customer {
  id: string
  customerCode?: string
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
  { value: "split", label: "🔀 Çoklu Ödeme" },
  { value: "installment", label: "📅 Taksitli" },
  { value: "unpaid", label: "⏳ Ödenmedi" },
  { value: "gift", label: "🎁 Eşantiyon (Bedelsiz)" },
]

export default function SalesPage() {
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()
  const { authorized, checking } = usePageAccess("Satış")
  const isManager = useIsManager()
  const { rates } = useExchangeRates()
  const [statKey, setStatKey] = useState<string | null>(null)
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")

  const [customerSearch, setCustomerSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [saleDiscount, setSaleDiscount] = useState("")
  const [editSaleDiscount, setEditSaleDiscount] = useState("")
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(20)
  const [minMarginPercent, setMinMarginPercent] = useState(0)
  const [cardCommissionPercent, setCardCommissionPercent] = useState(0)
  const [extraCostInput, setExtraCostInput] = useState("")
  const [extraCostNoteInput, setExtraCostNoteInput] = useState("")
  const [repairsForRisk, setRepairsForRisk] = useState<Repair[]>([])
  const [paidAmount, setPaidAmount] = useState("")
  const [showNewSale, setShowNewSale] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
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
  const [listPage, setListPage] = useState(1)
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  // Çoklu ödeme / taksit / takas / iade
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")
  const [splitTransfer, setSplitTransfer] = useState("")
  const [editSplitCash, setEditSplitCash] = useState("")
  const [editSplitCard, setEditSplitCard] = useState("")
  const [editSplitTransfer, setEditSplitTransfer] = useState("")
  const [instDown, setInstDown] = useState("")
  const [instCount, setInstCount] = useState("3")
  const [instFirstDate, setInstFirstDate] = useState("")
  const [tradeName, setTradeName] = useState("")
  const [tradeImei, setTradeImei] = useState("")
  const [tradeValue, setTradeValue] = useState("")
  const [refundQty, setRefundQty] = useState<Record<number, string>>({})
  const [refundMode, setRefundMode] = useState<"cash" | "balance">("cash")
  const PAGE_SIZE = 20

  // Ürünler, müşteriler ve satışlar artık Supabase'den geliyor.
  useEffect(() => {
    try {
      const companyRaw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
      if (companyRaw) {
        const parsed = JSON.parse(companyRaw)
        if (typeof parsed?.maxDiscountPercent === "number") setMaxDiscountPercent(parsed.maxDiscountPercent)
        if (typeof parsed?.minMarginPercent === "number") setMinMarginPercent(parsed.minMarginPercent)
        if (typeof parsed?.cardCommissionPercent === "number") setCardCommissionPercent(parsed.cardCommissionPercent)
      }
    } catch (e) {
      console.error("Şirket ayarları okunamadı:", e)
    }

    fetchRepairs().then(setRepairsForRisk).catch((e) => console.error("Tamirler yüklenemedi (risk kontrolü için):", e))

    fetchInventory()
      .then((data) => setProducts(data))
      .catch((e) => console.error("Envanter yüklenemedi:", e))

    fetchCustomers()
      .then((data) => setCustomers(data.map(c => ({ id: c.id, customerCode: c.customerCode, name: c.name, phone: c.phone, phone1: c.phone1, phone2: c.phone2, balance: 0, totalDebt: c.totalDebt, debts: c.debts }))))
      .catch((e) => console.error("Müşteriler yüklenemedi:", e))

    fetchSales()
      .then((data) => setSales(data))
      .catch((e) => {
        console.error("Satışlar yüklenemedi:", e)
        showToast("Satışlar yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => setIsLoaded(true))
  }, [])


  // Karekod / arama ile gelindiğinde (?open=ID) satış detayını aç
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return
    const openId = new URLSearchParams(window.location.search).get("open")
    if (!openId) return
    const found = sales.find(s => s.id === openId)
    if (found) setViewSale(found)
    else showToast("Satış kaydı bulunamadı.", "error")
    window.history.replaceState(null, "", window.location.pathname)
  }, [isLoaded])

  useEffect(() => {
    const total = Math.max(1, Math.ceil(sales.length / PAGE_SIZE))
    if (listPage > total) setListPage(total)
  }, [sales.length])

  const exportSales = () => {
    exportToExcel("satislar", "Satışlar", sales.map(s => ({
      "Satış Kodu": s.saleCode || "",
      "Tarih": s.date,
      "Müşteri": s.customerName,
      "Müşteri Kodu": s.customerCode || "",
      "Ürünler": s.items.map(i => `${i.name} x${i.quantity}`).join(", "),
      "Ara Toplam": s.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      "İskonto": s.discount,
      "Toplam": s.totalAmount,
      "Mal Maliyeti": round2(s.items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0)),
      "Ek Maliyet": s.extraCost || 0,
      "Gerçek Kâr": s.paymentMethod === "gift" ? -round2(s.items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0)) : round2(s.totalAmount - s.items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0) - (s.extraCost || 0)),
      "Alınan": s.paid,
      "Kalan": s.remaining,
      "Ödeme Şekli": paymentMethods.find(m => m.value === s.paymentMethod)?.label || s.paymentMethod,
      "Durum": s.status === "cancelled" ? "İptal" : "Tamamlandı",
    })))
  }

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
      (p.category && p.category.toLowerCase().includes(search)) ||
      (p.productCode && p.productCode.toLowerCase().includes(search)) ||
      (p.supplierBarcode && p.supplierBarcode.toLowerCase().includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search))
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
  const isSplit = paymentMethod === "split"
  const isInstallment = paymentMethod === "installment"
  const splitSum = (Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitTransfer) || 0)
  // Takas: müşteriden alınan cihazın değeri satış bedelinden düşülür (nakit değildir)
  const tradeVal = isGiftSale || !tradeName.trim() ? 0 : Math.max(0, Number(tradeValue) || 0)
  // cashPaid = kasaya fiilen giren para; paid = cashPaid + takas değeri
  const cashPaid = isGiftSale ? 0
    : paymentMethod === "partial" ? Number(paidAmount) || 0
    : paymentMethod === "unpaid" ? 0
    : isSplit ? splitSum
    : isInstallment ? Number(instDown) || 0
    : Math.max(0, cartTotal - tradeVal)
  const paid = isGiftSale ? 0 : cashPaid + tradeVal
  const remaining = isGiftSale ? 0 : round2(cartTotal - paid)
  // Maliyet, ek maliyet (komisyon + kargo vb.) ve gerçek kâr
  const cartCost = round2(cart.reduce((sum, i) => sum + (i.purchasePrice || 0) * (i.quantity || 0), 0))
  const cardPortion = paymentMethod === "card" ? cashPaid : isSplit ? Number(splitCard) || 0 : 0
  const commissionAmount = cardCommissionPercent > 0 ? round2((cardPortion * cardCommissionPercent) / 100) : 0
  const extraCostTotal = isGiftSale ? 0 : round2(commissionAmount + (Number(extraCostInput) || 0))
  const realProfit = isGiftSale ? -cartCost : round2(cartTotal - cartCost - extraCostTotal)
  // Düşük marj kontrolü (maliyeti bilinmeyen sepette yapılmaz)
  const marginStatus: "loss" | "low" | null =
    isGiftSale || cartCost <= 0 ? null
    : cartTotal < cartCost ? "loss"
    : minMarginPercent > 0 && ((cartTotal - cartCost) / cartCost) * 100 < minMarginPercent ? "low"
    : null
  // Seçili müşterinin açık borç / vade bilgisi
  const riskInfo = (() => {
    const c: any = customers.find(x => x.id === selectedCustomer)
    if (!c) return null
    const info = openDebtInfo(c, repairsForRisk as any, sales as any, customers as any, localDateStr())
    return info.debt > 0 ? info : null
  })()
  const installmentPlan = isInstallment && remaining > 0 ? buildInstallments(remaining, Math.max(1, Math.min(24, Math.floor(Number(instCount) || 1))), instFirstDate || localDateStr(new Date(Date.now() + 30 * 86400000))) : []

  const isEditGift = editPaymentMethod === "gift"
  const editSplitSum = (Number(editSplitCash) || 0) + (Number(editSplitCard) || 0) + (Number(editSplitTransfer) || 0)
  const editPaid = isEditGift ? 0 : editPaymentMethod === "partial" ? Number(editPaidAmount) || 0 : editPaymentMethod === "split" ? editSplitSum : (editPaymentMethod === "unpaid" ? 0 : editCartTotal)
  const editRemaining = isEditGift ? 0 : editCartTotal - editPaid

  // Alış fiyatını TL'ye çevirir (dolar/euro ile alınan ürünlerde kâr hesabı doğru çıksın).
  const purchaseInTRY = (product: InventoryItem) => {
    const price = product.purchasePrice || 0
    if (product.purchaseCurrency === "USD") return Math.round(price * rates.USD * 100) / 100
    if (product.purchaseCurrency === "EUR") return Math.round(price * rates.EUR * 100) / 100
    return price
  }

  // Düzenlemede, satışın zaten düştüğü adet de tekrar kullanılabilir sayılır.
  const availableStock = (product: InventoryItem, originalItems?: SaleItem[]) => {
    const original = originalItems?.find(i => i.productId === product.id)?.quantity || 0
    return product.quantity + original
  }

  // Müşteri kimliğini bulur: önce satıştaki kayıtlı ID, sonra müşteri kodu, en son tam isim eşleşmesi.
  const resolveCustomerId = (sale: Sale): string => {
    if (sale.customerId && customers.some(c => c.id === sale.customerId)) return sale.customerId
    if (sale.customerCode) {
      const byCode = customers.find(c => c.customerCode === sale.customerCode)
      if (byCode) return byCode.id
    }
    const byName = customers.filter(c => c.name.trim().toLowerCase() === (sale.customerName || "").trim().toLowerCase())
    return byName.length === 1 ? byName[0].id : ""
  }

  const splitBreakdown = (cash: number, card: number, transfer: number) =>
    [cash > 0 ? `Nakit ${formatCurrency(cash)}` : "", card > 0 ? `Kart ${formatCurrency(card)}` : "", transfer > 0 ? `Havale ${formatCurrency(transfer)}` : ""].filter(Boolean).join(", ")

  const itemsCostTRY = (items: SaleItem[]) => items.reduce((sum, i) => sum + (i.purchasePrice || 0) * (i.quantity || 0), 0)

  // Satışın kasa kaydını (yeniden) yazar. Eşantiyonda gider, ürünün ALIŞ maliyetidir (satış fiyatı değil);
  // ödenmemiş satışta 0 TL'lik gelir kaydı oluşturulmaz.
  const writeSaleFinance = async (saleId: string, customerName: string, items: SaleItem[], gift: boolean, paidAmount: number, breakdown: string = "") => {
    const names = items.map(i => i.name).join(", ")
    // Hata olursa yukarıya iletilir (sessizce yutulmaz); çağıran adım başarısızlığı kullanıcıya bildirir.
    if (gift) {
      const cost = itemsCostTRY(items)
      if (cost > 0) {
        await createTransaction({
          type: "expense",
          category: "Eşantiyon/Bedelsiz Verilen",
          amount: Math.round(cost * 100) / 100,
          description: `🎁 Eşantiyon: ${customerName} - ${names}`,
          date: localDateStr(),
          customer: customerName,
          source: "sale",
          sourceId: saleId,
        })
      }
    } else if (paidAmount > 0) {
      await createTransaction({
        type: "income",
        category: "Satış",
        amount: paidAmount,
        description: `🛒 Satış: ${customerName} - ${names}${breakdown ? ` (${breakdown})` : ""}`,
        date: localDateStr(),
        customer: customerName,
        source: "sale",
        sourceId: saleId,
      })
    }
  }

  // Çok adımlı işlemlerde adımları sırayla çalıştırır, hata veren adımların adlarını döndürür.
  // (Eskiden başarısız adımlar sessizce yutuluyor, kullanıcıya "tamamlandı" deniyordu.)
  const runSteps = async (steps: { label: string; run: () => Promise<unknown> }[]): Promise<string[]> => {
    const failed: string[] = []
    for (const st of steps) {
      try {
        await st.run()
      } catch (e) {
        console.error(`${st.label} adımı başarısız:`, e)
        failed.push(st.label)
      }
    }
    return failed
  }

  const reportSteps = (failed: string[], doneMessage: string) => {
    if (failed.length === 0) showToast(doneMessage, "success")
    else showToast(`İşlem kaydedildi ancak şu adımlar TAMAMLANAMADI: ${failed.join(", ")}. Lütfen ilgili sayfadan kontrol edip düzeltin.`, "error")
  }

  // Stok farklarını veritabanında atomik uygular ve ekrandaki listeyi günceller.
  const applyStockDeltas = async (deltas: { productId: string; delta: number }[], reason: string = "Satış") => {
    const active = deltas.filter(d => d.delta !== 0)
    if (active.length === 0) return
    const failedNames: string[] = []
    for (const d of active) {
      const name = products.find(p => p.id === d.productId)?.name || "Ürün"
      try {
        await adjustInventoryQuantity(d.productId, d.delta, reason, name, d.delta < 0)
        setProducts(prev => prev.map(p => p.id === d.productId ? { ...p, quantity: Math.max(0, p.quantity + d.delta) } : p))
      } catch (e) {
        console.error("Stok güncellenemedi:", e)
        failedNames.push(name)
      }
    }
    if (failedNames.length > 0) throw new Error(`Stok güncellenemedi: ${failedNames.join(", ")}`)
  }

  const addToCart = (product: InventoryItem, quantity: number = 1) => {
    if (!product || quantity < 1) return
    const existing = cart.find(item => item.productId === product.id)
    const nextQty = (existing?.quantity || 0) + quantity
    if (nextQty > product.quantity) {
      showToast(`${product.name} — stokta sadece ${product.quantity} adet var.`, "error")
      return
    }
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id ? { ...item, quantity: nextQty } : item
      ))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.salePrice, purchasePrice: purchaseInTRY(product), quantity }])
    }
  }

  const addToEditCart = (product: InventoryItem, quantity: number = 1) => {
    if (!product || quantity < 1) return
    const existing = editCart.find(item => item.productId === product.id)
    const nextQty = (existing?.quantity || 0) + quantity
    if (nextQty > availableStock(product, editingSale?.items)) {
      showToast(`${product.name} — yeterli stok yok.`, "error")
      return
    }
    if (existing) {
      setEditCart(editCart.map(item =>
        item.productId === product.id ? { ...item, quantity: nextQty } : item
      ))
    } else {
      setEditCart([...editCart, { productId: product.id, name: product.name, price: product.salePrice, purchasePrice: purchaseInTRY(product), quantity }])
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
    if (product && quantity > product.quantity) return
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
    if (product && quantity > availableStock(product, editingSale?.items)) return
    setEditCart(editCart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
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
        lastVisit: localDateStr(),
      })
      const newCustomer: Customer = {
        id: created.id,
        name: created.name,
        phone: created.phone,
        phone1: created.phone,
        customerCode: created.customerCode,
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
      await addDebt(customerId, { amount, description: description || "Satış bakiyesi", sourceType: "sale", sourceId: saleId })
    }
    setCustomers(customers.map((c: any) => {
      if (c.id !== customerId) return c
      const currentDebt = c.totalDebt || c.balance || 0
      const newDebt = operation === "add" ? currentDebt + amount : Math.max(0, currentDebt - amount)
      return { ...c, totalDebt: newDebt, balance: newDebt }
    }))
  }

  // Satış penceresi her açıldığında güncel stok çekilir (ekrandaki sayı eski kalmasın)
  useEffect(() => {
    if (showNewSale) fetchInventory().then(setProducts).catch((e) => console.error("Stok yenilenemedi:", e))
  }, [showNewSale])

  // Çift dokunma koruması: "Satışı Tamamla"ya iki kez basılırsa (telefonda yavaş bağlantıda sık olur)
  // ikinci işlem birincinin stoğunu görüp "stok yok" hatası veriyordu.
  const [savingSale, setSavingSale] = useState(false)
  const savingRef = useRef(false)
  const handleCompleteSale = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSavingSale(true)
    try {
      await doCompleteSale()
    } finally {
      savingRef.current = false
      setSavingSale(false)
    }
  }

  const doCompleteSale = async () => {
    if (!selectedCustomer || cart.length === 0) return
    const customer = customers.find(c => c.id === selectedCustomer)
    if (!customer) return

    if (Number(saleDiscount) > maxCartDiscount) {
      showToast(`İskonto izin verilen maksimum %${maxDiscountPercent}'i (${formatCurrency(maxCartDiscount)}) aşıyor.`, "error")
      return
    }

    // NOT: Stok yeterliliği ekrandaki (eski olabilen) sayıya göre DEĞİL, aşağıda veritabanında kontrol edilir.

    if (isSplit && splitSum <= 0) {
      showToast("Çoklu ödeme için en az bir tutar girin.", "error")
      return
    }
    if (tradeName.trim() && tradeVal <= 0) {
      showToast("Takas cihazının değerini girin.", "error")
      return
    }
    if (tradeVal > cartTotal) {
      showToast("Takas değeri satış tutarından büyük olamaz.", "error")
      return
    }
    if (isInstallment && remaining <= 0) {
      showToast("Taksitli satışta peşinat toplam tutardan küçük olmalı.", "error")
      return
    }

    // Telefon numarası kontrolü
    const phone = customer.phone || customer.phone1 || ""
    if (!phone) {
      showToast("Müşterinin telefon numarası yok! Lütfen müşteri bilgilerini güncelleyin.", "error")
      return
    }

    // Aynı IMEI'li bir cihaz zaten stoktaysa takasla tekrar alınamaz
    if (tradeVal > 0 && tradeImei.trim()) {
      const conflict = await findActiveImeiConflict(tradeImei)
      if (conflict) {
        showToast(`Takas IMEI'si zaten stokta kayıtlı: ${conflict.name}${conflict.productCode ? ` (${conflict.productCode})` : ""}.`, "error")
        return
      }
    }

    // Minimum kâr / maliyet altı satış: sadece yönetici onaylayabilir
    let lowMarginNote = ""
    if (marginStatus) {
      const msg = marginStatus === "loss"
        ? `Satış fiyatı (${formatCurrency(cartTotal)}) maliyetin (${formatCurrency(cartCost)}) ALTINDA.`
        : `Kâr oranı belirlenen minimum %${minMarginPercent}'in altında (satış ${formatCurrency(cartTotal)}, maliyet ${formatCurrency(cartCost)}).`
      if (!isManager) {
        showToast(`${msg} Bu satışı yalnızca yönetici hesabıyla yapabilirsiniz.`, "error")
        return
      }
      if (!confirm(`⚠️ ${msg}\n\nYönetici onayıyla yine de kaydedilsin mi?`)) return
      lowMarginNote = msg
    }

    // Vadesi geçmiş borcu olan müşteriye yeni borç eklenecekse uyarı
    if (!isGiftSale && remaining > 0 && riskInfo && riskInfo.ageDays >= 30) {
      if (!confirm(`⚠️ ${customer.name} adlı müşterinin ${formatCurrency(riskInfo.debt)} açık borcu var (en eski ${riskInfo.ageDays} gün önce).\n\nBu satışla ${formatCurrency(remaining)} yeni borç eklenecek. Yine de devam edilsin mi?`)) return
    }

    // 1) Stok ÖNCE, veritabanında kontrollü ayrılır: yetersizse işlem reddedilir ve hiçbir kayıt oluşmaz.
    //    (İki kişi aynı anda son ürünü satamaz; satış kaydı oluşmadan stok düşmüş olmaz.)
    const reserved: { productId: string; qty: number; name: string }[] = []
    const rollbackStock = async () => {
      for (const r of reserved) {
        await adjustInventoryQuantity(r.productId, r.qty, "Satış başarısız — stok iadesi", r.name).catch((err) => console.error("Stok iadesi yapılamadı:", err))
      }
      fetchInventory().then(setProducts).catch(() => undefined)
    }
    try {
      for (const item of cart) {
        await adjustInventoryQuantity(item.productId, -item.quantity, "Satış", item.name, true)
        reserved.push({ productId: item.productId, qty: item.quantity, name: item.name })
      }
    } catch (e) {
      await rollbackStock()
      showToast(e instanceof InsufficientStockError ? e.message : `Stok ayrılırken bir sorun oluştu; satış yapılmadı. (${String((e as any)?.message || e).slice(0, 160)})`, "error")
      return
    }
    setProducts(prev => prev.map(p => {
      const r = reserved.find(x => x.productId === p.id)
      return r ? { ...p, quantity: Math.max(0, p.quantity - r.qty) } : p
    }))

    // 2) Satış kaydı. Başarısız olursa ayrılan stok geri verilir.
    let sale: Sale
    try {
      sale = await createSale({
        customerId: customer.id,
        customerName: customer.name,
        customerCode: customer.customerCode,
        customerPhone: phone,
        items: [...cart],
        totalAmount: cartTotal,
        discount: Number(saleDiscount) || 0,
        paid: paid,
        remaining: remaining,
        paymentMethod,
        date: localDateStr(),
        status: "completed",
        payments: isSplit
          ? ([
              { method: "cash", amount: Number(splitCash) || 0 },
              { method: "card", amount: Number(splitCard) || 0 },
              { method: "transfer", amount: Number(splitTransfer) || 0 },
            ] as SalePayment[]).filter(p => p.amount > 0)
          : [],
        installments: installmentPlan,
        tradeIn: tradeVal > 0 ? { name: tradeName.trim(), imei: tradeImei.trim() || undefined, value: tradeVal } : null,
        extraCost: extraCostTotal,
        extraCostNote: [commissionAmount > 0 ? `Kart komisyonu ${formatCurrency(commissionAmount)}` : "", extraCostNoteInput.trim() ? `${extraCostNoteInput.trim()} ${formatCurrency(Number(extraCostInput) || 0)}` : ""].filter(Boolean).join("; "),
      })
    } catch (e) {
      console.error(e)
      await rollbackStock()
      const detail = (e as any)?.message ? ` (${String((e as any).message).slice(0, 160)})` : ""
      showToast(`Satış kaydedilemedi; stok geri verildi.${detail}`, "error")
      return
    }

    let savedSale = sale
    if (lowMarginNote) {
      logChange("Satışlar", "created", `Düşük marjlı satış yönetici onayıyla yapıldı: ${sale.saleCode || ""} — ${customer.name}`, [], lowMarginNote)
    }

    // 3) Satışa bağlı diğer adımlar: borç, takas stoğu, kasa. Hangisi başarısız olursa kullanıcıya bildirilir.
    const failed = await runSteps([
      {
        label: "müşteri borç kaydı",
        run: async () => {
          // fazla ödeme (remaining<0) borç oluşturmaz; müşteri o satıştan alacaklı sayılır
          if (!isGiftSale && remaining > 0) {
            await updateCustomerDebt(customer.id, remaining, "add", `🛒 Satış bakiyesi: ${cart.map(i => i.name).join(", ")}`, sale.id)
          }
        },
      },
      {
        label: "takas cihazının stoğa eklenmesi",
        run: async () => {
          if (tradeVal <= 0) return
          const tradeItem = await createInventoryItem({
            name: `${tradeName.trim()} (Takas)`,
            sku: "",
            category: "İkinci El",
            quantity: 1,
            minQuantity: 0,
            purchasePrice: tradeVal,
            purchaseCurrency: "TRY",
            profitMargin: 20,
            salePrice: Math.round(tradeVal * 1.2),
            supplier: "",
            location: "",
            paymentStatus: "paid",
            paidAmount: 0,
            imei: tradeImei.trim() || undefined,
          } as any)
          logStockMovement(tradeItem.id, tradeItem.name, 1, `Takas ${sale.saleCode || ""}`.trim())
          const tradeIn: TradeIn = { name: tradeName.trim(), imei: tradeImei.trim() || undefined, value: tradeVal, productId: tradeItem.id }
          savedSale = await updateSale(sale.id, { tradeIn })
          setProducts(prev => [tradeItem, ...prev])
        },
      },
      {
        label: "kasa kaydı",
        run: () => writeSaleFinance(sale.id, customer.name, cart, isGiftSale, cashPaid, isSplit ? splitBreakdown(Number(splitCash) || 0, Number(splitCard) || 0, Number(splitTransfer) || 0) : (tradeVal > 0 ? `takas ${formatCurrency(tradeVal)} düşüldü` : "")),
      },
    ])

    setSales([savedSale, ...sales])

    // Reset
    setCart([])
    setSelectedCustomer("")
    setPaymentMethod("cash")
    setPaidAmount("")
    setSaleDiscount("")
    setSplitCash(""); setSplitCard(""); setSplitTransfer("")
    setInstDown(""); setInstCount("3"); setInstFirstDate("")
    setTradeName(""); setTradeImei(""); setTradeValue("")
    setExtraCostInput(""); setExtraCostNoteInput("")
    setShowNewSale(false)
    reportSteps(failed, "Satış tamamlandı.")
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
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Satış silinirken bir sorun oluştu.", "error")
      return
    }
    setSales(sales.filter(s => s.id !== saleId))

    const failed = await runSteps([
      { label: "takas cihazı stoğu", run: async () => { if (sale.status !== "cancelled") await removeTradeInStock(sale) } },
      { label: "müşteri borç kaydı", run: () => deleteDebtsBySource("sale", saleId) },
      { label: "kasa kayıtları", run: () => deleteTransactionsBySource("sale", saleId) },
      {
        // İptal edilmiş satışın stoğu zaten iade edilmişti; tekrar ekleme
        label: "stok iadesi",
        run: async () => {
          if (sale.status !== "cancelled") {
            await applyStockDeltas(sale.items.map(item => ({ productId: item.productId, delta: item.quantity })), `Satış silindi ${sale.saleCode || ""}`.trim())
          }
        },
      },
    ])
    reportSteps(failed, "Satış silindi.")
  }

  // Takaslı satış iptal/silinirse, takasla alınan cihaz hâlâ stoktaysa stoktan düşülür
  const removeTradeInStock = async (sale: Sale) => {
    const productId = sale.tradeIn?.productId
    if (!productId) return
    const p = products.find(x => x.id === productId)
    if (p && p.quantity > 0) {
      await adjustInventoryQuantity(productId, -p.quantity, `Takas iptali ${sale.saleCode || ""}`.trim(), p.name)
      setProducts(prev => prev.map(x => x.id === productId ? { ...x, quantity: 0 } : x))
    }
  }

  // Kısmi ürün iadesi: seçilen ürünler stoğa döner, satış tutarı orantılı düşer.
  // Nakit iade: müşterinin fazla ödediği kısım kasadan geri verilir; bakiyeye mahsup: fark müşteri alacağı olur.
  const handleRefund = async () => {
    const sale = viewSale
    if (!sale) return
    const calc = computeRefund({
      items: sale.items,
      discount: sale.discount,
      totalAmount: sale.totalAmount,
      paid: sale.paid,
      returnQty: sale.items.map((_, i) => Number(refundQty[i]) || 0),
      mode: refundMode,
    })
    if (!calc.ok) {
      showToast(calc.reason === "none" ? "İade edilecek ürün adedi girin." : "Tüm ürünler iade ediliyorsa satışı \"İptal\" edin.", "error")
      return
    }
    const { newDiscount, newTotal, refundValue, cashRefund, newPaid, newRemaining } = calc
    const lines = sale.items
      .map((it, i) => ({ it, i, q: sale.items[i].quantity - calc.remainingQty[i] }))
      .filter(x => x.q > 0)
    const newItems = sale.items
      .map((it, i) => ({ ...it, quantity: calc.remainingQty[i] }))
      .filter(it => it.quantity > 0)
    const customerId = resolveCustomerId(sale)
    if ((sale.remaining > 0 || newRemaining > 0) && !customerId) {
      showToast("Bu satışın müşterisi kesin olarak bulunamadı; iade yapılamıyor.", "error")
      return
    }
    if (!confirm(`İade edilecek tutar: ${formatCurrency(refundValue)}\n${refundMode === "cash" ? `Müşteriye nakit iade: ${formatCurrency(cashRefund)}` : "Fark müşteri bakiyesine yazılır"}\n\nOnaylıyor musunuz?`)) return

    const refund = { date: localDateStr(), mode: refundMode, amount: refundValue, items: lines.map(l => ({ name: l.it.name, quantity: l.q })) }
    let updated: Sale
    try {
      updated = await updateSale(sale.id, {
        items: newItems,
        totalAmount: newTotal,
        discount: newDiscount,
        paid: newPaid,
        remaining: newRemaining,
        refunds: [...(sale.refunds || []), refund],
      })
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "İade yapılamadı; hiçbir kayıt değişmedi.", "error")
      return
    }
    setSales(sales.map(s => s.id === sale.id ? updated : s))
    setViewSale(updated)
    setRefundQty({})
    logChange("Satışlar", "updated", `Satış ${sale.saleCode || ""} İADE (${sale.customerName}): ${lines.map(l => `${l.it.name} x${l.q}`).join(", ")}`, diffFields(
      { total: sale.totalAmount, paid: sale.paid, remaining: sale.remaining },
      { total: newTotal, paid: newPaid, remaining: newRemaining },
      [{ key: "total", label: "Toplam" }, { key: "paid", label: "Ödenen" }, { key: "remaining", label: "Kalan" }]
    ), refundMode === "cash" ? "nakit iade" : "bakiyeye mahsup")

    const failed = await runSteps([
      { label: "stok iadesi", run: () => applyStockDeltas(lines.map(l => ({ productId: l.it.productId, delta: l.q })), `Satış iadesi ${sale.saleCode || ""}`.trim()) },
      {
        label: "müşteri borç kaydı",
        run: async () => {
          if (!(sale.remaining > 0 || newRemaining > 0)) return
          await deleteDebtsBySource("sale", sale.id)
          if (newRemaining > 0) {
            await addDebt(customerId, {
              amount: newRemaining,
              description: `🛒 Satış bakiyesi (iade sonrası): ${newItems.map(i => i.name).join(", ")}`,
              sourceType: "sale",
              sourceId: sale.id,
            })
          }
        },
      },
      {
        label: "nakit iade kasa kaydı",
        run: async () => {
          if (cashRefund <= 0) return
          await createTransaction({
            type: "expense",
            category: "Satış İadesi",
            amount: cashRefund,
            description: `↩️ Satış iadesi: ${sale.customerName} - ${lines.map(l => `${l.it.name} x${l.q}`).join(", ")}`,
            date: localDateStr(),
            customer: sale.customerName,
            source: "sale",
            sourceId: sale.id,
          })
        },
      },
    ])
    reportSteps(failed, "İade yapıldı, ürünler stoğa geri eklendi.")
  }

  // İptal / iade: kayıt silinmez, "iptal" olarak kalır; stok geri eklenir,
  // bağlı borç ve kasa kaydı kaldırılır.
  // Satıştan tek tıkla garanti kaydı oluşturur (süre sorulur, varsayılan 12 ay).
  const handleCreateWarranty = async (sale: Sale) => {
    const input = window.prompt(`${sale.customerName} — ürün garanti süresi (ay):`, "12")
    if (input === null) return
    const months = Math.round(Number(input))
    if (!months || months < 1 || months > 120) {
      showToast("Geçerli bir ay sayısı girin (1-120).", "error")
      return
    }
    try {
      const start = sale.date || localDateStr()
      const end = localDateStr(addMonths(new Date(`${start}T12:00:00`), months))
      await createWarranty({
        deviceName: sale.items.map(i => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ").slice(0, 200) || "Satış ürünü",
        customerName: sale.customerName,
        customerPhone: sale.customerPhone || "",
        warrantyType: "Genel",
        startDate: start,
        endDate: end,
        status: "active",
        notes: `Satış ${sale.saleCode || ""} için otomatik oluşturuldu`.trim(),
      })
      showToast(`Garanti kaydı oluşturuldu (${months} ay). Garantiler sayfasında görebilirsiniz.`, "success")
    } catch (e) {
      console.error(e)
      showToast("Garanti kaydı oluşturulamadı.", "error")
    }
  }

  const handleCancelSale = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId)
    if (!sale || sale.status === "cancelled") return

    if (!confirm(`🚫 Bu satış iptal / iade edilsin mi?

• Ürünler stoğa geri eklenir
• Bu satışın borcu kapatılır
• Kasaya ters kayıt yazılır (geçmiş kayıtlar silinmez)
• Satış kaydı "İptal" olarak listede kalır`)) return

    const reason = window.prompt("İptal nedeni (opsiyonel, kayda geçer):", "")
    if (reason === null) return

    try {
      await updateSale(saleId, { status: "cancelled" })
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Satış iptal edilemedi.", "error")
      return
    }
    logChange("Satışlar", "updated", `Satış ${sale.saleCode || ""} İPTAL EDİLDİ (${sale.customerName}, ${sale.totalAmount.toLocaleString("tr-TR")} TL)`, [], reason.trim() || undefined)
    setSales(sales.map(s => s.id === saleId ? { ...s, status: "cancelled" as const } : s))

    const failed = await runSteps([
      { label: "stok iadesi", run: () => applyStockDeltas(sale.items.map(item => ({ productId: item.productId, delta: item.quantity })), `Satış iptali ${sale.saleCode || ""}`.trim()) },
      { label: "takas cihazı stoğu", run: () => removeTradeInStock(sale) },
      { label: "müşteri borç kaydı", run: () => deleteDebtsBySource("sale", saleId) },
      { label: "kasa ters kaydı", run: () => reverseTransactionsBySource("sale", saleId, { label: `Satış iptali ${sale.saleCode || ""}: ${sale.customerName}`.trim(), customer: sale.customerName, date: localDateStr() }) },
    ])
    reportSteps(failed, "Satış iptal edildi, stok geri eklendi.")
  }

  const openEditSale = (sale: Sale) => {
    if (sale.paymentMethod === "installment" || (sale.installments || []).length > 0) {
      showToast("Taksitli satışlar düzenlenemez. İptal edip yeniden oluşturabilirsiniz; ödemeler için Müşteriler > Borç > Tahsil Et kullanılır.", "error")
      return
    }
    if (sale.tradeIn) {
      showToast("Takaslı satışlar düzenlenemez. İptal edip yeniden oluşturabilirsiniz.", "error")
      return
    }
    if ((sale.refunds || []).length > 0) {
      showToast("İade yapılmış satışlar düzenlenemez.", "error")
      return
    }
    const pay = sale.payments || []
    setEditSplitCash(String(pay.find(p => p.method === "cash")?.amount || ""))
    setEditSplitCard(String(pay.find(p => p.method === "card")?.amount || ""))
    setEditSplitTransfer(String(pay.find(p => p.method === "transfer")?.amount || ""))
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
    const newRemaining = editRemaining
    const customerId = resolveCustomerId(oldSale)

    if ((oldRemaining > 0 || newRemaining > 0) && !customerId) {
      showToast("Bu satışın müşterisi kesin olarak bulunamadı; borç güncellenemiyor. Müşteri kaydını kontrol edin.", "error")
      return
    }

    try {
      const updatedSale = await updateSale(editingSale.id, {
        customerId: customerId || undefined,
        items: [...editCart],
        totalAmount: editCartTotal,
        discount: Number(editSaleDiscount) || 0,
        paid: editPaid,
        remaining: newRemaining,
        paymentMethod: editPaymentMethod,
        payments: editPaymentMethod === "split"
          ? ([
              { method: "cash", amount: Number(editSplitCash) || 0 },
              { method: "card", amount: Number(editSplitCard) || 0 },
              { method: "transfer", amount: Number(editSplitTransfer) || 0 },
            ] as SalePayment[]).filter(p => p.amount > 0)
          : [],
      })

      const labelOf = (v: string) => paymentMethods.find(m => m.value === v)?.label || v
      const itemsText = (items: SaleItem[]) => items.map(i => `${i.name} x${i.quantity} @${i.price}`).join(", ")
      logChange("Satışlar", "updated", `Satış ${oldSale.saleCode || ""} düzenlendi (${oldSale.customerName})`, diffFields(
        { total: oldSale.totalAmount, discount: oldSale.discount, paid: oldSale.paid, remaining: oldSale.remaining, method: labelOf(oldSale.paymentMethod), items: itemsText(oldSale.items) },
        { total: updatedSale.totalAmount, discount: updatedSale.discount, paid: updatedSale.paid, remaining: updatedSale.remaining, method: labelOf(updatedSale.paymentMethod), items: itemsText(updatedSale.items) },
        [{ key: "total", label: "Toplam" }, { key: "discount", label: "İskonto" }, { key: "paid", label: "Ödenen" }, { key: "remaining", label: "Kalan" }, { key: "method", label: "Ödeme" }, { key: "items", label: "Ürünler" }]
      ))

      const failed = await runSteps([
        {
          label: "stok güncellemesi",
          run: async () => {
            const ids = Array.from(new Set([...oldSale.items.map(i => i.productId), ...editCart.map(i => i.productId)]))
            await applyStockDeltas(ids.map(productId => {
              const oldQty = oldSale.items.filter(i => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0)
              const newQty = editCart.filter(i => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0)
              return { productId, delta: oldQty - newQty }
            }), `Satış düzenleme ${oldSale.saleCode || ""}`.trim())
          },
        },
        {
          label: "müşteri borç kaydı",
          run: async () => {
            if (!(oldRemaining > 0 || newRemaining > 0)) return
            await deleteDebtsBySource("sale", editingSale.id)
            if (newRemaining > 0) {
              await addDebt(customerId, {
                amount: newRemaining,
                description: `🛒 Satış bakiyesi (düzenlendi): ${editCart.map(i => i.name).join(", ")}`,
                sourceType: "sale",
                sourceId: editingSale.id,
              })
            }
            setCustomers(customers.map((c: any) => {
              if (c.id !== customerId) return c
              const currentDebt = c.totalDebt || c.balance || 0
              const newDebt = currentDebt - Math.max(0, oldRemaining) + Math.max(0, newRemaining)
              return { ...c, totalDebt: newDebt, balance: newDebt }
            }))
          },
        },
        {
          // Eski kasa kayıtları silinmez; net etki yeni duruma getirilir (fark, düzeltme kaydı olarak yazılır)
          label: "kasa kaydı",
          run: () => syncTransactionsToNet(
            "sale",
            editingSale.id,
            isEditGift ? -Math.round(itemsCostTRY(editCart) * 100) / 100 : editPaid,
            { label: `Satış düzenlendi ${oldSale.saleCode || ""}: ${oldSale.customerName}`.trim(), customer: oldSale.customerName, date: localDateStr() }
          ),
        },
      ])

      setSales(sales.map(s => s.id === editingSale.id ? updatedSale : s))
      setShowEditSale(false)
      setEditingSale(null)
      setEditCart([])
      setEditPaymentMethod("cash")
      setEditPaidAmount("")
      reportSteps(failed, "Satış güncellendi.")
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

      // Müşteri kayıtlıysa GÜNCEL müşteri bilgisi kullanılır (telefon sonradan düzeltilmiş olabilir);
      // satış kaydındaki kopya ancak müşteri bulunamazsa kullanılır.
      const live = sale.customerId && customers.length > 0 ? customers.find(c => c.id === sale.customerId) : undefined
      if (live) {
        phone = live.phone || live.phone1 || ""
        customerName = live.name || customerName
      }
      if (!phone && sale.customerPhone) {
        phone = sale.customerPhone
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
      const odemeSekli = paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod
      const odemeDurumu = sale.paymentMethod === "gift"
        ? `\u{1F381} *Bu ürün/ürünler firmamızdan hediyedir.*`
        : sale.remaining > 0
        ? `\u{1F4B5} *Alınan:* ${(sale.paid || 0).toLocaleString("tr-TR")} TL\n\u{23F3} *Kalan Borç:* ${(sale.remaining || 0).toLocaleString("tr-TR")} TL\n\u{1F4B3} *Ödeme Şekli:* ${odemeSekli}`
        : sale.remaining < 0
          ? `\u{2705} *Ödeme:* Tamamlandı\n\u{1F4B0} *Fazla Ödeme (Alacağınız):* ${(-sale.remaining).toLocaleString("tr-TR")} TL\n\u{1F4B3} *Ödeme Şekli:* ${odemeSekli}`
          : `\u{2705} *Ödeme:* Tamamlandı\n\u{1F4B3} *Ödeme Şekli:* ${odemeSekli}`

      const message = renderTemplate(getWhatsAppTemplates().sales, {
        musteri: customerName,
        urunler: items || "Ürün bilgisi yok",
        toplam: (sale.totalAmount || 0).toLocaleString("tr-TR"),
        odeme_durumu: odemeDurumu,
        tarih: sale.date,
      })

      openWhatsApp("90" + cleanPhone, message)
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
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => router.push("/dashboard/inventory")} variant="outline" className="border-slate-600 text-slate-300">
            <Package className="w-4 h-4 mr-2" />Envanteri Aç
          </Button>
          <Button onClick={exportSales} variant="outline" className="border-slate-600 text-slate-300">
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
          <Button onClick={() => setShowNewSale(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingCart className="w-4 h-4 mr-2" />Yeni Satış
          </Button>
        </div>
      </div>

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        title="Barkod Okut — Sepete Ekle"
        onScan={(code) => {
          const lower = code.toLowerCase()
          const found = products.find(p =>
            (p.productCode || "").toLowerCase() === lower ||
            (p.supplierBarcode || "").toLowerCase() === lower ||
            (p.sku || "").toLowerCase() === lower
          )
          if (!found) {
            setSearchTerm(code)
            showToast(`"${code}" için ürün bulunamadı. Envanterde ürünü düzenleyip "Satıcının Barkodu" alanına bu kodu ekleyebilirsiniz.`, "error")
            return
          }
          if (found.quantity <= 0) {
            showToast(`${found.name} — stokta yok!`, "error")
            return
          }
          addToCart(found, 1)
          showToast(`Sepete eklendi: ${found.name} (${found.productCode})`, "success")
        }}
      />


      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card onClick={() => setStatKey("all")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Toplam Satış</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-white">{sales.filter(s => s.status !== "cancelled").length}</div></CardContent>
        </Card>
        <Card onClick={() => setStatKey("today")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Bugün</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-400">{sales.filter(s => s.status !== "cancelled" && s.date === localDateStr()).length}</div></CardContent>
        </Card>
        <Card onClick={() => setStatKey("revenue")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Toplam Gelir</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-400">{formatCurrency(sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + (s.paid || 0), 0))}</div></CardContent>
        </Card>
        <Card onClick={() => setStatKey("remaining")} className="cursor-pointer hover:border-slate-500 transition-colors bg-slate-900 border-slate-700">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Bekleyen Tahsilat</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-400">{formatCurrency(sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + Math.max(0, s.remaining || 0), 0))}</div></CardContent>
        </Card>
      </div>

{(() => {
  const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n)
  const defs: Record<string, { title: string; rows: StatRow[]; summary?: string }> = {}
  const active = sales.filter(s => s.status !== "cancelled")
  const rowOf = (s: Sale, right: string, rightClass: string): StatRow => ({
    id: s.id,
    title: s.customerName,
    tag: s.saleCode,
    subtitle: `${s.date} • ${s.items.map(i => i.name).join(", ")}`,
    right,
    rightClass,
    onClick: () => { setStatKey(null); setViewSale(s) },
  })
  defs.all = { title: "Tüm Satışlar", rows: active.map(s => rowOf(s, money(s.totalAmount), "text-white")) }
  defs.today = { title: "Bugünkü Satışlar", rows: active.filter(s => s.date === localDateStr()).map(s => rowOf(s, money(s.totalAmount), "text-emerald-400")) }
  const paidRows = active.filter(s => (s.paid || 0) > 0)
  defs.revenue = { title: "Tahsil Edilen Satışlar", summary: `Toplam tahsilat: ${money(paidRows.reduce((sum, s) => sum + s.paid, 0))}`, rows: paidRows.map(s => rowOf(s, money(s.paid), "text-green-400")) }
  const remRows = active.filter(s => (s.remaining || 0) > 0)
  defs.remaining = { title: "Tahsilatı Bekleyen Satışlar", summary: `Toplam bekleyen: ${money(remRows.reduce((sum, s) => sum + s.remaining, 0))}`, rows: remRows.map(s => rowOf(s, `Kalan ${money(s.remaining)}`, "text-amber-400")) }
  const def = statKey ? defs[statKey] : null
  return <StatListDialog open={!!def} onOpenChange={(o) => { if (!o) setStatKey(null) }} title={def?.title || ""} rows={def?.rows || []} summary={def?.summary} />
})()}

      {/* New Sale Dialog */}
      <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">🛒 Yeni Satış Oluştur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">👤 Müşteri</Label>
              <CustomerPicker
                customers={customers}
                value={selectedCustomer}
                onChange={(id) => setSelectedCustomer(id)}
                placeholder="Müşteri ara (isim, telefon, kod) veya listeden seç..."
              />

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
                const pastSales = sales.filter(s => s.status !== "cancelled" && (s.customerId === selectedCustomer || (!s.customerId && s.customerName === customers.find(c => c.id === selectedCustomer)?.name)))
                if (pastSales.length === 0) return null
                return (
                  <div className="rounded-lg border border-indigo-700/50 bg-indigo-900/10 p-3 text-xs text-slate-400">
                    🕘 Bu müşterinin daha önce {pastSales.length} satışı var (son: {pastSales[0]?.date})
                  </div>
                )
              })()}

              {selectedCustomer && riskInfo && (
                <div className={`rounded-lg border p-3 text-xs ${riskInfo.ageDays >= 30 ? "border-red-700/60 bg-red-900/20 text-red-300" : "border-amber-700/60 bg-amber-900/20 text-amber-300"}`}>
                  ⚠️ Bu müşterinin açık borcu var: <strong>{formatCurrency(riskInfo.debt)}</strong>
                  {riskInfo.oldestDate ? ` (en eski borç ${riskInfo.oldestDate}, ${riskInfo.ageDays} gün önce)` : ""}.
                  {riskInfo.ageDays >= 30 ? " Vadesi geçmiş borç var; yeni vadeli satış yapmadan önce tahsilatı değerlendirin." : ""}
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
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Ürün adı, kod veya kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  title="Barkod okut — ürün doğrudan sepete eklenir"
                  onClick={() => setIsScannerOpen(true)}
                  className="border-slate-600 text-amber-400 shrink-0"
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">📦 Envanter Kataloğu</Label>
              <span className="text-xs text-slate-500">{filteredProducts.length} ürün</span>
            </div>
            {filteredProducts.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-700 rounded-lg">
                {products.length === 0
                  ? "Envanterde ürün yok. Önce Envanter sayfasından ürün ekleyin."
                  : "Aramanızla eşleşen ürün bulunamadı."}
              </p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {filteredProducts.map(product => (
                <div key={product.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="w-full h-20 object-cover rounded mb-2 border border-slate-700"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  ) : null}
                  <div className="text-sm font-medium text-white">{product.name}</div>
                  {product.productCode && <div className="text-[10px] font-mono text-amber-400">{product.productCode}</div>}
                  <div className={`text-xs ${product.quantity <= 0 ? "text-red-400" : "text-slate-400"}`}>
                    {formatCurrency(product.salePrice)} | 📦 Stok: {product.quantity}{product.quantity <= 0 && " (tükendi)"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={product.quantity}
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
                        <Input
                          value={item.imei || ""}
                          onChange={(e) => setCart(cart.map(c => c.productId === item.productId ? { ...c, imei: e.target.value } : c))}
                          placeholder="IMEI / Seri No (opsiyonel)"
                          className="mt-1 h-7 w-44 bg-slate-900 border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-emerald-400">{formatCurrency(item.price * item.quantity)}</div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button size="icon" variant="outline" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => removeFromCart(item.productId)}>
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
                  {marginStatus && (
                    <p className="text-xs text-red-400">
                      {marginStatus === "loss"
                        ? `⚠️ Satış fiyatı maliyetin (${formatCurrency(cartCost)}) altında!`
                        : `⚠️ Kâr oranı minimum %${minMarginPercent}'in altında.`}
                      {isManager ? " Kaydetmek için onay istenecek." : " Bu satışı yalnızca yönetici onaylayabilir."}
                    </p>
                  )}
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
                        {remaining >= 0 ? (
                          <span className="text-amber-400">⏳ Kalan Borç: {formatCurrency(remaining)}</span>
                        ) : (
                          <span className="text-cyan-400">💰 Fazla Ödeme (Alacaklı): {formatCurrency(-remaining)}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {isSplit && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">🔀 Ödeme Dağılımı (TL)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="number" inputMode="decimal" placeholder="Nakit" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                        <Input type="number" inputMode="decimal" placeholder="Kart" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                        <Input type="number" inputMode="decimal" placeholder="Havale" value={splitTransfer} onChange={(e) => setSplitTransfer(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">💵 Alınan: {formatCurrency(cashPaid)}</span>
                        {remaining >= 0 ? (
                          <span className="text-amber-400">⏳ Kalan Borç: {formatCurrency(remaining)}</span>
                        ) : (
                          <span className="text-cyan-400">💰 Fazla Ödeme (Alacaklı): {formatCurrency(-remaining)}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {isInstallment && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">📅 Taksit Planı</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="number" inputMode="decimal" placeholder="Peşinat" value={instDown} onChange={(e) => setInstDown(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                        <Input type="number" min={1} max={24} placeholder="Taksit sayısı" value={instCount} onChange={(e) => setInstCount(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                        <Input type="date" value={instFirstDate} onChange={(e) => setInstFirstDate(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                      </div>
                      <p className="text-xs text-slate-500">Peşinat düşüldükten sonra kalan tutar aylık eşit taksitlere bölünür; ilk vade tarihi boşsa 30 gün sonradır. Faiz uygulanmaz.</p>
                      {installmentPlan.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {installmentPlan.map(i => (
                            <div key={i.no} className="flex justify-between text-xs p-1.5 bg-slate-800 rounded">
                              <span className="text-slate-400">{i.no}. taksit — {i.dueDate}</span>
                              <span className="text-amber-400">{formatCurrency(i.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!isGiftSale && (
                    <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                      <Label className="text-slate-300">🔄 Takas (opsiyonel)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Cihaz adı" value={tradeName} onChange={(e) => setTradeName(e.target.value)} className="bg-slate-900 border-slate-600 text-white col-span-2" />
                        <Input type="number" inputMode="decimal" placeholder="Değer (TL)" value={tradeValue} onChange={(e) => setTradeValue(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                      </div>
                      <Input placeholder="IMEI (opsiyonel)" value={tradeImei} onChange={(e) => setTradeImei(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                      {tradeVal > 0 && <p className="text-xs text-purple-300">Takas değeri {formatCurrency(tradeVal)} ödemeden düşülür; cihaz "İkinci El" olarak stoğa girer.</p>}
                    </div>
                  )}
                  {!isGiftSale && (
                    <div className="space-y-1 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                      <Label className="text-slate-300 text-xs">Ek maliyet (kargo vb., TL) — sadece kâr hesabında</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="number" inputMode="decimal" placeholder="0" value={extraCostInput} onChange={(e) => setExtraCostInput(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                        <Input placeholder="Not (ops.)" value={extraCostNoteInput} onChange={(e) => setExtraCostNoteInput(e.target.value)} className="bg-slate-900 border-slate-600 text-white col-span-2" />
                      </div>
                      {commissionAmount > 0 && <p className="text-xs text-slate-500">Kart komisyonu (%{cardCommissionPercent}): {formatCurrency(commissionAmount)} otomatik eklenir.</p>}
                      {cartCost > 0 && <p className="text-xs text-slate-400">Tahmini gerçek kâr: <span className={realProfit >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(realProfit)}</span> (maliyet {formatCurrency(cartCost)}{extraCostTotal > 0 ? ` + ek maliyet ${formatCurrency(extraCostTotal)}` : ""})</p>}
                    </div>
                  )}
                  {remaining > 0 && paymentMethod !== "partial" && !isSplit && (
                    <div className="text-sm text-amber-400">⏳ Kalan Borç: {formatCurrency(remaining)}</div>
                  )}
                  <Button
                    onClick={handleCompleteSale}
                    disabled={savingSale || !selectedCustomer || cart.length === 0 || Number(saleDiscount) > maxCartDiscount}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingSale ? "⏳ Kaydediliyor..." : <>✅ {paymentMethod === "unpaid" ? "Satışı Kaydet (Ödenmedi)" : "Satışı Tamamla"}</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Satış Detayı (karekod / arama ile açılır) */}
      <Dialog open={!!viewSale} onOpenChange={(o) => { if (!o) { setViewSale(null); setRefundQty({}) } }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">🛒 Satış {viewSale?.saleCode || ""}</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2 flex-wrap">
                <span className="text-white font-medium">{viewSale.customerName}</span>
                {viewSale.customerCode && <span className="font-mono text-xs text-slate-400">{viewSale.customerCode}</span>}
              </div>
              <div className="text-xs text-slate-400">📅 {viewSale.date} | 💳 {paymentMethods.find(m => m.value === viewSale.paymentMethod)?.label || viewSale.paymentMethod}</div>
              <div className="space-y-1">
                {viewSale.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-800 rounded gap-2">
                    <span>{i.name} <span className="text-slate-500">x{i.quantity}</span>{i.imei && <span className="block text-[11px] font-mono text-slate-500">IMEI: {i.imei}</span>}</span>
                    <span>{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-slate-700 pt-2">
                {viewSale.discount > 0 && <div className="flex justify-between text-slate-400"><span>İskonto</span><span>-{formatCurrency(viewSale.discount)}</span></div>}
                <div className="flex justify-between font-bold"><span>Toplam</span><span>{formatCurrency(viewSale.totalAmount)}</span></div>
                {viewSale.paymentMethod !== "gift" && <div className="flex justify-between text-emerald-400"><span>Alınan</span><span>{formatCurrency(viewSale.paid)}</span></div>}
                {viewSale.paymentMethod !== "gift" && viewSale.remaining > 0 && <div className="flex justify-between text-amber-400"><span>Kalan Borç</span><span>{formatCurrency(viewSale.remaining)}</span></div>}
                {viewSale.paymentMethod === "gift" && <div className="text-purple-300">🎁 Eşantiyon (bedelsiz)</div>}
                {viewSale.status === "cancelled" && <div className="text-slate-400">🚫 İptal edildi</div>}
              </div>

              {viewSale.status !== "cancelled" && (() => {
                const cost = round2(viewSale.items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0))
                if (cost <= 0 && !(viewSale.extraCost || 0)) return null
                const extra = viewSale.extraCost || 0
                const profit = viewSale.paymentMethod === "gift" ? -cost : round2(viewSale.totalAmount - cost - extra)
                return (
                  <div className="text-xs p-2 rounded bg-slate-800 border border-slate-700 space-y-0.5">
                    <div className="flex justify-between text-slate-400"><span>Mal maliyeti</span><span>{formatCurrency(cost)}</span></div>
                    {extra > 0 && <div className="flex justify-between text-slate-400"><span>Ek maliyet{viewSale.extraCostNote ? ` (${viewSale.extraCostNote})` : ""}</span><span>{formatCurrency(extra)}</span></div>}
                    <div className="flex justify-between font-medium"><span className="text-slate-300">Gerçek kâr</span><span className={profit >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(profit)}</span></div>
                  </div>
                )
              })()}

              {(viewSale.payments || []).length > 0 && (
                <div className="text-xs text-slate-400">
                  🔀 Ödeme dağılımı: {(viewSale.payments || []).map(p => `${p.method === "cash" ? "Nakit" : p.method === "card" ? "Kart" : "Havale"} ${formatCurrency(p.amount)}`).join(" • ")}
                </div>
              )}
              {viewSale.tradeIn && (
                <div className="text-xs text-purple-300">
                  🔄 Takas: {viewSale.tradeIn.name}{viewSale.tradeIn.imei ? ` (IMEI ${viewSale.tradeIn.imei})` : ""} — {formatCurrency(viewSale.tradeIn.value)} ödemeden düşüldü
                </div>
              )}
              {(viewSale.installments || []).length > 0 && (
                <div className="space-y-1">
                  <div className="text-slate-300 font-medium">📅 Taksit Planı</div>
                  {(viewSale.installments || []).map(inst => {
                    const done = inst.paidAmount >= inst.amount - 0.01
                    const overdue = !done && inst.dueDate < localDateStr()
                    return (
                      <div key={inst.no} className="flex justify-between text-xs p-1.5 bg-slate-800 rounded">
                        <span className={overdue ? "text-red-400" : "text-slate-400"}>{inst.no}. taksit — {inst.dueDate}{overdue ? " (gecikti)" : ""}</span>
                        <span className={done ? "text-emerald-400" : "text-amber-400"}>
                          {done ? "✓ Ödendi" : `${formatCurrency(inst.amount - inst.paidAmount)} kaldı`}
                        </span>
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-slate-500">Taksit ödemesi almak için: Müşteriler &gt; Borç &gt; Tahsil Et.</p>
                </div>
              )}
              {(viewSale.refunds || []).length > 0 && (
                <div className="space-y-1">
                  <div className="text-slate-300 font-medium">↩️ İadeler</div>
                  {(viewSale.refunds || []).map((r, idx) => (
                    <div key={idx} className="text-xs p-1.5 bg-slate-800 rounded text-slate-400">
                      {r.date} — {r.items.map(i => `${i.name} x${i.quantity}`).join(", ")} • {formatCurrency(r.amount)} ({r.mode === "cash" ? "nakit iade" : "bakiyeye mahsup"})
                    </div>
                  ))}
                </div>
              )}

              {viewSale.status !== "cancelled" && viewSale.paymentMethod !== "gift" && viewSale.paymentMethod !== "installment" && !viewSale.tradeIn && (
                <div className="space-y-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                  <div className="text-slate-300 font-medium">↩️ Kısmi Ürün İadesi</div>
                  {viewSale.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 truncate">{it.name} (en çok {it.quantity})</span>
                      <Input
                        type="number"
                        min={0}
                        max={it.quantity}
                        value={refundQty[idx] ?? ""}
                        onChange={(e) => setRefundQty({ ...refundQty, [idx]: e.target.value })}
                        placeholder="0"
                        className="w-16 h-7 bg-slate-900 border-slate-600 text-white text-xs"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => setRefundMode("cash")} className={`px-2 py-1 rounded border ${refundMode === "cash" ? "border-emerald-600 text-emerald-300" : "border-slate-600 text-slate-400"}`}>Nakit iade</button>
                    <button type="button" onClick={() => setRefundMode("balance")} className={`px-2 py-1 rounded border ${refundMode === "balance" ? "border-emerald-600 text-emerald-300" : "border-slate-600 text-slate-400"}`}>Bakiyeye mahsup</button>
                  </div>
                  <Button size="sm" variant="outline" className="border-amber-600 text-amber-400" onClick={handleRefund}>İadeyi Uygula</Button>
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                <Button size="sm" variant="outline" className="border-green-600 text-green-400" onClick={() => sendWhatsApp(viewSale)}><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => printSaleReceipt(viewSale)}><Printer className="w-3 h-3 mr-1" />Fiş</Button>
                {viewSale.status !== "cancelled" && (
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => { const sl = viewSale; setViewSale(null); openEditSale(sl) }}><Pencil className="w-3 h-3 mr-1" />Düzenle</Button>
                )}
                {isManager && (
                  <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-500/10" onClick={() => { const id = viewSale.id; setViewSale(null); handleDeleteSale(id) }}><Trash2 className="w-3 h-3 mr-1" />Kalıcı Sil</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={showEditSale} onOpenChange={setShowEditSale}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">✏️ Satış Düzenle #{editingSale?.saleCode || ""}</DialogTitle></DialogHeader>
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
                      <Button size="icon" variant="outline" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateEditQuantity(item.productId, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => updateEditQuantity(item.productId, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="outline" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => removeFromEditCart(item.productId)}>
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
                    <div className="text-xs text-slate-400">{formatCurrency(product.salePrice)} | 📦 {product.quantity}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        min={1}
                        max={product.quantity}
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
                  {paymentMethods.filter(m => m.value !== "installment").map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-white">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editPaymentMethod === "split" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">🔀 Ödeme Dağılımı (TL)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" inputMode="decimal" placeholder="Nakit" value={editSplitCash} onChange={(e) => setEditSplitCash(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                    <Input type="number" inputMode="decimal" placeholder="Kart" value={editSplitCard} onChange={(e) => setEditSplitCard(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                    <Input type="number" inputMode="decimal" placeholder="Havale" value={editSplitTransfer} onChange={(e) => setEditSplitTransfer(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
                  </div>
                  <div className="text-sm text-slate-400">💵 Alınan: {formatCurrency(editPaid)} {editRemaining > 0 ? `• ⏳ Kalan: ${formatCurrency(editRemaining)}` : ""}</div>
                </div>
              )}
              {isEditGift && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
                  🎁 Bu satış bedelsiz (eşantiyon) olarak işaretlenecek. Müşteriden ücret alınmayacak, borç oluşmayacak.
                </div>
              )}
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
                    {editRemaining >= 0 ? (
                      <span className="text-amber-400">⏳ Kalan Borç: {formatCurrency(editRemaining)}</span>
                    ) : (
                      <span className="text-cyan-400">💰 Fazla Ödeme (Alacaklı): {formatCurrency(-editRemaining)}</span>
                    )}
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
              {sales.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE).map(sale => (
                <div key={sale.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{sale.customerName}</span>
                        {sale.saleCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800">{sale.saleCode}</span>
                        )}
                        {sale.customerCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">{sale.customerCode}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">📅 {sale.date} | 📦 {(sale.items || []).length} ürün | 💳 {paymentMethods.find(m => m.value === sale.paymentMethod)?.label || sale.paymentMethod}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</div>
                      <Badge className={sale.status === "cancelled" ? "bg-slate-600/30 text-slate-400" : sale.paymentMethod === "gift" ? "bg-purple-600/20 text-purple-300" : sale.remaining > 0 ? "bg-amber-600/20 text-amber-400" : (sale.remaining < 0 ? "bg-cyan-600/20 text-cyan-400" : (sale.paid === 0 && sale.totalAmount > 0 ? "bg-red-600/20 text-red-400" : "bg-emerald-600/20 text-emerald-400"))}>
                        {sale.status === "cancelled" ? "🚫 İptal Edildi" : sale.paymentMethod === "gift" ? "🎁 Eşantiyon" : sale.remaining > 0 ? `⏳ Kısmi - Kalan: ${formatCurrency(sale.remaining)}` : (sale.remaining < 0 ? `💰 Alacaklı: ${formatCurrency(-sale.remaining)}` : (sale.paid === 0 && sale.totalAmount > 0 ? "❌ Ödenmedi" : "✅ Tamamlandı"))}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-green-600 text-green-400 hover:text-green-300 hover:bg-green-500/10" 
                      onClick={() => sendWhatsApp(sale)}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />WhatsApp
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-500/10" 
                      onClick={() => setViewSale(sale)}
                    >
                      <Eye className="w-3 h-3 mr-1" />Detay / İade
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-blue-600 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" 
                      onClick={() => openEditSale(sale)}
                      disabled={sale.status === "cancelled"}
                    >
                      <Pencil className="w-3 h-3 mr-1" />Düzenle
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-500/10" 
                      onClick={() => printSaleReceipt(sale)}
                    >
                      <Printer className="w-3 h-3 mr-1" />Fiş
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-500/10" 
                      onClick={() => printRecordLabel({ kind: "sale", id: sale.id, code: sale.saleCode || "", title: sale.customerName, lines: [sale.date, `${sale.items.length} ürün • ${formatCurrency(sale.totalAmount)}`] })}
                    >
                      <QrCode className="w-3 h-3 mr-1" />Etiket
                    </Button>
                    {sale.status !== "cancelled" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-indigo-600 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" 
                      onClick={() => handleCreateWarranty(sale)}
                    >
                      <Shield className="w-3 h-3 mr-1" />Garanti
                    </Button>
                    )}
                    {sale.status !== "cancelled" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-amber-600 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" 
                      onClick={() => handleCancelSale(sale.id)}
                    >
                      <Ban className="w-3 h-3 mr-1" />İptal
                    </Button>
                    )}
                  </div>
                </div>
              ))}
              <Pagination
                currentPage={listPage}
                totalPages={Math.ceil(sales.length / PAGE_SIZE)}
                goToPage={(p) => setListPage(Math.max(1, Math.min(p, Math.ceil(sales.length / PAGE_SIZE))))}
                goToNext={() => setListPage(p => Math.min(p + 1, Math.ceil(sales.length / PAGE_SIZE)))}
                goToPrev={() => setListPage(p => Math.max(p - 1, 1))}
                totalItems={sales.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
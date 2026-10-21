import { dbDateToLocal } from "@/lib/dates"
import { supabase, isMissingColumnError, stripColumns, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface SaleItem {
  productId: string
  name: string
  price: number
  purchasePrice?: number
  quantity: number
  imei?: string // ikinci el telefon / seri no (opsiyonel)
}

export interface SalePayment {
  method: "cash" | "card" | "transfer"
  amount: number
}

// Taksit planı: her taksit için vade tarihi, tutar ve ne kadarının ödendiği
export interface Installment {
  no: number
  dueDate: string
  amount: number
  paidAmount: number
}

export interface SaleRefund {
  date: string
  mode: "cash" | "balance"
  amount: number
  items: { name: string; quantity: number }[]
}

// Takas: müşteriden alınan cihaz (satış bedelinden düşülür, ikinci el stoğa girer)
export interface TradeIn {
  name: string
  imei?: string
  value: number
  productId?: string
}

export interface Sale {
  id: string
  saleCode?: string
  customerCode?: string
  customerId: string
  customerName: string
  customerPhone: string
  items: SaleItem[]
  totalAmount: number
  discount: number
  paid: number
  remaining: number
  paymentMethod: string
  date: string
  status: "completed" | "cancelled"
  payments?: SalePayment[]
  installments?: Installment[]
  refunds?: SaleRefund[]
  tradeIn?: TradeIn | null
  extraCost?: number // kart komisyonu, kargo vb. (sadece kâr hesabında)
  extraCostNote?: string
}

function fromRow(row: any): Sale {
  return {
    id: row.id,
    saleCode: row.sale_code ?? "",
    customerCode: row.customer_code ?? "",
    customerId: row.customer_id ?? "",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_price) || 0,
    discount: Number(row.discount) || 0,
    paid: Number(row.paid_amount) || 0,
    remaining: Number(row.remaining_amount) || 0,
    paymentMethod: row.payment_method ?? "cash",
    date: row.sale_date ?? dbDateToLocal(row.created_at),
    status: (row.sale_status as Sale["status"]) ?? "completed",
    payments: Array.isArray(row.payments) ? row.payments : [],
    // NOT: Eski tabloda zaten "installments" adlı bir TAM SAYI sütunu (taksit adedi) vardı; taksit planı bu yüzden
    // ayrı bir "installment_plan" (jsonb) sütununda tutulur.
    installments: Array.isArray(row.installment_plan) ? row.installment_plan : [],
    refunds: Array.isArray(row.refunds) ? row.refunds : [],
    tradeIn: row.trade_in ?? null,
    extraCost: Number(row.extra_cost) || 0,
    extraCostNote: row.extra_cost_note ?? "",
  }
}

function toRow(s: Partial<Sale>) {
  const row: Record<string, unknown> = {}
  if (s.items !== undefined) {
    row.items = s.items
    row.item_name = s.items.map(i => `${i.name} x${i.quantity}`).join(", ").slice(0, 250) || "Satış"
    row.quantity = s.items.reduce((sum, i) => sum + i.quantity, 0)
  }
  if (s.customerId) row.customer_id = s.customerId
  if (s.customerName !== undefined) row.customer_name = s.customerName
  if (s.customerCode !== undefined) row.customer_code = s.customerCode || null
  if (s.customerPhone !== undefined) row.customer_phone = s.customerPhone
  if (s.totalAmount !== undefined) { row.total_price = s.totalAmount; row.unit_price = s.totalAmount }
  if (s.discount !== undefined) row.discount = s.discount
  if (s.paid !== undefined) row.paid_amount = s.paid
  if (s.remaining !== undefined) row.remaining_amount = s.remaining
  if (s.paymentMethod !== undefined) row.payment_method = s.paymentMethod
  if (s.date !== undefined) row.sale_date = s.date || null
  if (s.status !== undefined) row.sale_status = s.status
  if (s.payments !== undefined) row.payments = s.payments
  if (s.installments !== undefined) row.installment_plan = s.installments
  if (s.refunds !== undefined) row.refunds = s.refunds
  if (s.tradeIn !== undefined) row.trade_in = s.tradeIn
  if (s.extraCost !== undefined) row.extra_cost = s.extraCost
  if (s.extraCostNote !== undefined) row.extra_cost_note = s.extraCostNote
  return row
}

export async function fetchSales(): Promise<Sale[]> {
  const data = await fetchAllRows("sales", "created_at", false)

  if ((!data || data.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_sales")) {
    const legacyRaw = localStorage.getItem("yt_sales")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((s: any) => toRow({
            customerName: s.customerName, customerPhone: s.customerPhone, items: s.items || [],
            totalAmount: s.totalAmount, paid: s.paid, remaining: s.remaining,
            paymentMethod: s.paymentMethod, date: s.date, status: s.status,
          }))
          const { data: inserted, error: insertError } = await supabase.from("sales").insert(rows).select("*")
          if (!insertError && inserted) {
            return inserted.map(fromRow)
          }
        }
      } catch {
        // eski veri okunamadıysa sessizce geç
      }
    }
  }

  // Aktarım işareti sadece aktarılacak eski veri kalmadıysa yazılır; aktarım başarısız olduysa bir sonraki açılışta tekrar denenir.
  if (typeof window !== "undefined" && !localStorage.getItem("yt_sales")) localStorage.setItem("yt_migrated_sales", "true")
  return (data || []).map(fromRow)
}

// Sonradan eklenen (isteğe bağlı) sütunlar
const OPTIONAL_SALE_COLUMNS = ["payments", "installment_plan", "refunds", "trade_in", "extra_cost", "extra_cost_note"]

export async function createSale(input: Omit<Sale, "id" | "saleCode">): Promise<Sale> {
  const row = toRow(input)
  // Boş/varsayılan değerleri hiç göndermeyelim: yeni sütunlar olmasa bile sıradan satış kaydedilebilsin
  if (Array.isArray(row.payments) && row.payments.length === 0) delete row.payments
  if (Array.isArray(row.installment_plan) && row.installment_plan.length === 0) delete row.installment_plan
  if (Array.isArray(row.refunds) && row.refunds.length === 0) delete row.refunds
  if (row.trade_in === null) delete row.trade_in
  if (!row.extra_cost) delete row.extra_cost
  if (!row.extra_cost_note) delete row.extra_cost_note
  let { data, error } = await supabase.from("sales").insert(row).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Satış tablosunda yeni sütunlar eksik; bunlar olmadan kaydediliyor. SQL migrasyonlarını çalıştırın.", error.message)
    ;({ data, error } = await supabase.from("sales").insert(stripColumns(row, OPTIONAL_SALE_COLUMNS)).select("*").single())
  }
  if (error) throw error
  const created = fromRow(data)
  logActivity("Satışlar", "created", `${created.customerName} — ${created.totalAmount.toLocaleString("tr-TR")} TL satış eklendi`)
  return created
}

export async function updateSale(id: string, input: Partial<Omit<Sale, "id" | "saleCode">>): Promise<Sale> {
  const row = toRow(input)
  let { data, error } = await supabase.from("sales").update(row).eq("id", id).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Satış tablosunda yeni sütunlar eksik; bunlar olmadan güncelleniyor.", error.message)
    ;({ data, error } = await supabase.from("sales").update(stripColumns(row, OPTIONAL_SALE_COLUMNS)).eq("id", id).select("*").single())
  }
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Satışlar", "updated", `${updated.customerName} satışı güncellendi`)
  return updated
}

export async function deleteSale(id: string): Promise<void> {
  const { data: existing } = await supabase.from("sales").select("customer_name").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("sales").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Satışlar", "deleted", `${existing?.customer_name || "Bir kayıt"} satışı silindi`)
}

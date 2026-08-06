import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface SaleItem {
  productId: number
  name: string
  price: number
  quantity: number
}

export interface Sale {
  id: string
  customerId: string
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

function fromRow(row: any): Sale {
  return {
    id: row.id,
    customerId: "",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_price) || 0,
    paid: Number(row.paid_amount) || 0,
    remaining: Number(row.remaining_amount) || 0,
    paymentMethod: row.payment_method ?? "cash",
    date: row.sale_date ?? (row.created_at ? String(row.created_at).slice(0, 10) : ""),
    status: (row.sale_status as Sale["status"]) ?? "completed",
  }
}

function toRow(s: Partial<Sale>) {
  const row: Record<string, unknown> = {}
  if (s.items !== undefined) {
    row.items = s.items
    row.item_name = s.items.map(i => `${i.name} x${i.quantity}`).join(", ").slice(0, 250) || "Satış"
    row.quantity = s.items.reduce((sum, i) => sum + i.quantity, 0)
  }
  if (s.customerName !== undefined) row.customer_name = s.customerName
  if (s.customerPhone !== undefined) row.customer_phone = s.customerPhone
  if (s.totalAmount !== undefined) { row.total_price = s.totalAmount; row.unit_price = s.totalAmount }
  if (s.paid !== undefined) row.paid_amount = s.paid
  if (s.remaining !== undefined) row.remaining_amount = s.remaining
  if (s.paymentMethod !== undefined) row.payment_method = s.paymentMethod
  if (s.date !== undefined) row.sale_date = s.date || null
  if (s.status !== undefined) row.sale_status = s.status
  return row
}

export async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false })
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
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

  return (data || []).map(fromRow)
}

export async function createSale(input: Omit<Sale, "id">): Promise<Sale> {
  const { data, error } = await supabase.from("sales").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Satışlar", "created", `${created.customerName} — ${created.totalAmount.toLocaleString("tr-TR")} TL satış eklendi`)
  return created
}

export async function updateSale(id: string, input: Partial<Omit<Sale, "id">>): Promise<Sale> {
  const { data, error } = await supabase.from("sales").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Satışlar", "updated", `${updated.customerName} satışı güncellendi`)
  return updated
}

export async function deleteSale(id: string): Promise<void> {
  const { data: existing } = await supabase.from("sales").select("customer_name").eq("id", id).single()
  const { error } = await supabase.from("sales").delete().eq("id", id)
  if (error) throw error
  logActivity("Satışlar", "deleted", `${existing?.customer_name || "Bir kayıt"} satışı silindi`)
}

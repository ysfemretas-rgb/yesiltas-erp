import { supabase, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { logStockMovement } from "@/lib/stockMovements"

export interface InventoryItem {
  id: string
  name: string
  productCode: string
  supplierBarcode?: string
  imageUrl?: string
  sku: string
  category: string
  quantity: number
  minQuantity: number
  purchasePrice: number
  purchaseCurrency: "TRY" | "USD" | "EUR"
  profitMargin: number
  salePrice: number
  supplier: string
  location: string
  // Bu alışta tedarikçiye ödeme yapıldı mı? Tedarikçiler sayfasındaki
  // "borcumuz" ve "sipariş sayısı" artık elle girilmiyor, bu alanlardan
  // otomatik hesaplanıyor.
  paymentStatus: "paid" | "unpaid" | "partial"
  paidAmount: number
  // Bugüne kadar tedarikçiden alınan toplam adet (satılsa bile düşmez) — tedarikçi borcu bundan hesaplanır.
  purchasedQuantity?: number
  imei?: string // ikinci el cihazlar için
}

function fromRow(row: any): InventoryItem {
  return {
    id: row.id,
    name: row.name ?? "",
    productCode: row.product_code ?? "",
    supplierBarcode: row.supplier_barcode ?? "",
    imageUrl: row.image_url ?? "",
    sku: row.sku ?? "",
    category: row.category ?? "",
    quantity: row.quantity ?? 0,
    minQuantity: row.min_stock ?? 0,
    purchasePrice: Number(row.purchase_price) || 0,
    purchaseCurrency: (row.purchase_currency as InventoryItem["purchaseCurrency"]) ?? "TRY",
    profitMargin: Number(row.profit_margin) || 0,
    salePrice: Number(row.sale_price) || 0,
    supplier: row.supplier ?? "",
    location: row.location ?? "",
    paymentStatus: (row.payment_status as InventoryItem["paymentStatus"]) ?? "unpaid",
    paidAmount: Number(row.paid_amount) || 0,
    imei: row.imei ?? "",
    purchasedQuantity: row.total_purchased_qty != null ? Number(row.total_purchased_qty) : (row.quantity ?? 0),
  }
}

function toRow(i: Partial<InventoryItem>) {
  const row: Record<string, unknown> = {}
  if (i.name !== undefined) row.name = i.name
  if (i.sku !== undefined) row.sku = i.sku
  if (i.supplierBarcode !== undefined) row.supplier_barcode = i.supplierBarcode || null
  if (i.imageUrl !== undefined) row.image_url = i.imageUrl || null
  if (i.category !== undefined) row.category = i.category
  if (i.quantity !== undefined) row.quantity = i.quantity
  if (i.minQuantity !== undefined) row.min_stock = i.minQuantity
  if (i.purchasePrice !== undefined) row.purchase_price = i.purchasePrice
  if (i.purchaseCurrency !== undefined) row.purchase_currency = i.purchaseCurrency
  if (i.profitMargin !== undefined) row.profit_margin = i.profitMargin
  if (i.salePrice !== undefined) row.sale_price = i.salePrice
  if (i.supplier !== undefined) row.supplier = i.supplier
  if (i.location !== undefined) row.location = i.location
  if (i.paymentStatus !== undefined) row.payment_status = i.paymentStatus
  if (i.paidAmount !== undefined) row.paid_amount = i.paidAmount
  if (i.purchasedQuantity !== undefined) row.total_purchased_qty = i.purchasedQuantity
  if (i.imei !== undefined) row.imei = i.imei || null
  return row
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const data = await fetchAllRows("inventory", "created_at", false)

  if ((!data || data.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_inventory")) {
    const legacyRaw = localStorage.getItem("yt_inventory")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((it: any) => toRow({
            name: it.name, sku: it.sku, category: it.category, quantity: it.quantity,
            minQuantity: it.minQuantity, purchasePrice: it.purchasePrice, purchaseCurrency: it.purchaseCurrency,
            profitMargin: it.profitMargin, salePrice: it.salePrice, supplier: it.supplier, location: it.location,
          }))
          const { data: inserted, error: insertError } = await supabase.from("inventory").insert(rows).select("*")
          if (!insertError && inserted) {
            return inserted.map(fromRow)
          }
        }
      } catch {
        // eski veri okunamadıysa sessizce geç
      }
    }
  }

  if (typeof window !== "undefined") localStorage.setItem("yt_migrated_inventory", "true")
  return (data || []).map(fromRow)
}

export async function createInventoryItemsBulk(inputs: Omit<InventoryItem, "id" | "productCode">[]): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").insert(inputs.map(i => toRow({ ...i, purchasedQuantity: i.purchasedQuantity ?? i.quantity }))).select("*")
  if (error) throw error
  const created = (data || []).map(fromRow)
  logActivity("Envanter", "created", `Excel ile ${created.length} ürün toplu eklendi`)
  return created
}

export async function createInventoryItem(input: Omit<InventoryItem, "id" | "productCode">): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory").insert(toRow({ ...input, purchasedQuantity: input.purchasedQuantity ?? input.quantity })).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Envanter", "created", `${created.name} eklendi`)
  return created
}

export async function updateInventoryItem(id: string, input: Partial<Omit<InventoryItem, "id" | "productCode">>): Promise<InventoryItem> {
  const { data, error } = await supabase.from("inventory").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Envanter", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { data: existing } = await supabase.from("inventory").select("name").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("inventory").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Envanter", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

// Stoğu göreli (+/-) olarak, veritabanı tarafında atomik değiştirir. İki kişi aynı anda
// satış yaparsa eski "oku, hesapla, yaz" yöntemi birinin düşüşünü eziyordu.
// Önce supabase-fixes-v2-migration.sql ile gelen adjust_inventory_quantity fonksiyonu
// kullanılır; o yoksa eski yönteme düşer.
export async function adjustInventoryQuantity(id: string, delta: number, reason: string = "Stok değişimi", productName: string = ""): Promise<number | null> {
  if (!delta) return null
  let result: number | null = null
  const { data, error } = await supabase.rpc("adjust_inventory_quantity", { p_id: id, p_delta: delta })
  if (!error && data !== null && data !== undefined) {
    result = Number(Array.isArray(data) ? data[0] : data)
  } else {
    const { data: row, error: readErr } = await supabase.from("inventory").select("quantity, name").eq("id", id).single()
    if (readErr || !row) throw readErr || new Error("Ürün bulunamadı")
    const next = Math.max(0, (row.quantity ?? 0) + delta)
    const { error: upErr } = await supabase.from("inventory").update({ quantity: next }).eq("id", id)
    if (upErr) throw upErr
    if (!productName) productName = row.name ?? ""
    result = next
  }
  // Geçmiş kaydı (hata verirse ana işlemi bozmaz)
  logStockMovement(id, productName, delta, reason)
  return result
}

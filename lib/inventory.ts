import { supabase, isMissingColumnError, stripColumns, fetchAllRows } from "@/lib/supabase"
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

  // Aktarım işareti sadece aktarılacak eski veri kalmadıysa yazılır; aktarım başarısız olduysa bir sonraki açılışta tekrar denenir.
  if (typeof window !== "undefined" && !localStorage.getItem("yt_inventory")) localStorage.setItem("yt_migrated_inventory", "true")
  return (data || []).map(fromRow)
}

export async function createInventoryItemsBulk(inputs: Omit<InventoryItem, "id" | "productCode">[]): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").insert(inputs.map(i => toRow({ ...i, purchasedQuantity: i.purchasedQuantity ?? i.quantity }))).select("*")
  if (error) throw error
  const created = (data || []).map(fromRow)
  logActivity("Envanter", "created", `Excel ile ${created.length} ürün toplu eklendi`)
  return created
}

const OPTIONAL_INVENTORY_COLUMNS = ["imei", "total_purchased_qty"]

export async function createInventoryItem(input: Omit<InventoryItem, "id" | "productCode">): Promise<InventoryItem> {
  const row = toRow({ ...input, purchasedQuantity: input.purchasedQuantity ?? input.quantity })
  if (!row.imei) delete row.imei
  let { data, error } = await supabase.from("inventory").insert(row).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Envanter tablosunda yeni sütunlar eksik; bunlar olmadan kaydediliyor. SQL migrasyonlarını çalıştırın.", error.message)
    ;({ data, error } = await supabase.from("inventory").insert(stripColumns(row, OPTIONAL_INVENTORY_COLUMNS)).select("*").single())
  }
  if (error) throw error
  const created = fromRow(data)
  logActivity("Envanter", "created", `${created.name} eklendi`)
  return created
}

export async function updateInventoryItem(id: string, input: Partial<Omit<InventoryItem, "id" | "productCode">>): Promise<InventoryItem> {
  const row = toRow(input)
  let { data, error } = await supabase.from("inventory").update(row).eq("id", id).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Envanter tablosunda yeni sütunlar eksik; bunlar olmadan güncelleniyor.", error.message)
    ;({ data, error } = await supabase.from("inventory").update(stripColumns(row, OPTIONAL_INVENTORY_COLUMNS)).eq("id", id).select("*").single())
  }
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

export class InsufficientStockError extends Error {
  constructor(message = "Yetersiz stok") {
    super(message)
    this.name = "InsufficientStockError"
  }
}

// "Fonksiyon veritabanında yok" hatası mı? (Migrasyon henüz çalıştırılmamışsa eski yönteme düşülür;
// başka her hata yukarıya iletilir — eskiden her hatada sessizce eski yönteme düşülüyordu.)
function isMissingFunction(err: any): boolean {
  const msg = String(err?.message || "")
  return err?.code === "PGRST202" || err?.code === "42883" || msg.includes("Could not find the function") || msg.includes("does not exist")
}

// Stoğu göreli (+/-) olarak, veritabanı tarafında atomik değiştirir.
// strict=true ve delta<0 ise stok yetersizse işlem REDDEDİLİR (InsufficientStockError); satış gibi
// stoktan düşen işlemler bunu kullanır. Böylece iki kişi aynı son ürünü satamaz.
// supabase-fixes-v2/v6 migrasyonlarındaki fonksiyonlar kullanılır; yoksa istemci tarafı kontrole düşer.
// Stoktan KONTROLLÜ düşme (satış gibi): önce güncel stok okunur; yeterliyse "stok hâlâ aynıysa" koşuluyla
// güncellenir. İki kişi aynı anda satarsa ikincisi koşulu tutturamaz ve yeniden dener / reddedilir.
// Bu yöntem hiçbir SQL fonksiyonuna bağlı değildir ve stoğu SIFIRA düşürmeye (son ürünü satmaya) izin verir.
async function decrementStockChecked(id: string, need: number, productName: string): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row, error } = await supabase.from("inventory").select("quantity, name").eq("id", id).single()
    if (error || !row) throw error || new Error("Ürün bulunamadı")
    const name = productName || row.name || "Ürün"
    const current = row.quantity === null || row.quantity === undefined ? null : Number(row.quantity)
    const q = current ?? 0
    if (q < need) {
      throw new InsufficientStockError(`${name} için yeterli stok yok (sistemdeki güncel stok: ${q}, istenen: ${need}).`)
    }
    let upd = supabase.from("inventory").update({ quantity: q - need }).eq("id", id)
    upd = current === null ? upd.is("quantity", null) : upd.eq("quantity", q)
    const { data: updated, error: upErr } = await upd.select("quantity")
    if (upErr) throw upErr
    if (updated && updated.length > 0) return Number(updated[0].quantity)
    // Bu arada başka bir işlem stoğu değiştirdi: baştan oku ve tekrar dene
  }
  throw new Error(`${productName || "Ürün"} stoğu aynı anda başka bir işlemle değiştirildi; lütfen tekrar deneyin.`)
}

// Stoğu göreli (+/-) olarak değiştirir. strict=true ve delta<0 ise stok yetersizse işlem REDDEDİLİR
// (InsufficientStockError); satış gibi stoktan düşen işlemler bunu kullanır. Artış ve diğer değişimler
// veritabanındaki atomik fonksiyonu (supabase-fixes-v2) kullanır; yoksa okuyup yazma yöntemine düşülür.
export async function adjustInventoryQuantity(
  id: string,
  delta: number,
  reason: string = "Stok değişimi",
  productName: string = "",
  strict: boolean = false
): Promise<number | null> {
  if (!delta) return null
  let result: number | null = null

  if (strict && delta < 0) {
    result = await decrementStockChecked(id, -delta, productName)
    logStockMovement(id, productName, delta, reason)
    return result
  }

  const { data, error } = await supabase.rpc("adjust_inventory_quantity", { p_id: id, p_delta: delta })
  if (!error && data !== null && data !== undefined) {
    result = Number(Array.isArray(data) ? data[0] : data)
  } else if (error && !isMissingFunction(error)) {
    throw error
  } else {
    // Fonksiyon yok (migrasyon çalıştırılmamış): okuyup yazma yöntemi
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

// Aynı IMEI'ye sahip, hâlâ stokta (adedi > 0) olan başka bir kayıt var mı? Varsa döndürür.
export async function findActiveImeiConflict(imei: string, excludeId?: string): Promise<{ id: string; name: string; productCode: string } | null> {
  const value = (imei || "").trim()
  if (!value) return null
  let q = supabase.from("inventory").select("id, name, product_code").eq("imei", value).gt("quantity", 0).limit(1)
  if (excludeId) q = q.neq("id", excludeId)
  const { data, error } = await q
  if (error) {
    // imei kolonu yoksa (migrasyon çalışmadıysa) kontrol atlanır
    console.error("IMEI kontrolü yapılamadı:", error)
    return null
  }
  return data && data[0] ? { id: data[0].id, name: data[0].name, productCode: data[0].product_code ?? "" } : null
}

// Tüm ürünlerin minimum stok adedini toplu değiştirir (Ayarlar > Envanter Minimum Stok Adedi > "Tüm ürünlere uygula").
// Güncellenen ürün sayısını döndürür.
export async function setAllMinQuantity(min: number): Promise<number> {
  const value = Math.max(0, Math.floor(Number(min) || 0))
  const rows = await fetchAllRows("inventory", "created_at", false)
  const ids: string[] = rows.map((r: any) => r.id)
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const { error } = await supabase.from("inventory").update({ min_stock: value }).in("id", chunk)
    if (error) throw error
  }
  logActivity("Envanter", "updated", `Tüm ürünlerin minimum stok adedi ${value} yapıldı (${ids.length} ürün)`)
  return ids.length
}

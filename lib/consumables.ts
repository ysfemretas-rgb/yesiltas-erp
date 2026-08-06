import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Consumable {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  purchasePrice: number
  purchaseCurrency: "TRY" | "USD" | "EUR"
  supplier: string
  lastRestocked: string
}

function fromRow(row: any): Consumable {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "",
    currentStock: Number(row.quantity) || 0,
    minStock: Number(row.min_stock) || 0,
    unit: row.unit ?? "adet",
    purchasePrice: Number(row.unit_price) || 0,
    purchaseCurrency: (row.purchase_currency as Consumable["purchaseCurrency"]) ?? "TRY",
    supplier: row.supplier ?? "",
    lastRestocked: row.last_restocked ?? "",
  }
}

function toRow(c: Partial<Consumable>) {
  const row: Record<string, unknown> = {}
  if (c.name !== undefined) row.name = c.name
  if (c.category !== undefined) row.category = c.category
  if (c.currentStock !== undefined) row.quantity = c.currentStock
  if (c.minStock !== undefined) row.min_stock = c.minStock
  if (c.unit !== undefined) row.unit = c.unit
  if (c.purchasePrice !== undefined) row.unit_price = c.purchasePrice
  if (c.purchaseCurrency !== undefined) row.purchase_currency = c.purchaseCurrency
  if (c.supplier !== undefined) row.supplier = c.supplier
  if (c.lastRestocked !== undefined) row.last_restocked = c.lastRestocked || null
  return row
}

export async function fetchConsumables(): Promise<Consumable[]> {
  const { data, error } = await supabase.from("consumables").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_consumables")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((c: any) => toRow({
            name: c.name, category: c.category, currentStock: c.currentStock, minStock: c.minStock,
            unit: c.unit, purchasePrice: c.purchasePrice, purchaseCurrency: c.purchaseCurrency,
            supplier: c.supplier, lastRestocked: c.lastRestocked,
          }))
          const { data: inserted, error: insertError } = await supabase.from("consumables").insert(rows).select("*")
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

export async function createConsumable(input: Omit<Consumable, "id">): Promise<Consumable> {
  const { data, error } = await supabase.from("consumables").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Sarf Malzeme", "created", `${created.name} eklendi`)
  return created
}

export async function updateConsumable(id: string, input: Partial<Omit<Consumable, "id">>): Promise<Consumable> {
  const { data, error } = await supabase.from("consumables").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Sarf Malzeme", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteConsumable(id: string): Promise<void> {
  const { data: existing } = await supabase.from("consumables").select("name").eq("id", id).single()
  const { error } = await supabase.from("consumables").delete().eq("id", id)
  if (error) throw error
  logActivity("Sarf Malzeme", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

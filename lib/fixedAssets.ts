import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface FixedAsset {
  id: string
  name: string
  category: string
  quantity: number
  purchasePrice: number
  purchaseCurrency: "TRY" | "USD" | "EUR"
  purchaseDate: string
  location: string
  notes: string
}

function fromRow(row: any): FixedAsset {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "",
    quantity: row.quantity ?? 1,
    purchasePrice: Number(row.purchase_price) || 0,
    purchaseCurrency: (row.purchase_currency as FixedAsset["purchaseCurrency"]) ?? "TRY",
    purchaseDate: row.purchase_date ?? "",
    location: row.location ?? "",
    notes: row.notes ?? "",
  }
}

function toRow(a: Partial<FixedAsset>) {
  const row: Record<string, unknown> = {}
  if (a.name !== undefined) row.name = a.name
  if (a.category !== undefined) row.category = a.category
  if (a.quantity !== undefined) row.quantity = a.quantity
  if (a.purchasePrice !== undefined) row.purchase_price = a.purchasePrice
  if (a.purchaseCurrency !== undefined) row.purchase_currency = a.purchaseCurrency
  if (a.purchaseDate !== undefined) row.purchase_date = a.purchaseDate || null
  if (a.location !== undefined) row.location = a.location
  if (a.notes !== undefined) row.notes = a.notes
  return row
}

export async function fetchFixedAssets(): Promise<FixedAsset[]> {
  const { data, error } = await supabase.from("fixed_assets").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function createFixedAsset(input: Omit<FixedAsset, "id">): Promise<FixedAsset> {
  const { data, error } = await supabase.from("fixed_assets").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Demirbaşlar", "created", `${created.name} eklendi`)
  return created
}

// Excel'den toplu yükleme için — her satırı tek tek loglamak yerine tek bir
// özet log kaydı oluşturur.
export async function createFixedAssetsBulk(inputs: Omit<FixedAsset, "id">[]): Promise<FixedAsset[]> {
  const { data, error } = await supabase.from("fixed_assets").insert(inputs.map(toRow)).select("*")
  if (error) throw error
  const created = (data || []).map(fromRow)
  logActivity("Demirbaşlar", "created", `Excel ile ${created.length} demirbaş toplu eklendi`)
  return created
}

export async function updateFixedAsset(id: string, input: Partial<Omit<FixedAsset, "id">>): Promise<FixedAsset> {
  const { data, error } = await supabase.from("fixed_assets").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Demirbaşlar", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteFixedAsset(id: string): Promise<void> {
  const { data: existing } = await supabase.from("fixed_assets").select("name").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("fixed_assets").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Demirbaşlar", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
}

function fromRow(row: any): Product {
  return {
    id: row.id,
    name: row.name ?? "",
    price: Number(row.price) || 0,
    stock: row.stock ?? 0,
    category: row.category ?? "",
  }
}

function toRow(p: Partial<Product>) {
  const row: Record<string, unknown> = {}
  if (p.name !== undefined) row.name = p.name
  if (p.price !== undefined) row.price = p.price
  if (p.stock !== undefined) row.stock = p.stock
  if (p.category !== undefined) row.category = p.category
  return row
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_products")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((p: any) => toRow({ name: p.name, price: p.price, stock: p.stock, category: p.category }))
          const { data: inserted, error: insertError } = await supabase.from("products").insert(rows).select("*")
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

export async function createProduct(input: Omit<Product, "id">): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Satışlar", "created", `Ürün eklendi: ${created.name}`)
  return created
}

export async function updateProduct(id: string, input: Partial<Omit<Product, "id">>): Promise<Product> {
  const { data, error } = await supabase.from("products").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: existing } = await supabase.from("products").select("name").eq("id", id).single()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) throw error
  logActivity("Satışlar", "deleted", `Ürün silindi: ${existing?.name || "Bir ürün"}`)
}

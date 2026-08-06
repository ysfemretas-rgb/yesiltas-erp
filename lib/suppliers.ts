import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  status: "active" | "inactive"
  totalOrders: number
  lastOrderDate: string
}

// Supabase satırı (snake_case) <-> uygulama nesnesi (camelCase) dönüşümü
function fromRow(row: any): Supplier {
  return {
    id: row.id,
    name: row.name ?? "",
    contactPerson: row.contact_person ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    category: row.category ?? "Diğer",
    rating: row.rating ?? 5,
    status: (row.status as "active" | "inactive") ?? "active",
    totalOrders: row.total_orders ?? 0,
    lastOrderDate: row.last_order_date ?? "",
  }
}

function toRow(s: Partial<Supplier>) {
  const row: Record<string, unknown> = {}
  if (s.name !== undefined) row.name = s.name
  if (s.contactPerson !== undefined) row.contact_person = s.contactPerson
  if (s.phone !== undefined) row.phone = s.phone
  if (s.email !== undefined) row.email = s.email
  if (s.address !== undefined) row.address = s.address
  if (s.category !== undefined) row.category = s.category
  if (s.rating !== undefined) row.rating = s.rating
  if (s.status !== undefined) row.status = s.status
  if (s.totalOrders !== undefined) row.total_orders = s.totalOrders
  if (s.lastOrderDate !== undefined) row.last_order_date = s.lastOrderDate || null
  return row
}

// İlk yüklemede: Supabase'deki tedarikçileri getirir. Tablo boşsa ve
// tarayıcıda (eski localStorage sisteminden kalma) veri varsa, bunu BİR KEZ
// Supabase'e aktarır ki kimse eski verisini kaybetmesin.
export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_suppliers")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((s: any) => toRow({
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email,
            address: s.address,
            category: s.category,
            rating: s.rating,
            status: s.status,
            totalOrders: s.totalOrders,
            lastOrderDate: s.lastOrderDate,
          }))
          const { data: inserted, error: insertError } = await supabase.from("suppliers").insert(rows).select("*")
          if (!insertError && inserted) {
            return inserted.map(fromRow)
          }
        }
      } catch {
        // eski veri okunamadıysa sessizce geç, boş listeyle devam et
      }
    }
  }

  return (data || []).map(fromRow)
}

export async function createSupplier(input: Omit<Supplier, "id">): Promise<Supplier> {
  const { data, error } = await supabase.from("suppliers").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Tedarikçiler", "created", `${created.name} eklendi`)
  return created
}

export async function updateSupplier(id: string, input: Partial<Omit<Supplier, "id">>): Promise<Supplier> {
  const { data, error } = await supabase.from("suppliers").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Tedarikçiler", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteSupplier(id: string): Promise<void> {
  const { data: existing } = await supabase.from("suppliers").select("name").eq("id", id).single()
  const { error } = await supabase.from("suppliers").delete().eq("id", id)
  if (error) throw error
  logActivity("Tedarikçiler", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

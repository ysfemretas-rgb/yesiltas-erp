import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Warranty {
  id: string
  deviceName: string
  customerName: string
  customerPhone: string
  warrantyType: string
  startDate: string
  endDate: string
  status: "active" | "expired" | "expiring"
  notes: string
}

function fromRow(row: any): Warranty {
  return {
    id: row.id,
    deviceName: row.item_name ?? "",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    warrantyType: row.warranty_type ?? "",
    startDate: row.warranty_start ?? "",
    endDate: row.warranty_end_date ?? "",
    status: (row.status as Warranty["status"]) ?? "active",
    notes: row.notes ?? "",
  }
}

function toRow(w: Partial<Warranty>) {
  const row: Record<string, unknown> = {}
  if (w.deviceName !== undefined) row.item_name = w.deviceName
  if (w.customerName !== undefined) row.customer_name = w.customerName
  if (w.customerPhone !== undefined) row.customer_phone = w.customerPhone
  if (w.warrantyType !== undefined) row.warranty_type = w.warrantyType
  if (w.startDate !== undefined) row.warranty_start = w.startDate || null
  if (w.endDate !== undefined) row.warranty_end_date = w.endDate || null
  if (w.status !== undefined) row.status = w.status
  if (w.notes !== undefined) row.notes = w.notes
  return row
}

export async function fetchWarranties(): Promise<Warranty[]> {
  const { data, error } = await supabase.from("warranties").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_warranties")) {
    const legacyRaw = localStorage.getItem("yt_warranties")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((w: any) => toRow({
            deviceName: w.deviceName,
            customerName: w.customerName,
            customerPhone: w.customerPhone,
            warrantyType: w.warrantyType,
            startDate: w.startDate,
            endDate: w.endDate,
            status: w.status,
            notes: w.notes,
          }))
          const { data: inserted, error: insertError } = await supabase.from("warranties").insert(rows).select("*")
          if (!insertError && inserted) {
            return inserted.map(fromRow)
          }
        }
      } catch {
        // eski veri okunamadıysa sessizce geç
      }
    }
  }

  if (typeof window !== "undefined") localStorage.setItem("yt_migrated_warranties", "true")
  return (data || []).map(fromRow)
}

export async function createWarranty(input: Omit<Warranty, "id">): Promise<Warranty> {
  const { data, error } = await supabase.from("warranties").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Garantiler", "created", `${created.deviceName} (${created.customerName}) eklendi`)
  return created
}

export async function updateWarranty(id: string, input: Partial<Omit<Warranty, "id">>): Promise<Warranty> {
  const { data, error } = await supabase.from("warranties").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Garantiler", "updated", `${updated.deviceName} (${updated.customerName}) güncellendi`)
  return updated
}

export async function deleteWarranty(id: string): Promise<void> {
  const { data: existing } = await supabase.from("warranties").select("item_name, customer_name").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("warranties").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Garantiler", "deleted", `${existing?.item_name || "Bir kayıt"} (${existing?.customer_name || ""}) silindi`)
}

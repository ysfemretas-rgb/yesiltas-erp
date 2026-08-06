import { supabase } from "@/lib/supabase"

export interface Repair {
  id: string
  customerName: string
  phone1: string
  phone2: string
  device: string
  brand: string
  model: string
  issue: string
  status: "waiting" | "in_progress" | "completed"
  cost: number
  paid: number
  remaining: number
  paymentType: "cash" | "card" | "transfer" | "partial" | "unpaid"
  notes: string
  imei?: string
  createdAt: string
  completedAt?: string
}

function fromRow(row: any): Repair {
  return {
    id: row.id,
    customerName: row.customer_name ?? "",
    phone1: row.phone1 ?? "",
    phone2: row.phone2 ?? "",
    device: row.device_type ?? "Telefon",
    brand: row.brand ?? "",
    model: row.model ?? "",
    issue: row.complaint ?? "",
    status: (row.status as Repair["status"]) ?? "waiting",
    cost: Number(row.cost) || 0,
    paid: Number(row.paid_amount) || 0,
    remaining: Number(row.remaining_amount) || 0,
    paymentType: (row.payment_type as Repair["paymentType"]) ?? "unpaid",
    notes: row.notes ?? "",
    imei: row.imei ?? undefined,
    createdAt: row.received_date ? String(row.received_date).slice(0, 10) : "",
    completedAt: row.completed_date ? String(row.completed_date).slice(0, 10) : undefined,
  }
}

function toRow(r: Partial<Repair>) {
  const row: Record<string, unknown> = {}
  if (r.customerName !== undefined) row.customer_name = r.customerName
  if (r.phone1 !== undefined) row.phone1 = r.phone1
  if (r.phone2 !== undefined) row.phone2 = r.phone2
  if (r.device !== undefined) row.device_type = r.device
  if (r.brand !== undefined) row.brand = r.brand
  if (r.model !== undefined) row.model = r.model
  if (r.issue !== undefined) row.complaint = r.issue
  if (r.status !== undefined) row.status = r.status
  if (r.cost !== undefined) row.cost = r.cost
  if (r.paid !== undefined) row.paid_amount = r.paid
  if (r.remaining !== undefined) row.remaining_amount = r.remaining
  if (r.paymentType !== undefined) row.payment_type = r.paymentType
  if (r.notes !== undefined) row.notes = r.notes
  if (r.imei !== undefined) row.imei = r.imei || null
  if (r.completedAt !== undefined) row.completed_date = r.completedAt || null
  return row
}

export async function fetchRepairs(): Promise<Repair[]> {
  const { data, error } = await supabase.from("devices").select("*").order("received_date", { ascending: false })
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_repairs")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((r: any) => toRow({
            customerName: r.customerName, phone1: r.phone1, phone2: r.phone2, device: r.device,
            brand: r.brand, model: r.model, issue: r.issue, status: r.status, cost: r.cost,
            paid: r.paid, remaining: r.remaining, paymentType: r.paymentType, notes: r.notes,
            imei: r.imei, completedAt: r.completedAt,
          }))
          const { data: inserted, error: insertError } = await supabase.from("devices").insert(rows).select("*")
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

export async function createRepair(input: Omit<Repair, "id">): Promise<Repair> {
  const { data, error } = await supabase.from("devices").insert(toRow(input)).select("*").single()
  if (error) throw error
  return fromRow(data)
}

export async function updateRepair(id: string, input: Partial<Omit<Repair, "id">>): Promise<Repair> {
  const { data, error } = await supabase.from("devices").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteRepair(id: string): Promise<void> {
  const { error } = await supabase.from("devices").delete().eq("id", id)
  if (error) throw error
}

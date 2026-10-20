import { supabase, isMissingColumnError, stripColumns, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

import type { RepairQc, RepairQuote } from "@/lib/repairWorkflow"

export interface RepairPart {
  productId: string
  name: string
  quantity: number
  unitCost: number // TL cinsinden birim alış maliyeti (eklendiği andaki kurla)
}

export interface Repair {
  id: string
  repairCode?: string
  customerCode?: string
  customerName: string
  phone1: string
  phone2: string
  device: string
  brand: string
  model: string
  issue: string
  status: "waiting" | "in_progress" | "completed"
  cost: number
  discount: number
  paid: number
  remaining: number
  paymentType: "cash" | "card" | "transfer" | "partial" | "unpaid" | "gift"
  notes: string
  imei?: string
  createdAt: string
  completedAt?: string
  technician?: string
  parts?: RepairPart[]
  partsCost?: number
  signature?: string
  stage?: string // servis aşaması (bkz. lib/repairWorkflow.ts); boşsa durumdan türetilir
  estimatedDelivery?: string
  qc?: RepairQc | null
  quote?: RepairQuote | null
}

function fromRow(row: any): Repair {
  return {
    id: row.id,
    repairCode: row.repair_code ?? "",
    customerCode: row.customer_code ?? "",
    customerName: row.customer_name ?? "",
    phone1: row.phone1 ?? "",
    phone2: row.phone2 ?? "",
    device: row.device_type ?? "Telefon",
    brand: row.brand ?? "",
    model: row.model ?? "",
    issue: row.complaint ?? "",
    status: (row.status as Repair["status"]) ?? "waiting",
    cost: Number(row.cost) || 0,
    discount: Number(row.discount) || 0,
    paid: Number(row.paid_amount) || 0,
    remaining: Number(row.remaining_amount) || 0,
    paymentType: (row.payment_type as Repair["paymentType"]) ?? "unpaid",
    notes: row.notes ?? "",
    imei: row.imei ?? undefined,
    createdAt: row.received_date ? String(row.received_date).slice(0, 10) : "",
    completedAt: row.completed_date ? String(row.completed_date).slice(0, 10) : undefined,
    technician: row.technician ?? "",
    parts: Array.isArray(row.parts) ? row.parts : [],
    partsCost: Number(row.parts_cost) || 0,
    signature: row.signature ?? "",
    stage: row.stage ?? "",
    estimatedDelivery: row.estimated_delivery ? String(row.estimated_delivery).slice(0, 10) : "",
    qc: row.qc && typeof row.qc === "object" && row.qc.checks ? row.qc : null,
    quote: row.quote && typeof row.quote === "object" && row.quote.status ? row.quote : null,
  }
}

function toRow(r: Partial<Repair>) {
  const row: Record<string, unknown> = {}
  if (r.customerName !== undefined) row.customer_name = r.customerName
  if (r.customerCode !== undefined) row.customer_code = r.customerCode || null
  if (r.phone1 !== undefined) row.phone1 = r.phone1
  if (r.phone2 !== undefined) row.phone2 = r.phone2
  if (r.device !== undefined) row.device_type = r.device
  if (r.brand !== undefined) row.brand = r.brand
  if (r.model !== undefined) row.model = r.model
  if (r.issue !== undefined) row.complaint = r.issue
  if (r.status !== undefined) row.status = r.status
  if (r.cost !== undefined) row.cost = r.cost
  if (r.discount !== undefined) row.discount = r.discount
  if (r.paid !== undefined) row.paid_amount = r.paid
  if (r.remaining !== undefined) row.remaining_amount = r.remaining
  if (r.paymentType !== undefined) row.payment_type = r.paymentType
  if (r.notes !== undefined) row.notes = r.notes
  if (r.imei !== undefined) row.imei = r.imei || null
  if (r.completedAt !== undefined) row.completed_date = r.completedAt || null
  if (r.technician !== undefined) row.technician = r.technician
  if (r.parts !== undefined) row.parts = r.parts
  if (r.partsCost !== undefined) row.parts_cost = r.partsCost
  if (r.signature !== undefined) row.signature = r.signature || null
  if (r.stage !== undefined) row.stage = r.stage || null
  if (r.estimatedDelivery !== undefined) row.estimated_delivery = r.estimatedDelivery || null
  if (r.qc !== undefined) row.qc = r.qc
  if (r.quote !== undefined) row.quote = r.quote
  return row
}

// QR kod ile giriş yapmadan görüntülenen, salt-okunur küçük veri seti.
// Güvenli bir Supabase fonksiyonu (get_repair_public) üzerinden gelir —
// bkz. supabase-repair-public-view-migration.sql. Bu fonksiyon SADECE
// verilen ID'ye ait tek kaydı döndürür, tüm listeyi değil.
export interface PublicRepairView {
  id: string
  repairCode: string
  customerCode: string
  customerName: string
  phone1: string
  device: string
  brand: string
  model: string
  issue: string
  status: "waiting" | "in_progress" | "completed"
  cost: number
  discount: number
  paid: number
  remaining: number
  paymentType: string
  notes: string
  imei?: string
  createdAt: string
  completedAt?: string
}

export async function fetchRepairPublic(id: string): Promise<PublicRepairView | null> {
  const { data, error } = await supabase.rpc("get_repair_public", { p_id: id })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    id: row.id,
    repairCode: row.repair_code ?? "",
    customerCode: row.customer_code ?? "",
    customerName: row.customer_name ?? "",
    phone1: row.phone1 ?? "",
    device: row.device_type ?? "Telefon",
    brand: row.brand ?? "",
    model: row.model ?? "",
    issue: row.complaint ?? "",
    status: (row.status as PublicRepairView["status"]) ?? "waiting",
    cost: Number(row.cost) || 0,
    discount: Number(row.discount) || 0,
    paid: Number(row.paid_amount) || 0,
    remaining: Number(row.remaining_amount) || 0,
    paymentType: row.payment_type ?? "unpaid",
    notes: row.notes ?? "",
    imei: row.imei ?? undefined,
    createdAt: row.received_date ? String(row.received_date).slice(0, 10) : "",
    completedAt: row.completed_date ? String(row.completed_date).slice(0, 10) : undefined,
  }
}

export async function fetchRepairs(): Promise<Repair[]> {
  const data = await fetchAllRows("devices", "received_date", false)

  if ((!data || data.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_repairs")) {
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

  // Aktarım işareti sadece aktarılacak eski veri kalmadıysa yazılır; aktarım başarısız olduysa bir sonraki açılışta tekrar denenir.
  if (typeof window !== "undefined" && !localStorage.getItem("yt_repairs")) localStorage.setItem("yt_migrated_repairs", "true")
  return (data || []).map(fromRow)
}

const OPTIONAL_REPAIR_COLUMNS = ["stage", "estimated_delivery", "qc", "quote", "technician", "parts", "parts_cost", "signature"]

export async function createRepair(input: Omit<Repair, "id" | "repairCode">): Promise<Repair> {
  const row = toRow(input)
  // Boş değerleri göndermeyelim: yeni sütunlar olmasa bile sıradan tamir kaydı açılabilsin
  if (!row.stage) delete row.stage
  if (!row.estimated_delivery) delete row.estimated_delivery
  if (!row.technician) delete row.technician
  if (Array.isArray(row.parts) && row.parts.length === 0) delete row.parts
  if (!row.parts_cost) delete row.parts_cost
  if (!row.signature) delete row.signature
  if (row.qc === null || row.qc === undefined) delete row.qc
  if (row.quote === null || row.quote === undefined) delete row.quote
  let { data, error } = await supabase.from("devices").insert(row).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Tamir tablosunda yeni sütunlar eksik; bunlar olmadan kaydediliyor. SQL migrasyonlarını çalıştırın.", error.message)
    ;({ data, error } = await supabase.from("devices").insert(stripColumns(row, OPTIONAL_REPAIR_COLUMNS)).select("*").single())
  }
  if (error) throw error
  const created = fromRow(data)
  logActivity("Teknik Servis", "created", `${created.customerName} — ${created.brand} ${created.model} kaydı eklendi`)
  return created
}

export async function updateRepair(id: string, input: Partial<Omit<Repair, "id" | "repairCode">>): Promise<Repair> {
  const row = toRow(input)
  let { data, error } = await supabase.from("devices").update(row).eq("id", id).select("*").single()
  if (error && isMissingColumnError(error)) {
    console.warn("Tamir tablosunda yeni sütunlar eksik; bunlar olmadan güncelleniyor.", error.message)
    ;({ data, error } = await supabase.from("devices").update(stripColumns(row, OPTIONAL_REPAIR_COLUMNS)).eq("id", id).select("*").single())
  }
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Teknik Servis", "updated", `${updated.customerName} — ${updated.brand} ${updated.model} güncellendi`)
  return updated
}

export async function deleteRepair(id: string): Promise<void> {
  const { data: existing } = await supabase.from("devices").select("customer_name, brand, model").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("devices").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Teknik Servis", "deleted", `${existing?.customer_name || "Bir kayıt"} — ${existing?.brand || ""} ${existing?.model || ""} silindi`)
}

import { supabase } from "@/lib/supabase"

export interface Appointment {
  id: string
  customerId: number
  customerName: string
  customerPhone: string
  date: string
  time: string
  service: string
  status: "scheduled" | "completed" | "cancelled"
  notes: string
}

// Not: customerId, Müşteriler sayfası henüz Supabase'e taşınmadığı için
// (o sayfa hâlâ localStorage tabanlı sayısal id kullanıyor) veritabanında
// saklanmıyor; sadece seçim anında kullanılan geçici bir alan. Asıl
// gösterilecek bilgi (customerName, customerPhone) ayrıca saklanıyor.
function fromRow(row: any): Appointment {
  return {
    id: row.id,
    customerId: 0,
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    date: row.appointment_date ?? "",
    time: row.appointment_time ?? "",
    service: row.service_type ?? "",
    status: (row.status as Appointment["status"]) ?? "scheduled",
    notes: row.notes ?? "",
  }
}

function toRow(a: Partial<Appointment>) {
  const row: Record<string, unknown> = {}
  if (a.customerName !== undefined) row.customer_name = a.customerName
  if (a.customerPhone !== undefined) row.customer_phone = a.customerPhone
  if (a.date !== undefined) row.appointment_date = a.date || null
  if (a.time !== undefined) row.appointment_time = a.time
  if (a.service !== undefined) row.service_type = a.service
  if (a.status !== undefined) row.status = a.status
  if (a.notes !== undefined) row.notes = a.notes
  return row
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.from("appointments").select("*").order("appointment_date", { ascending: true })
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_appointments")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((a: any) => toRow({
            customerName: a.customerName,
            customerPhone: a.customerPhone,
            date: a.date,
            time: a.time,
            service: a.service,
            status: a.status,
            notes: a.notes,
          }))
          const { data: inserted, error: insertError } = await supabase.from("appointments").insert(rows).select("*")
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

export async function createAppointment(input: Omit<Appointment, "id">): Promise<Appointment> {
  const { data, error } = await supabase.from("appointments").insert(toRow(input)).select("*").single()
  if (error) throw error
  return fromRow(data)
}

export async function updateAppointment(id: string, input: Partial<Omit<Appointment, "id">>): Promise<Appointment> {
  const { data, error } = await supabase.from("appointments").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from("appointments").delete().eq("id", id)
  if (error) throw error
}

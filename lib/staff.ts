import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  joinDate: string
  status: "active" | "inactive" | "on_leave"
  permissions: string[]
  salary: number
}

function fromRow(row: any): StaffMember {
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role ?? "Teknisyen",
    department: row.department ?? "",
    joinDate: row.join_date ?? "",
    status: (row.status as StaffMember["status"]) ?? "active",
    permissions: row.permissions ?? [],
    salary: Number(row.salary) || 0,
  }
}

function toRow(s: Partial<StaffMember>) {
  const row: Record<string, unknown> = {}
  if (s.name !== undefined) row.name = s.name
  if (s.email !== undefined) row.email = s.email
  if (s.phone !== undefined) row.phone = s.phone
  if (s.role !== undefined) row.role = s.role
  if (s.department !== undefined) row.department = s.department
  if (s.joinDate !== undefined) row.join_date = s.joinDate || null
  if (s.status !== undefined) row.status = s.status
  if (s.permissions !== undefined) row.permissions = s.permissions
  if (s.salary !== undefined) row.salary = s.salary
  return row
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false })
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_staff")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((s: any) => toRow({
            name: s.name, email: s.email, phone: s.phone, role: s.role, department: s.department,
            joinDate: s.joinDate, status: s.status, permissions: s.permissions, salary: s.salary,
          }))
          const { data: inserted, error: insertError } = await supabase.from("staff").insert(rows).select("*")
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

export async function createStaffMember(input: Omit<StaffMember, "id">): Promise<StaffMember> {
  const { data, error } = await supabase.from("staff").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Personel", "created", `${created.name} eklendi`)
  return created
}

export async function updateStaffMember(id: string, input: Partial<Omit<StaffMember, "id">>): Promise<StaffMember> {
  const { data, error } = await supabase.from("staff").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Personel", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteStaffMember(id: string): Promise<void> {
  const { data: existing } = await supabase.from("staff").select("name").eq("id", id).single()
  const { error } = await supabase.from("staff").delete().eq("id", id)
  if (error) throw error
  logActivity("Personel", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

import { supabase } from "@/lib/supabase"

export interface ActivityLogEntry {
  id: string
  actor: string
  action: "created" | "updated" | "deleted"
  module: string
  description: string
  createdAt: string
}

function currentActorName(): string {
  if (typeof window === "undefined") return "Bilinmeyen"
  try {
    const raw = localStorage.getItem("yt_user")
    if (!raw) return "Bilinmeyen"
    const user = JSON.parse(raw)
    return user?.name || user?.username || "Bilinmeyen"
  } catch {
    return "Bilinmeyen"
  }
}

// Herhangi bir modülden çağrılabilecek genel log fonksiyonu. Hata verirse
// (örn. internet kopması) sessizce geçilir — asıl işlemi (kayıt ekleme/silme)
// engellememesi için loglama hiçbir zaman throw etmez.
export async function logActivity(
  module: string,
  action: "created" | "updated" | "deleted",
  description: string
): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      actor: currentActorName(),
      action,
      module,
      description,
    })
  } catch (e) {
    console.error("Aktivite kaydı oluşturulamadı:", e)
  }
}

function fromRow(row: any): ActivityLogEntry {
  return {
    id: row.id,
    actor: row.actor ?? "Bilinmeyen",
    action: row.action,
    module: row.module ?? "",
    description: row.description ?? "",
    createdAt: row.created_at ?? "",
  }
}

export async function fetchActivityLog(limit = 100): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map(fromRow)
}

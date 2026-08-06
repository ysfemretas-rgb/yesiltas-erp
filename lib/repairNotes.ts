import { supabase } from "@/lib/supabase"

export interface RepairNote {
  id: string
  repairId: string
  text: string
  createdAt: string
  author: string
}

function fromRow(row: any): RepairNote {
  return {
    id: row.id,
    repairId: row.repair_id,
    text: row.text ?? "",
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString("tr-TR") : "",
    author: row.author ?? "Teknisyen",
  }
}

// Not: eski localStorage notlarındaki repairId sayısaldı, yeni Supabase
// kayıtlarının UUID'siyle eşleşmediği için otomatik aktarım yapılmıyor —
// geçmiş notlar kaybolmaz (istenirse elle bakılabilir) ama yeni notlar artık
// hep Supabase'e yazılır.
export async function fetchRepairNotes(): Promise<RepairNote[]> {
  const { data, error } = await supabase.from("repair_notes").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function createRepairNote(repairId: string, text: string, author = "Teknisyen"): Promise<RepairNote> {
  const { data, error } = await supabase.from("repair_notes").insert({
    repair_id: repairId,
    text,
    author,
  }).select("*").single()
  if (error) throw error
  return fromRow(data)
}

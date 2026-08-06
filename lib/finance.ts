import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  customer?: string
  source: "repair" | "sale" | "manual"
  sourceId?: string
}

function fromRow(row: any): Transaction {
  return {
    id: row.id,
    description: row.description ?? "",
    amount: Number(row.amount) || 0,
    type: (row.type as Transaction["type"]) ?? "income",
    category: row.category ?? "",
    date: row.transaction_date ?? (row.created_at ? String(row.created_at).slice(0, 10) : ""),
    customer: row.customer ?? "",
    source: (row.related_table as Transaction["source"]) ?? "manual",
    sourceId: row.related_id ?? undefined,
  }
}

function toRow(t: Partial<Transaction>) {
  const row: Record<string, unknown> = {}
  if (t.description !== undefined) row.description = t.description
  if (t.amount !== undefined) row.amount = t.amount
  if (t.type !== undefined) row.type = t.type
  if (t.category !== undefined) row.category = t.category
  if (t.date !== undefined) row.transaction_date = t.date || null
  if (t.customer !== undefined) row.customer = t.customer
  if (t.source !== undefined) row.related_table = t.source
  if (t.sourceId !== undefined) row.related_id = t.sourceId || null
  return row
}

// Bir satış/tamir silinirken, ondan otomatik oluşturulmuş gelir kaydını da temizler.
export async function deleteTransactionsBySource(source: "repair" | "sale", sourceId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("related_table", source).eq("related_id", sourceId)
  if (error) console.error("Bağlı finans kaydı silinemedi:", error)
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase.from("transactions").select("*").order("transaction_date", { ascending: false }).limit(1000)
  if (error) throw error

  if ((!data || data.length === 0) && typeof window !== "undefined") {
    const legacyRaw = localStorage.getItem("yt_finance")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((t: any) => toRow({
            description: t.description, amount: t.amount, type: t.type, category: t.category,
            date: t.date, customer: t.customer, source: t.source,
          }))
          const { data: inserted, error: insertError } = await supabase.from("transactions").insert(rows).select("*")
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

export async function createTransaction(input: Omit<Transaction, "id">): Promise<Transaction> {
  const { data, error } = await supabase.from("transactions").insert(toRow(input)).select("*").single()
  if (error) throw error
  const created = fromRow(data)
  logActivity("Finans", "created", `${created.description} — ${created.amount.toLocaleString("tr-TR")} TL (${created.type === "income" ? "gelir" : "gider"})`)
  return created
}

export async function updateTransaction(id: string, input: Partial<Omit<Transaction, "id">>): Promise<Transaction> {
  const { data, error } = await supabase.from("transactions").update(toRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const updated = fromRow(data)
  logActivity("Finans", "updated", `${updated.description} güncellendi`)
  return updated
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: existing } = await supabase.from("transactions").select("description").eq("id", id).single()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw error
  logActivity("Finans", "deleted", `${existing?.description || "Bir kayıt"} silindi`)
}

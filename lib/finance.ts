import { supabase, fetchAllRows } from "@/lib/supabase"
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
  if (error) throw error
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const data = await fetchAllRows("transactions", "transaction_date", false)

  if ((!data || data.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_finance")) {
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

  // Aktarım işareti sadece aktarılacak eski veri kalmadıysa yazılır; aktarım başarısız olduysa bir sonraki açılışta tekrar denenir.
  if (typeof window !== "undefined" && !localStorage.getItem("yt_finance")) localStorage.setItem("yt_migrated_finance", "true")
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
  const { data: deleted, error } = await supabase.from("transactions").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Finans", "deleted", `${existing?.description || "Bir kayıt"} silindi`)
}

// Bir satışın/tamirin kasa etkisini SİLMEDEN, ters kayıtla sıfırlar (iptal gibi durumlarda geçmiş korunur).
// Kayıtlarda gelir - gider farkı alınır: net gelir varsa aynı tutarda "iptal gideri", net gider varsa
// aynı tutarda "iptal geliri" yazılır. Net sıfırsa kayıt eklenmez.
export async function reverseTransactionsBySource(
  source: "repair" | "sale",
  sourceId: string,
  info: { label: string; customer: string; date: string }
): Promise<number> {
  const { data, error } = await supabase.from("transactions").select("type, amount").eq("related_table", source).eq("related_id", sourceId)
  if (error) throw error
  const net = Math.round(((data || []).reduce((sum: number, r: any) => sum + (r.type === "income" ? 1 : -1) * (Number(r.amount) || 0), 0)) * 100) / 100
  if (Math.abs(net) < 0.01) return 0
  await createTransaction({
    type: net > 0 ? "expense" : "income",
    category: net > 0 ? "Satış İptali" : "Eşantiyon İptali",
    amount: Math.abs(net),
    description: `↩️ ${info.label}`,
    date: info.date,
    customer: info.customer,
    source,
    sourceId,
  })
  return net
}

// Bir kaydın kasadaki NET etkisini (gelir - gider) istenen değere getirir; farkı düzeltme kaydı olarak yazar.
// Eski kayıtlar silinmez: bu yüzden sadece Yönetici değil herkes (satış düzenleyen personel de) kullanabilir
// ve geçmiş izlenebilir kalır. (Eskiden düzenlemede silme yetkisi olmayan personelde eski kayıt kalıp yenisi
// eklendiği için gelir ikiye katlanabiliyordu.)
export async function syncTransactionsToNet(
  source: "repair" | "sale",
  sourceId: string,
  desiredNet: number,
  info: { label: string; customer: string; date: string }
): Promise<number> {
  const { data, error } = await supabase.from("transactions").select("type, amount").eq("related_table", source).eq("related_id", sourceId)
  if (error) throw error
  const existing = (data || []).reduce((sum: number, r: any) => sum + (r.type === "income" ? 1 : -1) * (Number(r.amount) || 0), 0)
  const diff = Math.round((desiredNet - existing) * 100) / 100
  if (Math.abs(diff) < 0.01) return 0
  await createTransaction({
    type: diff > 0 ? "income" : "expense",
    category: source === "repair" ? "Tamir Düzeltmesi" : "Satış Düzeltmesi",
    amount: Math.abs(diff),
    description: `✏️ ${info.label}`,
    date: info.date,
    customer: info.customer,
    source,
    sourceId,
  })
  return diff
}

import { supabase, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { createTransaction } from "@/lib/finance"
import { localDateStr } from "@/lib/dates"

export interface Debt {
  id: string
  amount: number
  description: string
  date: string
  status: "paid" | "unpaid"
  source?: "repair" | "sale" | "manual"
  sourceId?: string
}

export interface Customer {
  id: string
  customerCode: string
  customerId: string
  firstName: string
  lastName: string
  name: string
  phone: string
  phone1?: string
  phone2: string
  email: string
  address: string
  city: string
  debts: Debt[]
  totalDebt: number
  totalRepairs: number
  lastVisit: string
  status: "active" | "inactive"
  notes: string
}

function debtFromRow(row: any): Debt {
  const statusMap: Record<string, "paid" | "unpaid"> = {
    "Tamamlandı": "paid",
    "Beklemede": "unpaid",
    "Kısmi Ödendi": "unpaid",
    "Gecikti": "unpaid",
  }
  const sourceMap: Record<string, "repair" | "sale" | "manual"> = {
    device: "repair",
    sale: "sale",
  }
  return {
    id: row.id,
    amount: Number(row.total_amount) || 0,
    description: row.description ?? "",
    date: row.created_at ? String(row.created_at).slice(0, 10) : "",
    status: statusMap[row.status] ?? "unpaid",
    source: row.source_type ? sourceMap[row.source_type] : "manual",
    sourceId: row.source_id ?? undefined,
  }
}

function customerFromRow(row: any, debts: Debt[]): Customer {
  const totalDebt = debts.filter(d => d.status === "unpaid" && (d.source ?? "manual") === "manual").reduce((sum, d) => sum + d.amount, 0)
  return {
    id: row.id,
    customerCode: row.customer_code ?? "",
    customerId: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    name: row.name ?? "",
    phone: row.phone ?? "",
    phone1: row.phone ?? "",
    phone2: row.phone2 ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    debts,
    totalDebt,
    totalRepairs: row.total_repairs ?? 0,
    lastVisit: row.last_visit ?? "",
    status: (row.status as "active" | "inactive") ?? "active",
    notes: row.notes ?? "",
  }
}

function customerToRow(c: Partial<Customer>) {
  const row: Record<string, unknown> = {}
  if (c.firstName !== undefined) row.first_name = c.firstName
  if (c.lastName !== undefined) row.last_name = c.lastName
  if (c.name !== undefined) row.name = c.name
  if (c.phone !== undefined) row.phone = c.phone
  if (c.phone2 !== undefined) row.phone2 = c.phone2
  if (c.email !== undefined) row.email = c.email
  if (c.address !== undefined) row.address = c.address
  if (c.city !== undefined) row.city = c.city
  if (c.totalRepairs !== undefined) row.total_repairs = c.totalRepairs
  if (c.lastVisit !== undefined) row.last_visit = c.lastVisit || null
  if (c.status !== undefined) row.status = c.status
  if (c.notes !== undefined) row.notes = c.notes
  return row
}

export async function fetchCustomers(): Promise<Customer[]> {
  const customerRows = await fetchAllRows("customers", "created_at", false)

  if ((!customerRows || customerRows.length === 0) && typeof window !== "undefined" && !localStorage.getItem("yt_migrated_customers")) {
    const legacyRaw = localStorage.getItem("yt_customers")
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy) && legacy.length > 0) {
          const rows = legacy.map((c: any) => customerToRow({
            firstName: c.firstName, lastName: c.lastName, name: c.name, phone: c.phone,
            phone2: c.phone2, email: c.email, address: c.address, city: c.city,
            totalRepairs: c.totalRepairs, lastVisit: c.lastVisit, status: c.status, notes: c.notes,
          }))
          const { data: inserted, error: insertError } = await supabase.from("customers").insert(rows).select("*")
          if (!insertError && inserted) {
            // Eski borçları da aktar
            for (let i = 0; i < inserted.length; i++) {
              const legacyDebts = legacy[i]?.debts
              if (Array.isArray(legacyDebts) && legacyDebts.length > 0) {
                const debtRows = legacyDebts.map((d: any) => ({
                  customer_id: inserted[i].id,
                  description: d.description || "",
                  total_amount: d.amount || 0,
                  paid_amount: d.status === "paid" ? (d.amount || 0) : 0,
                  remaining_amount: d.status === "paid" ? 0 : (d.amount || 0),
                  status: d.status === "paid" ? "Tamamlandı" : "Beklemede",
                }))
                await supabase.from("debts").insert(debtRows)
              }
            }
            return fetchCustomers()
          }
        }
      } catch {
        // eski veri okunamadıysa sessizce geç
      }
    }
  }

  // Borçları .in(...) ile tek tek müşteri ID'siyle çekmek müşteri sayısı arttıkça
  // URL'yi aşırı uzatıp isteği bozuyordu; tüm borçlar sayfalı çekilip gruplanıyor.
  const debtsByCustomer: Record<string, Debt[]> = {}
  if ((customerRows || []).length > 0) {
    let debtRows: any[] = []
    try {
      debtRows = await fetchAllRows("debts", "created_at", false)
    } catch (e) {
      console.error("Borçlar yüklenemedi:", e)
    }
    for (const row of debtRows) {
      if (!row.customer_id) continue
      const list = debtsByCustomer[row.customer_id] || (debtsByCustomer[row.customer_id] = [])
      list.push(debtFromRow(row))
    }
  }

  if (typeof window !== "undefined") localStorage.setItem("yt_migrated_customers", "true")
  return (customerRows || []).map((row: any) => customerFromRow(row, debtsByCustomer[row.id] || []))
}

export async function createCustomer(input: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").insert(customerToRow(input)).select("*").single()
  if (error) throw error
  const created = customerFromRow(data, [])
  logActivity("Müşteriler", "created", `${created.name} eklendi`)
  return created
}

export async function updateCustomer(id: string, input: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").update(customerToRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  const { data: debtRows } = await supabase.from("debts").select("*").eq("customer_id", id)
  const updated = customerFromRow(data, (debtRows || []).map(debtFromRow))
  logActivity("Müşteriler", "updated", `${updated.name} güncellendi`)
  return updated
}

export async function deleteCustomer(id: string): Promise<void> {
  const { data: existing } = await supabase.from("customers").select("name").eq("id", id).single()
  const { data: deleted, error } = await supabase.from("customers").delete().eq("id", id).select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
    throw new Error("Silme işlemi reddedildi — bu işlem için yetkiniz olmayabilir (sadece Yönetici silebilir).")
  }
  logActivity("Müşteriler", "deleted", `${existing?.name || "Bir kayıt"} silindi`)
}

export async function addDebt(
  customerId: string,
  input: { amount: number; description: string; sourceType?: "device" | "sale"; sourceId?: string }
): Promise<Debt> {
  const { data, error } = await supabase.from("debts").insert({
    customer_id: customerId,
    description: input.description,
    total_amount: input.amount,
    paid_amount: 0,
    remaining_amount: input.amount,
    status: "Beklemede",
    source_type: input.sourceType || null,
    source_id: input.sourceId || null,
  }).select("*").single()
  if (error) throw error
  logActivity("Müşteriler", "created", `${input.description} — ${input.amount.toLocaleString("tr-TR")} TL borç eklendi`)
  return debtFromRow(data)
}

// Bir satış/tamir kaydı silinirken, ona bağlı (henüz ödenmemiş) borç kaydını da temizler.
export async function deleteDebtsBySource(sourceType: "device" | "sale", sourceId: string): Promise<void> {
  const { error } = await supabase.from("debts").delete().eq("source_type", sourceType).eq("source_id", sourceId)
  if (error) console.error("Bağlı borç kaydı silinemedi:", error)
}

export async function payDebt(debtId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase.from("debts").select("total_amount, customer_id, description, status").eq("id", debtId).single()
  if (fetchError) throw fetchError
  if (existing?.status === "Tamamlandı") return
  const { error } = await supabase.from("debts").update({
    status: "Tamamlandı",
    paid_amount: existing?.total_amount ?? 0,
    remaining_amount: 0,
  }).eq("id", debtId)
  if (error) throw error
  const amount = Number(existing?.total_amount) || 0
  logActivity("Müşteriler", "updated", `${amount.toLocaleString("tr-TR")} TL borç ödendi olarak işaretlendi`)

  // Tahsil edilen borç kasaya gelir olarak yazılır (eskiden hiç yazılmıyordu).
  if (amount > 0) {
    try {
      let customerName = ""
      if (existing?.customer_id) {
        const { data: c } = await supabase.from("customers").select("name").eq("id", existing.customer_id).single()
        customerName = c?.name ?? ""
      }
      await createTransaction({
        type: "income",
        category: "Borç Tahsilatı",
        amount,
        description: `💰 Borç tahsilatı: ${customerName} - ${existing?.description || ""}`.trim(),
        date: localDateStr(),
        customer: customerName,
        source: "manual",
      })
    } catch (e) {
      console.error("Tahsilat kasaya yazılamadı:", e)
    }
  }
}

// Satış veya tamirden doğan kalan bakiyeyi (kısmen ya da tamamen) tahsil eder:
// kaydın ödenen/kalan tutarını günceller, bağlı borç kaydını senkronlar ve kasaya gelir yazar.
export async function collectBalance(
  kind: "sale" | "repair",
  id: string,
  amount?: number
): Promise<{ paid: number; remaining: number; collected: number }> {
  const table = kind === "sale" ? "sales" : "devices"
  const nameCol = "customer_name"
  const { data: row, error } = await supabase.from(table).select(`paid_amount, remaining_amount, ${nameCol}`).eq("id", id).single()
  if (error || !row) throw error || new Error("Kayıt bulunamadı")
  const currentRemaining = Number(row.remaining_amount) || 0
  if (currentRemaining <= 0) throw new Error("Bu kayıtta tahsil edilecek bakiye yok.")
  const collected = Math.min(currentRemaining, amount && amount > 0 ? amount : currentRemaining)
  const newPaid = (Number(row.paid_amount) || 0) + collected
  const newRemaining = Math.round((currentRemaining - collected) * 100) / 100

  const { error: upErr } = await supabase.from(table).update({ paid_amount: newPaid, remaining_amount: newRemaining }).eq("id", id)
  if (upErr) throw upErr

  const sourceType = kind === "sale" ? "sale" : "device"
  const debtUpdate = newRemaining <= 0
    ? { status: "Tamamlandı", paid_amount: 0, remaining_amount: 0 }
    : { total_amount: newRemaining, remaining_amount: newRemaining, status: "Beklemede" }
  if (newRemaining <= 0) {
    const { data: debtRows } = await supabase.from("debts").select("id, total_amount").eq("source_type", sourceType).eq("source_id", id)
    for (const d of debtRows || []) {
      await supabase.from("debts").update({ status: "Tamamlandı", paid_amount: d.total_amount, remaining_amount: 0 }).eq("id", d.id)
    }
  } else {
    await supabase.from("debts").update(debtUpdate).eq("source_type", sourceType).eq("source_id", id)
  }

  try {
    await createTransaction({
      type: "income",
      category: "Borç Tahsilatı",
      amount: collected,
      description: `💰 ${kind === "sale" ? "Satış" : "Tamir"} tahsilatı: ${row[nameCol] || ""}`,
      date: localDateStr(),
      customer: row[nameCol] || "",
      source: kind,
      sourceId: id,
    })
  } catch (e) {
    console.error("Tahsilat kasaya yazılamadı:", e)
  }
  logActivity("Müşteriler", "updated", `${row[nameCol] || ""} — ${collected.toLocaleString("tr-TR")} TL tahsil edildi`)
  return { paid: newPaid, remaining: newRemaining, collected }
}

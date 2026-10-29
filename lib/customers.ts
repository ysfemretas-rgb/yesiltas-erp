import { supabase, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { createTransaction } from "@/lib/finance"
import { localDateStr, dbDateToLocal } from "@/lib/dates"
import { allocateInstallments } from "@/lib/money"

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
  birthDate?: string
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
    date: dbDateToLocal(row.created_at),
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
    birthDate: row.birth_date ? String(row.birth_date).slice(0, 10) : "",
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
  if (c.birthDate !== undefined) row.birth_date = c.birthDate || null
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

  // Aktarım işareti sadece aktarılacak eski veri kalmadıysa yazılır; aktarım başarısız olduysa bir sonraki açılışta tekrar denenir.
  if (typeof window !== "undefined" && !localStorage.getItem("yt_customers")) localStorage.setItem("yt_migrated_customers", "true")
  return (customerRows || []).map((row: any) => customerFromRow(row, debtsByCustomer[row.id] || []))
}

export async function createCustomer(input: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").insert(customerToRow(input)).select("*").single()
  if (error) throw error
  const created = customerFromRow(data, [])
  logActivity("Müşteriler", "created", `${created.name} eklendi`)
  return created
}

// Satış ve tamir kayıtlarında müşterinin adı/telefonu KOPYA olarak saklanır. Müşteri düzeltilince bu kopyalar da güncellenir
// (yanlış yazılmış telefon satış kaydında ve WhatsApp'ta eski kalmasın). Hata olursa müşteri güncellemesini bozmaz.
async function syncCustomerCopies(id: string, before: any, after: any): Promise<void> {
  try {
    const name = after.name ?? ""
    const phone = after.phone ?? ""
    const salePatch = { customer_name: name, customer_phone: phone }
    // Satışlar: müşteriye bağlı olanların hepsi (id ya da müşteri koduyla)
    await supabase.from("sales").update(salePatch).eq("customer_id", id)
    if (after.customer_code) await supabase.from("sales").update(salePatch).eq("customer_code", after.customer_code)
    // Bağlantısı olmayan eski satışlar: eski ad + eski telefonla eşleşenler
    if (before?.name) {
      await supabase.from("sales").update(salePatch).is("customer_id", null).is("customer_code", null).eq("customer_name", before.name).eq("customer_phone", before.phone ?? "")
    }
    // Tamirler: ad ve (eski telefonla aynıysa) telefon
    if (after.customer_code) {
      await supabase.from("devices").update({ customer_name: name }).eq("customer_code", after.customer_code)
      if (before?.phone && phone && before.phone !== phone) {
        await supabase.from("devices").update({ phone1: phone }).eq("customer_code", after.customer_code).eq("phone1", before.phone)
      }
    }
  } catch (e) {
    console.error("Müşteri kopyaları güncellenemedi:", e)
  }
}

export async function updateCustomer(id: string, input: Partial<Customer>): Promise<Customer> {
  const { data: before } = await supabase.from("customers").select("name, phone, customer_code").eq("id", id).maybeSingle()
  const { data, error } = await supabase.from("customers").update(customerToRow(input)).eq("id", id).select("*").single()
  if (error) throw error
  await syncCustomerCopies(id, before, data)
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
  const { data, error } = await supabase.from("debts").delete().eq("source_type", sourceType).eq("source_id", sourceId).select("id")
  if (error) throw error
  // Silme yetkisi yoksa (sadece Yönetici silebilir) satır sessizce silinmez; bu durumda kayıt sıfırlanıp kapatılır
  // ki iptal/düzenleme sonrası eski borç tutarı açık kalmasın.
  if (!data || data.length === 0) {
    const { error: upErr } = await supabase
      .from("debts")
      .update({ total_amount: 0, paid_amount: 0, remaining_amount: 0, status: "Tamamlandı" })
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
    if (upErr) throw upErr
  }
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
  const selectCols = kind === "sale" ? `paid_amount, remaining_amount, ${nameCol}, installment_plan` : `paid_amount, remaining_amount, ${nameCol}`
  const { data: row, error } = await supabase.from(table).select(selectCols).eq("id", id).single() as { data: any; error: any }
  if (error || !row) throw error || new Error("Kayıt bulunamadı")
  const currentRemaining = Number(row.remaining_amount) || 0
  if (currentRemaining <= 0) throw new Error("Bu kayıtta tahsil edilecek bakiye yok.")
  const collected = Math.min(currentRemaining, amount && amount > 0 ? amount : currentRemaining)
  const newPaid = (Number(row.paid_amount) || 0) + collected
  const newRemaining = Math.round((currentRemaining - collected) * 100) / 100

  const updatePayload: Record<string, unknown> = { paid_amount: newPaid, remaining_amount: newRemaining }
  // Taksitli satışta tahsilat en eski taksitten başlayarak taksitlere dağıtılır
  if (kind === "sale" && Array.isArray(row.installment_plan) && row.installment_plan.length > 0) {
    updatePayload.installment_plan = allocateInstallments(row.installment_plan, collected)
  }
  const { error: upErr } = await supabase.from(table).update(updatePayload).eq("id", id)
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

const rnd2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

// Satış veya tamirin kalan bakiyesinden İNDİRİM düşer (para alınmaz, kasaya yazılmaz): satışın/tamirin toplam tutarı ve
// iskontosu güncellenir, bağlı borç kaydı senkronlanır. Böylece ciro/kâr hesabı indirimli tutardan yapılır.
export async function discountBalance(kind: "sale" | "repair", id: string, amount: number): Promise<{ remaining: number; discounted: number }> {
  const table = kind === "sale" ? "sales" : "devices"
  const selectCols = kind === "sale"
    ? "total_price, discount, paid_amount, remaining_amount, customer_name, installment_plan"
    : "cost, discount, paid_amount, remaining_amount, customer_name"
  const { data: row, error } = await supabase.from(table).select(selectCols).eq("id", id).single() as { data: any; error: any }
  if (error || !row) throw error || new Error("Kayıt bulunamadı")
  const currentRemaining = Number(row.remaining_amount) || 0
  if (currentRemaining <= 0) throw new Error("Bu kayıtta indirim yapılacak bakiye yok.")
  const d = rnd2(Math.min(currentRemaining, Math.max(0, amount)))
  if (!(d > 0)) throw new Error("İndirim tutarı geçersiz.")
  const newRemaining = rnd2(currentRemaining - d)
  const payload: Record<string, unknown> = { remaining_amount: newRemaining, discount: rnd2((Number(row.discount) || 0) + d) }
  if (kind === "sale") {
    const newTotal = rnd2((Number(row.total_price) || 0) - d)
    payload.total_price = newTotal
    payload.unit_price = newTotal
    if (Array.isArray(row.installment_plan) && row.installment_plan.length > 0) payload.installment_plan = allocateInstallments(row.installment_plan, d)
  } else {
    payload.cost = rnd2((Number(row.cost) || 0) - d)
  }
  const { error: upErr } = await supabase.from(table).update(payload).eq("id", id)
  if (upErr) throw upErr
  const sourceType = kind === "sale" ? "sale" : "device"
  if (newRemaining <= 0) {
    const { data: debtRows } = await supabase.from("debts").select("id, total_amount").eq("source_type", sourceType).eq("source_id", id)
    for (const dr of debtRows || []) await supabase.from("debts").update({ status: "Tamamlandı", paid_amount: dr.total_amount, remaining_amount: 0 }).eq("id", dr.id)
  } else {
    await supabase.from("debts").update({ total_amount: newRemaining, remaining_amount: newRemaining, status: "Beklemede" }).eq("source_type", sourceType).eq("source_id", id)
  }
  logActivity("Müşteriler", "updated", `${row.customer_name || ""} — ${d.toLocaleString("tr-TR")} TL indirim yapıldı (${kind === "sale" ? "satış" : "tamir"})`)
  return { remaining: newRemaining, discounted: d }
}

// Satış/tamire bağlı olmayan (elle eklenmiş) borcun bir kısmını tahsil eder ve kasaya gelir yazar.
export async function collectManualDebt(debtId: string, amount: number, customerName = ""): Promise<{ remaining: number; collected: number }> {
  const { data: d, error } = await supabase.from("debts").select("total_amount, paid_amount, remaining_amount, description").eq("id", debtId).single()
  if (error || !d) throw error || new Error("Borç kaydı bulunamadı")
  const remaining = Number(d.remaining_amount) || 0
  const collected = rnd2(Math.min(remaining, Math.max(0, amount)))
  if (!(collected > 0)) throw new Error("Tahsil edilecek bakiye yok.")
  const newRemaining = rnd2(remaining - collected)
  const upd = newRemaining <= 0
    ? { status: "Tamamlandı", paid_amount: Number(d.total_amount) || 0, remaining_amount: 0 }
    : { paid_amount: rnd2((Number(d.paid_amount) || 0) + collected), remaining_amount: newRemaining }
  const { error: upErr } = await supabase.from("debts").update(upd).eq("id", debtId)
  if (upErr) throw upErr
  try {
    await createTransaction({ type: "income", category: "Borç Tahsilatı", amount: collected, description: `💰 Borç tahsilatı: ${customerName} - ${d.description || ""}`.trim(), date: localDateStr(), customer: customerName, source: "manual" })
  } catch (e) {
    console.error("Tahsilat kasaya yazılamadı:", e)
  }
  return { remaining: newRemaining, collected }
}

// Elle eklenmiş borçtan indirim düşer (para alınmaz).
export async function discountManualDebt(debtId: string, amount: number): Promise<{ remaining: number; discounted: number }> {
  const { data: d, error } = await supabase.from("debts").select("total_amount, paid_amount, remaining_amount").eq("id", debtId).single()
  if (error || !d) throw error || new Error("Borç kaydı bulunamadı")
  const remaining = Number(d.remaining_amount) || 0
  const disc = rnd2(Math.min(remaining, Math.max(0, amount)))
  if (!(disc > 0)) throw new Error("İndirim yapılacak bakiye yok.")
  const newRemaining = rnd2(remaining - disc)
  const upd = newRemaining <= 0
    ? { status: "Tamamlandı", total_amount: rnd2((Number(d.total_amount) || 0) - disc), remaining_amount: 0 }
    : { total_amount: rnd2((Number(d.total_amount) || 0) - disc), remaining_amount: newRemaining }
  const { error: upErr } = await supabase.from("debts").update(upd).eq("id", debtId)
  if (upErr) throw upErr
  return { remaining: newRemaining, discounted: disc }
}

// Mükerrer müşteri birleştirme: "kaynak" müşterinin tüm satış, tamir, borç, randevu,
// garanti ve kasa kayıtları "hedef" müşteriye taşınır, sonra kaynak müşteri silinir.
export async function mergeCustomers(sourceId: string, targetId: string): Promise<{ moved: number }> {
  if (sourceId === targetId) throw new Error("Aynı müşteri seçildi.")
  const { data: src, error: e1 } = await supabase.from("customers").select("*").eq("id", sourceId).single()
  const { data: tgt, error: e2 } = await supabase.from("customers").select("*").eq("id", targetId).single()
  if (e1 || e2 || !src || !tgt) throw new Error("Müşteri kaydı bulunamadı.")

  let moved = 0
  const count = (n: number | null | undefined) => { moved += n || 0 }

  // Satışlar: ID, kod veya (kodsuz eski kayıtlarda) tam isim eşleşmesi
  const salePatch = { customer_id: tgt.id, customer_name: tgt.name, customer_code: tgt.customer_code, customer_phone: tgt.phone }
  const byId = await supabase.from("sales").update(salePatch).eq("customer_id", src.id).select("id")
  if (byId.error) throw byId.error
  count(byId.data?.length)
  if (src.customer_code) {
    const byCode = await supabase.from("sales").update(salePatch).eq("customer_code", src.customer_code).select("id")
    if (byCode.error) throw byCode.error
    count(byCode.data?.length)
  }
  const byName = await supabase.from("sales").update(salePatch).is("customer_id", null).is("customer_code", null).eq("customer_name", src.name).select("id")
  if (byName.error) throw byName.error
  count(byName.data?.length)

  // Tamirler
  const repairPatch = { customer_name: tgt.name, customer_code: tgt.customer_code }
  if (src.customer_code) {
    const r1 = await supabase.from("devices").update(repairPatch).eq("customer_code", src.customer_code).select("id")
    if (r1.error) throw r1.error
    count(r1.data?.length)
  }
  const r2 = await supabase.from("devices").update(repairPatch).is("customer_code", null).eq("customer_name", src.name).select("id")
  if (r2.error) throw r2.error
  count(r2.data?.length)

  // Borçlar
  const d = await supabase.from("debts").update({ customer_id: tgt.id }).eq("customer_id", src.id).select("id")
  if (d.error) throw d.error
  count(d.data?.length)

  // İsimle tutulan kayıtlar (hata verirse birleştirmeyi durdurmaz)
  for (const table of ["appointments", "warranties"]) {
    const r = await supabase.from(table).update({ customer_name: tgt.name }).eq("customer_name", src.name).select("id")
    if (r.error) console.error(`${table} güncellenemedi:`, r.error)
    else count(r.data?.length)
  }
  const t = await supabase.from("transactions").update({ customer: tgt.name }).eq("customer", src.name).select("id")
  if (t.error) console.error("Kasa kayıtları güncellenemedi:", t.error)

  // Hedefte boş olan iletişim bilgilerini kaynaktan tamamla
  const fill: Record<string, unknown> = {}
  if (!tgt.phone2 && src.phone2) fill.phone2 = src.phone2
  if (!tgt.email && src.email) fill.email = src.email
  if (!tgt.address && src.address) fill.address = src.address
  if (!tgt.birth_date && src.birth_date) fill.birth_date = src.birth_date
  if (Object.keys(fill).length > 0) await supabase.from("customers").update(fill).eq("id", tgt.id)

  const del = await supabase.from("customers").delete().eq("id", src.id).select("id")
  if (del.error) throw del.error
  if (!del.data || del.data.length === 0) throw new Error("Kayıtlar taşındı ancak eski müşteri silinemedi (silme yetkisi sadece Yönetici'dedir).")

  logActivity("Müşteriler", "updated", `${src.name} müşterisi ${tgt.name} ile birleştirildi (${moved} kayıt taşındı)`)
  return { moved }
}

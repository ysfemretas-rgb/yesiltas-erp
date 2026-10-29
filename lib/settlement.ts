// İndirimli borç kapatma: müşteri tahsilatı ve tedarikçi ödemesinde "300 öde, kalan 50'yi indirim say".
// Kasaya yalnızca GERÇEK ödenen yazılır; indirim satış/tamir/alış kaydının tutarını düşürür ve ayrıca
// settlement_discounts tablosunda izlenir (SQL: supabase-fixes-v12-migration.sql).
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { localDateStr } from "@/lib/dates"
import { planSettlement, r2, OpenItem, SettlementPlan } from "@/lib/settlementMath"
import { collectBalance, discountBalance, collectManualDebt, discountManualDebt } from "@/lib/customers"
import { fetchPurchases, paySupplierDebt, discountPurchase } from "@/lib/purchases"
import { fetchSales } from "@/lib/sales"
import { fetchRepairs } from "@/lib/repairs"

export interface SettlementDiscount {
  id: string
  kind: "customer" | "supplier"
  partyName: string
  amount: number
  note: string
  ref: string
  date: string
  createdBy: string
}

function discountFromRow(r: any): SettlementDiscount {
  return {
    id: r.id,
    kind: r.kind === "supplier" ? "supplier" : "customer",
    partyName: r.party_name ?? "",
    amount: Number(r.amount) || 0,
    note: r.note ?? "",
    ref: r.ref ?? "",
    date: String(r.date ?? "").slice(0, 10),
    createdBy: r.created_by ?? "",
  }
}

export async function fetchSettlementDiscounts(): Promise<SettlementDiscount[]> {
  const { data, error } = await supabase.from("settlement_discounts").select("*").order("date", { ascending: false }).limit(2000)
  if (error) throw error
  return (data || []).map(discountFromRow)
}

function currentUserName(): string {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("yt_user") : null
    return raw ? JSON.parse(raw).name || "" : ""
  } catch {
    return ""
  }
}

async function recordDiscount(kind: "customer" | "supplier", partyName: string, amount: number, note: string, ref: string): Promise<string | null> {
  if (!(amount > 0)) return null
  const { error } = await supabase.from("settlement_discounts").insert({ kind, party_name: partyName, amount: r2(amount), note, ref, date: localDateStr(), created_by: currentUserName() })
  if (error) {
    console.error("İndirim kaydı yazılamadı:", error)
    return "İndirim uygulandı ancak indirim kaydı yazılamadı (SQL v12 çalıştırıldı mı?)."
  }
  return null
}

// ---------- Müşteri ----------
// Müşterinin borcu, Müşteriler sayfasıyla AYNI kaynaktan hesaplanır: satışların + tamirlerin kalanı + elle eklenen borçlar
// (hediye ve iptal edilen satışlar hariç). Tahsilat/indirim bu kayıtların üzerinden yapılır, kasaya tahsilat yazılır.
export interface CustomerOpenItem extends OpenItem {
  kind: "sale" | "repair" | "manual"
  sourceId: string
  label: string
  date: string
}

type SaleLike = { id: string; saleCode?: string; customerId?: string; customerCode?: string; customerName?: string; remaining: number; paymentMethod: string; status: string; date: string }
type RepairLike = { id: string; repairCode?: string; customerCode?: string; customerName?: string; remaining: number; paymentType: string; createdAt: string }
type CustomerLike = { id: string; name: string; customerCode: string; debts?: { id: string; amount: number; description: string; date: string; status: string; source?: string }[] }

export function computeCustomerOpenItems(customers: CustomerLike[], sales: SaleLike[], repairs: RepairLike[]): Map<string, CustomerOpenItem[]> {
  const nameCounts = new Map<string, number>()
  customers.forEach((c) => { const k = (c.name || "").trim().toLowerCase(); if (k) nameCounts.set(k, (nameCounts.get(k) || 0) + 1) })
  // Müşteriler sayfasıyla aynı eşleştirme: önce müşteri id'si, sonra müşteri kodu, en son (benzersizse) ad
  const belongs = (c: CustomerLike, rec: { customerId?: string; customerCode?: string; customerName?: string }) => {
    if (rec.customerId) return rec.customerId === c.id
    if (rec.customerCode) return rec.customerCode === c.customerCode
    const key = (c.name || "").trim().toLowerCase()
    return !!key && (rec.customerName || "").trim().toLowerCase() === key && (nameCounts.get(key) || 0) === 1
  }
  const map = new Map<string, CustomerOpenItem[]>()
  for (const c of customers) {
    const items: CustomerOpenItem[] = []
    for (const s of sales) {
      if (s.status === "cancelled" || s.paymentMethod === "gift" || !(s.remaining > 0.004) || !belongs(c, s)) continue
      items.push({ id: `sale:${s.id}`, kind: "sale", sourceId: s.id, remaining: r2(s.remaining), label: `Satış ${s.saleCode || ""}`.trim(), date: s.date })
    }
    for (const r of repairs) {
      if (r.paymentType === "gift" || !(r.remaining > 0.004) || !belongs(c, r)) continue
      items.push({ id: `repair:${r.id}`, kind: "repair", sourceId: r.id, remaining: r2(r.remaining), label: `Tamir ${r.repairCode || ""}`.trim(), date: r.createdAt })
    }
    for (const d of c.debts || []) {
      if (d.status !== "unpaid" || (d.source ?? "manual") !== "manual" || !(d.amount > 0.004)) continue
      items.push({ id: `manual:${d.id}`, kind: "manual", sourceId: d.id, remaining: r2(d.amount), label: d.description || "Elle borç", date: d.date })
    }
    items.sort((a, b) => String(a.date).localeCompare(String(b.date)))
    map.set(c.id, items)
  }
  return map
}

export async function loadCustomerOpenItems(customers: CustomerLike[]): Promise<Map<string, CustomerOpenItem[]>> {
  const [sales, repairs] = await Promise.all([fetchSales(), fetchRepairs()])
  return computeCustomerOpenItems(customers, sales as any, repairs as any)
}

export async function settleCustomerDebts(
  customer: CustomerLike,
  allCustomers: CustomerLike[],
  pay: number,
  discount: number,
  note = ""
): Promise<{ plan: SettlementPlan; warning?: string }> {
  const items = (await loadCustomerOpenItems(allCustomers)).get(customer.id) || []
  const plan = planSettlement(items, pay, discount)
  const byId = new Map(items.map((d) => [d.id, d]))
  for (const a of plan.pays) {
    const d = byId.get(a.id)!
    if (d.kind === "sale") await collectBalance("sale", d.sourceId, a.amount)
    else if (d.kind === "repair") await collectBalance("repair", d.sourceId, a.amount)
    else await collectManualDebt(d.sourceId, a.amount, customer.name)
  }
  for (const a of plan.discounts) {
    const d = byId.get(a.id)!
    if (d.kind === "sale") await discountBalance("sale", d.sourceId, a.amount)
    else if (d.kind === "repair") await discountBalance("repair", d.sourceId, a.amount)
    else await discountManualDebt(d.sourceId, a.amount)
  }
  const warning = (await recordDiscount("customer", customer.name, plan.discountTotal, note, "")) || undefined
  logActivity("Müşteriler", "updated", `${customer.name} — borç kapatma: ${plan.payTotal} TL tahsil, ${plan.discountTotal} TL indirim, kalan ${plan.remainingAfter} TL`)
  return { plan, warning }
}

// ---------- Tedarikçi ----------
const LEGACY_ID = "__legacy__"

// netDebt: Tedarikçiler sayfasında görünen toplam borç (eski ürün borcu + alışların kalanı − genel ödemeler)
export async function settleSupplierDebt(
  supplierName: string,
  netDebt: number,
  pay: number,
  discount: number,
  note = ""
): Promise<{ plan: SettlementPlan; warning?: string }> {
  const purchases = (await fetchPurchases()).filter((p) => p.kind === "supplier" && p.partyName === supplierName)
  purchases.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
  const open: OpenItem[] = purchases.map((p) => ({ id: p.id, remaining: r2(p.total - p.paid) })).filter((x) => x.remaining > 0.004)
  const purchasesRemaining = r2(open.reduce((s, x) => s + x.remaining, 0))
  const legacy = r2(netDebt - purchasesRemaining)
  if (legacy > 0.004) open.push({ id: LEGACY_ID, remaining: legacy })
  const plan = planSettlement(open, pay, discount)

  // Ödeme: mevcut genel ödeme işlevi (en eski alıştan başlar, artan eski ürün borcundan düşer; kasaya TEK gider yazar)
  if (plan.payTotal > 0.004) await paySupplierDebt(supplierName, plan.payTotal)
  // İndirim: alışların toplamı düşer; eski ürün borcuna düşen kısım kasasız "genel ödeme" olarak işlenir
  for (const a of plan.discounts) {
    if (a.id === LEGACY_ID) {
      const { error } = await supabase.from("supplier_payments").insert({ supplier_name: supplierName, amount: a.amount, payment_date: localDateStr(), note: `İndirim${note ? " — " + note : ""} (kasaya yazılmaz)` })
      if (error) throw error
    } else {
      await discountPurchase(a.id, a.amount)
    }
  }
  const warning = (await recordDiscount("supplier", supplierName, plan.discountTotal, note, "")) || undefined
  logActivity("Tedarikçiler", "updated", `${supplierName} — borç kapatma: ${plan.payTotal} TL ödeme, ${plan.discountTotal} TL indirim, kalan ${plan.remainingAfter} TL`)
  return { plan, warning }
}

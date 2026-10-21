// IMEI ile cihazın yaşam döngüsü: alış/takas, stok kaydı, tamirler ve satış.
import { dbDateToLocal } from "@/lib/dates"
import { supabase } from "@/lib/supabase"

export interface HistoryEvent {
  date: string
  kind: "alim" | "takas" | "stok" | "tamir" | "satis"
  title: string
  detail: string
  amount?: number // TL (alış maliyeti pozitif; satış fiyatı pozitif)
}

export interface DeviceHistory {
  imei: string
  events: HistoryEvent[]
  costTotal: number // alış/takas maliyeti
  saleTotal: number // satış fiyatı
  partsTotal: number // bu IMEI'ye ait tamirlerde kullanılan parça maliyeti
}

const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString("tr-TR")} TL`

export async function fetchDeviceHistory(imeiRaw: string): Promise<DeviceHistory> {
  const imei = imeiRaw.trim()
  const events: HistoryEvent[] = []
  let costTotal = 0
  let saleTotal = 0
  let partsTotal = 0

  const [purchases, inv, repairs, salesByItem, salesByTrade] = await Promise.all([
    supabase.from("device_purchases").select("doc_code, seller_name, device_name, price, purchase_date").eq("imei", imei),
    supabase.from("inventory").select("name, product_code, quantity, purchase_price, sale_price, created_at").eq("imei", imei),
    supabase.from("devices").select("repair_code, customer_name, brand, model, status, cost, parts_cost, received_date").eq("imei", imei),
    supabase.from("sales").select("sale_code, customer_name, sale_date, sale_status, items").contains("items", [{ imei }]),
    supabase.from("sales").select("sale_code, customer_name, sale_date, sale_status, trade_in").filter("trade_in->>imei", "eq", imei),
  ])

  for (const p of purchases.data || []) {
    const price = Number(p.price) || 0
    costTotal += price
    events.push({ date: String(p.purchase_date || "").slice(0, 10), kind: "alim", title: `İkinci el alım (${p.doc_code || "belge"})`, detail: `${p.seller_name || "—"}'dan ${p.device_name} alındı`, amount: price })
  }
  for (const s of salesByTrade.data || []) {
    const value = Number((s as any).trade_in?.value) || 0
    costTotal += value
    events.push({ date: String(s.sale_date || "").slice(0, 10), kind: "takas", title: `Takas alındı (${s.sale_code || "satış"})`, detail: `${s.customer_name || "—"} müşterisinden ${(s as any).trade_in?.name || "cihaz"} takasla alındı`, amount: value })
  }
  for (const i of inv.data || []) {
    events.push({ date: dbDateToLocal(i.created_at), kind: "stok", title: `Stok kaydı: ${i.name}`, detail: `${i.product_code || ""} • stok ${i.quantity ?? 0} • alış ${money(Number(i.purchase_price) || 0)} • satış fiyatı ${money(Number(i.sale_price) || 0)}` })
  }
  for (const r of repairs.data || []) {
    const parts = Number(r.parts_cost) || 0
    partsTotal += parts
    events.push({ date: dbDateToLocal(r.received_date), kind: "tamir", title: `Tamir ${r.repair_code || ""}`.trim(), detail: `${r.customer_name || "—"} • ${r.brand || ""} ${r.model || ""} • ücret ${money(Number(r.cost) || 0)}${parts ? ` • parça maliyeti ${money(parts)}` : ""}`, amount: undefined })
  }
  for (const s of salesByItem.data || []) {
    if (s.sale_status === "cancelled") continue
    const item = (Array.isArray((s as any).items) ? (s as any).items : []).find((it: any) => it?.imei === imei)
    const price = item ? (Number(item.price) || 0) * (Number(item.quantity) || 1) : 0
    saleTotal += price
    events.push({ date: String(s.sale_date || "").slice(0, 10), kind: "satis", title: `Satıldı (${s.sale_code || "satış"})`, detail: `${s.customer_name || "—"} müşterisine satıldı`, amount: price })
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { imei, events, costTotal, saleTotal, partsTotal }
}

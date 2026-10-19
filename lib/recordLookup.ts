// Kod okutma ve genel arama. Kod ön ekleri: YTM-müşteri, YTS-satış, YTT-tamir, YTE-ürün.
import { supabase } from "@/lib/supabase"
import { RecordKind, recordPath } from "@/lib/labels"

export interface FoundRecord {
  kind: RecordKind
  id: string
  title: string
  subtitle: string
  code: string
  href: string
}

function make(kind: RecordKind, id: string, title: string, subtitle: string, code: string): FoundRecord {
  return { kind, id, title, subtitle, code, href: recordPath(kind, id) }
}

// PostgREST .or() filtresini bozan karakterleri temizler
function clean(term: string): string {
  return term.replace(/[,()%*\\"']/g, " ").trim()
}

// Okutulan metinden doğrudan kayıt çıkarır: karekod bağlantısı ya da kod.
export async function resolveScan(raw: string): Promise<FoundRecord | null> {
  const text = (raw || "").trim()
  if (!text) return null

  // Karekod bağlantıları
  const repairMatch = text.match(/\/repair-status\/([0-9a-fA-F-]{36})/)
  if (repairMatch) return (await byId("repair", repairMatch[1]))
  const openMatch = text.match(/\/dashboard\/(customers|sales|repairs|inventory)\?open=([0-9a-fA-F-]{36})/)
  if (openMatch) {
    const kind: RecordKind = openMatch[1] === "customers" ? "customer" : openMatch[1] === "sales" ? "sale" : openMatch[1] === "repairs" ? "repair" : "product"
    return await byId(kind, openMatch[2])
  }

  const code = text.toUpperCase()
  if (/^YTM-\d+$/.test(code)) return await byCode("customer", code)
  if (/^YTS-\d+$/.test(code)) return await byCode("sale", code)
  if (/^YTT-\d+$/.test(code)) return await byCode("repair", code)
  if (/^YTE-\d+$/.test(code)) return await byCode("product", code)

  // Satıcı barkodu veya IMEI
  const { data: inv } = await supabase.from("inventory").select("id, name, product_code").eq("supplier_barcode", text).limit(1)
  if (inv && inv[0]) return make("product", inv[0].id, inv[0].name, "Ürün", inv[0].product_code || "")
  if (/^\d{15}$/.test(text)) {
    const { data: dev } = await supabase.from("devices").select("id, repair_code, brand, model, customer_name").eq("imei", text).limit(1)
    if (dev && dev[0]) return make("repair", dev[0].id, `${dev[0].brand || ""} ${dev[0].model || ""}`.trim(), dev[0].customer_name || "", dev[0].repair_code || "")
  }
  return null
}

async function byCode(kind: RecordKind, code: string): Promise<FoundRecord | null> {
  if (kind === "customer") {
    const { data } = await supabase.from("customers").select("id, name, phone, customer_code").eq("customer_code", code).limit(1)
    return data && data[0] ? make("customer", data[0].id, data[0].name, data[0].phone || "", data[0].customer_code) : null
  }
  if (kind === "sale") {
    const { data } = await supabase.from("sales").select("id, sale_code, customer_name, total_price, sale_date").eq("sale_code", code).limit(1)
    return data && data[0] ? make("sale", data[0].id, data[0].customer_name || "Satış", `${data[0].sale_date || ""} • ${Number(data[0].total_price || 0).toLocaleString("tr-TR")} TL`, data[0].sale_code) : null
  }
  if (kind === "repair") {
    const { data } = await supabase.from("devices").select("id, repair_code, brand, model, customer_name").eq("repair_code", code).limit(1)
    return data && data[0] ? make("repair", data[0].id, `${data[0].brand || ""} ${data[0].model || ""}`.trim() || "Tamir", data[0].customer_name || "", data[0].repair_code) : null
  }
  const { data } = await supabase.from("inventory").select("id, name, product_code, quantity").eq("product_code", code).limit(1)
  return data && data[0] ? make("product", data[0].id, data[0].name, `Stok: ${data[0].quantity ?? 0}`, data[0].product_code) : null
}

async function byId(kind: RecordKind, id: string): Promise<FoundRecord | null> {
  if (kind === "customer") {
    const { data } = await supabase.from("customers").select("id, name, phone, customer_code").eq("id", id).limit(1)
    return data && data[0] ? make("customer", data[0].id, data[0].name, data[0].phone || "", data[0].customer_code || "") : null
  }
  if (kind === "sale") {
    const { data } = await supabase.from("sales").select("id, sale_code, customer_name, total_price, sale_date").eq("id", id).limit(1)
    return data && data[0] ? make("sale", data[0].id, data[0].customer_name || "Satış", `${data[0].sale_date || ""} • ${Number(data[0].total_price || 0).toLocaleString("tr-TR")} TL`, data[0].sale_code || "") : null
  }
  if (kind === "repair") {
    const { data } = await supabase.from("devices").select("id, repair_code, brand, model, customer_name").eq("id", id).limit(1)
    return data && data[0] ? make("repair", data[0].id, `${data[0].brand || ""} ${data[0].model || ""}`.trim() || "Tamir", data[0].customer_name || "", data[0].repair_code || "") : null
  }
  const { data } = await supabase.from("inventory").select("id, name, product_code, quantity").eq("id", id).limit(1)
  return data && data[0] ? make("product", data[0].id, data[0].name, `Stok: ${data[0].quantity ?? 0}`, data[0].product_code || "") : null
}

// Genel arama: müşteri, satış, tamir ve ürünlerde tek kutudan arar.
export async function searchAll(term: string): Promise<FoundRecord[]> {
  const t = clean(term)
  if (t.length < 2) return []
  const like = `%${t}%`
  const [cust, sales, devs, inv] = await Promise.all([
    supabase.from("customers").select("id, name, phone, customer_code").or(`name.ilike.${like},phone.ilike.${like},customer_code.ilike.${like}`).limit(8),
    supabase.from("sales").select("id, sale_code, customer_name, total_price, sale_date").or(`sale_code.ilike.${like},customer_name.ilike.${like}`).order("created_at", { ascending: false }).limit(8),
    supabase.from("devices").select("id, repair_code, brand, model, customer_name, imei").or(`repair_code.ilike.${like},customer_name.ilike.${like},imei.ilike.${like},brand.ilike.${like},model.ilike.${like}`).order("received_date", { ascending: false }).limit(8),
    supabase.from("inventory").select("id, name, product_code, quantity, supplier_barcode").or(`name.ilike.${like},product_code.ilike.${like},supplier_barcode.ilike.${like},sku.ilike.${like}`).limit(8),
  ])
  const out: FoundRecord[] = []
  ;(cust.data || []).forEach((r: any) => out.push(make("customer", r.id, r.name, r.phone || "", r.customer_code || "")))
  ;(sales.data || []).forEach((r: any) => out.push(make("sale", r.id, r.customer_name || "Satış", `${r.sale_date || ""} • ${Number(r.total_price || 0).toLocaleString("tr-TR")} TL`, r.sale_code || "")))
  ;(devs.data || []).forEach((r: any) => out.push(make("repair", r.id, `${r.brand || ""} ${r.model || ""}`.trim() || "Tamir", r.customer_name || "", r.repair_code || "")))
  ;(inv.data || []).forEach((r: any) => out.push(make("product", r.id, r.name, `Stok: ${r.quantity ?? 0}`, r.product_code || "")))
  return out
}

// İkinci el cihaz alımı: müşteriden cihaz alınır, alım belgesi düzenlenir, kasaya gider yazılır
// ve (isteğe bağlı) cihaz "İkinci El" olarak stoğa eklenir.
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { createTransaction } from "@/lib/finance"
import { createInventoryItem, findActiveImeiConflict, InventoryItem } from "@/lib/inventory"
import { localDateStr } from "@/lib/dates"
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

export interface DevicePurchaseInput {
  sellerName: string
  sellerPhone: string
  sellerIdNo: string
  deviceName: string
  imei: string
  conditionNote: string
  price: number
  addToStock: boolean
  salePrice?: number
}

export interface DevicePurchase {
  id: string
  docCode: string
  sellerName: string
  sellerPhone: string
  sellerIdNo: string
  deviceName: string
  imei: string
  conditionNote: string
  price: number
  date: string
}

function newDocCode(): string {
  const d = localDateStr().replace(/-/g, "")
  return `YTA-${d}-${String(Math.floor(Math.random() * 900) + 100)}`
}

export async function createDevicePurchase(input: DevicePurchaseInput): Promise<{ purchase: DevicePurchase; item: InventoryItem | null }> {
  // Aynı IMEI iki aktif stok kaydında olamaz: belge ve gider oluşmadan önce kontrol edilir
  if (input.addToStock && input.imei.trim()) {
    const conflict = await findActiveImeiConflict(input.imei)
    if (conflict) throw new Error(`Bu IMEI zaten stokta kayıtlı: ${conflict.name}${conflict.productCode ? ` (${conflict.productCode})` : ""}.`)
  }
  const docCode = newDocCode()
  const date = localDateStr()
  const { data, error } = await supabase.from("device_purchases").insert({
    doc_code: docCode,
    seller_name: input.sellerName,
    seller_phone: input.sellerPhone,
    device_name: input.deviceName,
    imei: input.imei,
    condition_note: input.conditionNote,
    price: input.price,
    purchase_date: date,
  }).select("*").single()
  if (error) throw error

  let item: InventoryItem | null = null
  if (input.addToStock) {
    try {
      item = await createInventoryItem({
        name: `${input.deviceName} (İkinci El)`,
        sku: "",
        category: "İkinci El",
        quantity: 1,
        minQuantity: 0,
        purchasePrice: input.price,
        purchaseCurrency: "TRY",
        profitMargin: 20,
        salePrice: input.salePrice && input.salePrice > 0 ? input.salePrice : Math.round(input.price * 1.2),
        supplier: "",
        location: "",
        paymentStatus: "paid",
        paidAmount: 0,
        imei: input.imei || undefined,
      })
      await supabase.from("device_purchases").update({ product_id: item.id }).eq("id", data.id)
    } catch (e) {
      console.error("Cihaz stoğa eklenemedi:", e)
    }
  }

  try {
    await createTransaction({
      type: "expense",
      category: "İkinci El Alımı",
      amount: input.price,
      description: `📱 İkinci el alım: ${input.deviceName} — ${input.sellerName} (${docCode})`,
      date,
      customer: input.sellerName,
      source: "manual",
    })
  } catch (e) {
    console.error("Alım kasaya yazılamadı:", e)
  }

  logActivity("Envanter", "created", `${input.deviceName} ikinci el cihaz alındı (${docCode})`)
  return {
    purchase: {
      id: data.id,
      docCode,
      sellerName: input.sellerName,
      sellerPhone: input.sellerPhone,
      sellerIdNo: input.sellerIdNo,
      deviceName: input.deviceName,
      imei: input.imei,
      conditionNote: input.conditionNote,
      price: input.price,
      date,
    },
    item,
  }
}

// Alım belgesi (resmi antetli, iki imza alanlı, A5). Yazdırma tarayıcı penceresiyle yapılır.
export function printPurchaseDocument(p: DevicePurchase) {
  const company = readCompany()
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Cihaz Alım Belgesi - ${esc(p.docCode)}</title>
<style>
  @page { size: A5; margin: 12mm; }
  ${docStyles()}
</style></head><body>
  ${toolbarHtml()}
  ${letterheadHtml(company)}
  <div class="doc-title">İkinci El Cihaz Alım Belgesi</div>
  <div class="meta"><span>Belge No: <strong>${esc(p.docCode)}</strong></span><span>Tarih: <strong>${esc(p.date)}</strong></span></div>
  <table class="grid kv">
    <tr><td class="l">Satıcı (Ad Soyad)</td><td class="v">${esc(p.sellerName)}</td></tr>
    <tr><td class="l">Telefon</td><td class="v">${esc(p.sellerPhone || "-")}</td></tr>
    <tr><td class="l">T.C. Kimlik No</td><td class="v">${esc(p.sellerIdNo || "-")}</td></tr>
    <tr><td class="l">Cihaz</td><td class="v">${esc(p.deviceName)}</td></tr>
    <tr><td class="l">IMEI / Seri No</td><td class="v">${esc(p.imei || "-")}</td></tr>
    <tr><td class="l">Cihaz Durumu</td><td class="v">${esc(p.conditionNote || "-")}</td></tr>
  </table>
  <div class="totals"><div class="row strong"><span>Ödenen Tutar</span><span>${money(p.price)}</span></div></div>
  <div class="note">Satıcı, yukarıda bilgileri yazılı cihazın kendisine ait olduğunu, çalıntı/kayıp ya da haczli olmadığını, üzerinde üçüncü kişi hakkı bulunmadığını ve cihazı yukarıdaki bedel karşılığında devrettiğini kabul ve beyan eder.</div>
  <div class="sigs"><div class="sig"><div class="line"></div>Satıcı (Ad Soyad / İmza)</div><div class="sig"><div class="line"></div>Alan (Yetkili / İmza)</div></div>
  ${footerHtml("İkinci el cihaz alım belgesi — iki nüsha düzenlenir.", company)}
</body></html>`
  openPrintWindow(html)
}

export async function fetchDevicePurchases(): Promise<DevicePurchase[]> {
  const { data, error } = await supabase.from("device_purchases").select("*").order("created_at", { ascending: false }).limit(1000)
  if (error) throw error
  return (data || []).map((r: any) => ({
    id: r.id,
    docCode: r.doc_code ?? "",
    sellerName: r.seller_name ?? "",
    sellerPhone: r.seller_phone ?? "",
    sellerIdNo: "",
    deviceName: r.device_name ?? "",
    imei: r.imei ?? "",
    conditionNote: r.condition_note ?? "",
    price: Number(r.price) || 0,
    date: r.purchase_date ? String(r.purchase_date).slice(0, 10) : "",
  }))
}

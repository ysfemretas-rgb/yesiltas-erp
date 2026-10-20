// Alışlar: tedarikçiden toptan alış ve müşteriden (ikinci el) alış. Tek akış:
//  - ürünler envantere otomatik eklenir (yeni ürün) ya da mevcut ürünün stoğu artar,
//  - ödenen tutar kasaya GİDER olarak yazılır, ödenmeyen kısım tedarikçi borcu olur,
//  - alınan ürünler hemen Satışlar sayfasında satılabilir.
// Hata olursa: stok değişiklikleri geri alınır, hiçbir kayıt yarım kalmaz; kasa yazımı gibi sonradan
// başarısız olabilen adımlar `warnings` olarak döner (sessizce yutulmaz).
import { supabase, fetchAllRows } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { localDateStr } from "@/lib/dates"
import { createTransaction } from "@/lib/finance"
import { InventoryItem, createInventoryItem, updateInventoryItem, adjustInventoryQuantity, findActiveImeiConflict } from "@/lib/inventory"
import { Currency, paymentStatusOf, purchaseTotal, allocatePayment } from "@/lib/purchaseMath"

export interface PurchaseLine {
  inventoryId?: string // mevcut ürüne stok eklemek için; yeni ürünse kayıttan sonra doldurulur
  isNew: boolean
  name: string
  category: string
  quantity: number
  unitPrice: number
  currency: Currency
  rate: number // kayıt anındaki kur (TL için 1)
  unitCostTRY: number
  salePrice: number // TL; 0 veya boşsa mevcut fiyat korunur / marjdan hesaplanır
  profitMargin: number
  minQuantity: number
  imei?: string
  conditionNote?: string
  productCode?: string // kayıttan sonra
}

export interface Purchase {
  id: string
  code: string
  kind: "supplier" | "customer"
  partyName: string
  partyPhone: string
  invoiceNo: string
  date: string
  items: PurchaseLine[]
  total: number
  paid: number
  note: string
  createdBy: string
  createdAt: string
}

function fromRow(r: any): Purchase {
  return {
    id: r.id,
    code: r.purchase_code ?? "",
    kind: r.kind === "customer" ? "customer" : "supplier",
    partyName: r.party_name ?? "",
    partyPhone: r.party_phone ?? "",
    invoiceNo: r.invoice_no ?? "",
    date: r.purchase_date ? String(r.purchase_date).slice(0, 10) : "",
    items: Array.isArray(r.items) ? r.items : [],
    total: Number(r.total_try) || 0,
    paid: Number(r.paid_amount) || 0,
    note: r.note ?? "",
    createdBy: r.created_by ?? "",
    createdAt: r.created_at ?? "",
  }
}

function actor(): string {
  try {
    return JSON.parse(localStorage.getItem("yt_user") || "{}")?.name || ""
  } catch {
    return ""
  }
}

function newCode(): string {
  return `ALS-${localDateStr().replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const rows = await fetchAllRows("purchases", "created_at", false)
  return rows.map(fromRow)
}

export interface CreatePurchaseInput {
  kind: "supplier" | "customer"
  partyName: string
  partyPhone?: string
  invoiceNo?: string
  date?: string
  lines: PurchaseLine[]
  paid: number
  note?: string
}

// Alış üst kaydını yazar (kod çakışırsa yeni kodla birkaç kez dener)
async function insertPurchaseHeader(h: {
  code: string
  kind: "supplier" | "customer"
  partyName: string
  partyPhone?: string
  invoiceNo?: string
  date: string
  lines: PurchaseLine[]
  total: number
  paid: number
  note?: string
}): Promise<Purchase> {
  let row: any = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const useCode = attempt === 0 ? h.code : newCode()
    const { data, error } = await supabase
      .from("purchases")
      .insert({
        purchase_code: useCode,
        kind: h.kind,
        party_name: h.partyName.trim(),
        party_phone: h.partyPhone?.trim() || "",
        invoice_no: h.invoiceNo?.trim() || "",
        purchase_date: h.date,
        items: h.lines,
        total_try: h.total,
        paid_amount: h.paid,
        note: h.note?.trim() || "",
        created_by: actor(),
      })
      .select("*")
      .single()
    if (!error) { row = data; break }
    if ((error as any).code !== "23505") throw error // sadece kod çakışmasında yeniden dene
  }
  if (!row) throw new Error("Alış kodu üretilemedi, tekrar deneyin.")
  return fromRow(row)
}

export async function createPurchase(input: CreatePurchaseInput): Promise<{ purchase: Purchase; warnings: string[] }> {
  const warnings: string[] = []
  const date = input.date || localDateStr()
  if (!input.partyName.trim()) throw new Error(input.kind === "supplier" ? "Tedarikçi seçin." : "Satıcı (müşteri) adını girin.")
  if (input.lines.length === 0) throw new Error("En az bir ürün ekleyin.")
  for (const l of input.lines) {
    if (!l.name.trim()) throw new Error("Ürün adı boş olamaz.")
    if (!(l.quantity > 0)) throw new Error(`${l.name}: adet 0'dan büyük olmalı.`)
    if (!(l.unitPrice >= 0)) throw new Error(`${l.name}: alış fiyatı geçersiz.`)
  }
  const total = purchaseTotal(input.lines)
  if (input.paid < -0.009 || input.paid > total + 0.009) throw new Error("Ödenen tutar 0 ile toplam tutar arasında olmalı.")

  // Aynı IMEI iki aktif stok kaydında olamaz (satırlar arasında ve mevcut stokla)
  const seen = new Set<string>()
  for (const l of input.lines) {
    const imei = (l.imei || "").trim()
    if (!imei || !l.isNew) continue
    if (seen.has(imei)) throw new Error(`Aynı IMEI listede iki kez var: ${imei}`)
    seen.add(imei)
    const conflict = await findActiveImeiConflict(imei)
    if (conflict) throw new Error(`Bu IMEI zaten stokta kayıtlı: ${conflict.name}${conflict.productCode ? ` (${conflict.productCode})` : ""}.`)
  }

  const code = newCode()
  const supplierName = input.kind === "supplier" ? input.partyName.trim() : ""

  // 1) Envanter: yeni ürünler oluşturulur, mevcutların stoğu artırılır. Hata olursa yapılanlar geri alınır.
  const applied: { id: string; qty: number; name: string }[] = []
  const finalLines: PurchaseLine[] = []
  const rollback = async () => {
    for (const a of applied) {
      await adjustInventoryQuantity(a.id, -a.qty, `Alış ${code} geri alındı (hata)`, a.name).catch((e) => console.error("Geri alma hatası:", e))
    }
  }
  try {
    for (const l of input.lines) {
      if (l.isNew) {
        const item = await createInventoryItem({
          name: l.name.trim(),
          sku: "",
          category: l.category || "Diğer",
          quantity: l.quantity,
          minQuantity: l.minQuantity,
          purchasePrice: l.unitPrice,
          purchaseCurrency: l.currency,
          profitMargin: l.profitMargin,
          salePrice: l.salePrice,
          supplier: supplierName,
          location: "",
          // Borç takibi artık alış kaydında tutulur; ürün kaydı "ödendi" işaretlenir (çift sayım olmasın)
          paymentStatus: "paid",
          paidAmount: 0,
          imei: l.imei?.trim() || undefined,
        })
        applied.push({ id: item.id, qty: l.quantity, name: item.name })
        finalLines.push({ ...l, inventoryId: item.id, productCode: item.productCode })
      } else {
        if (!l.inventoryId) throw new Error(`${l.name}: mevcut ürün bulunamadı.`)
        const { data: cur, error: curErr } = await supabase.from("inventory").select("quantity, total_purchased_qty, product_code").eq("id", l.inventoryId).single()
        if (curErr || !cur) throw curErr || new Error(`${l.name}: ürün bulunamadı.`)
        await adjustInventoryQuantity(l.inventoryId, l.quantity, `Alış ${code}`, l.name)
        applied.push({ id: l.inventoryId, qty: l.quantity, name: l.name })
        const patch: Partial<InventoryItem> = {
          purchasePrice: l.unitPrice,
          purchaseCurrency: l.currency,
          purchasedQuantity: (cur.total_purchased_qty != null ? Number(cur.total_purchased_qty) : Number(cur.quantity) || 0) + l.quantity,
        }
        if (supplierName) patch.supplier = supplierName
        if (l.salePrice > 0) patch.salePrice = l.salePrice
        await updateInventoryItem(l.inventoryId, patch)
        finalLines.push({ ...l, productCode: cur.product_code || l.productCode })
      }
    }
  } catch (e) {
    await rollback()
    throw e
  }

  // 2) Alış kaydı (üst bilgi + satırlar)
  let purchase: Purchase
  try {
    purchase = await insertPurchaseHeader({
      code,
      kind: input.kind,
      partyName: input.partyName,
      partyPhone: input.partyPhone,
      invoiceNo: input.invoiceNo,
      date,
      lines: finalLines,
      total,
      paid: input.paid,
      note: input.note,
    })
  } catch (e) {
    await rollback()
    throw e
  }

  // 3) Kasa: ödenen kısım gider olarak yazılır
  if (input.paid > 0.009) {
    try {
      await createTransaction({
        type: "expense",
        category: input.kind === "supplier" ? "Stok Alımı" : "İkinci El Alımı",
        amount: input.paid,
        description: `📦 Alış ${purchase.code}: ${purchase.partyName} — ${finalLines.map((l) => `${l.name} x${l.quantity}`).join(", ").slice(0, 160)}`,
        date,
        customer: purchase.partyName,
        source: "manual",
      })
    } catch (e) {
      console.error("Alış kasaya yazılamadı:", e)
      warnings.push("Ödeme kasaya yazılamadı; Finans'tan gider ekleyin (Mutabakat bu eksiği gösterir).")
    }
  }

  logActivity("Envanter", "created", `Alış ${purchase.code}: ${purchase.partyName} — ${total.toLocaleString("tr-TR")} TL (${paymentStatusOf(total, input.paid) === "paid" ? "ödendi" : paymentStatusOf(total, input.paid) === "partial" ? "kısmi ödendi" : "ödenmedi"})`)
  return { purchase, warnings }
}

// Tek bir alışa ödeme (kalan borçtan)
export async function payPurchase(purchase: Purchase, amount: number): Promise<void> {
  const remaining = Math.round((purchase.total - purchase.paid) * 100) / 100
  if (!(amount > 0) || amount > remaining + 0.009) throw new Error("Tutar 0 ile kalan borç arasında olmalı.")
  await createTransaction({
    type: "expense",
    category: "Tedarikçi Ödemesi",
    amount,
    description: `🚚 Tedarikçi ödemesi: ${purchase.partyName} (${purchase.code})`,
    date: localDateStr(),
    customer: purchase.partyName,
    source: "manual",
  })
  const { error } = await supabase.from("purchases").update({ paid_amount: Math.round((purchase.paid + amount) * 100) / 100 }).eq("id", purchase.id)
  if (error) throw error
  logActivity("Tedarikçiler", "updated", `${purchase.partyName} — ${purchase.code} için ${amount.toLocaleString("tr-TR")} TL ödendi`)
}

// Tedarikçiye genel ödeme: önce en eski ödenmemiş alışlara dağıtılır, artan tutar genel ödeme olarak
// (eski sistemdeki ürün borçlarından düşer) kaydedilir. Kasaya tek bir gider yazılır.
export async function paySupplierDebt(supplierName: string, amount: number): Promise<{ allocated: number; leftover: number }> {
  if (!(amount > 0)) throw new Error("Geçerli bir tutar girin.")
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("kind", "supplier")
    .eq("party_name", supplierName)
    .order("purchase_date", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) throw error
  type OpenRow = { p: Purchase; remaining: number }
  const open: OpenRow[] = ((data || []) as any[])
    .map((r: any): Purchase => fromRow(r))
    .map((p: Purchase): OpenRow => ({ p, remaining: Math.round((p.total - p.paid) * 100) / 100 }))
    .filter((x: OpenRow) => x.remaining > 0.009)
  const { allocations, leftover } = allocatePayment(open.map((x: OpenRow) => ({ id: x.p.id, remaining: x.remaining })), amount)

  const codes: string[] = []
  for (const a of allocations) {
    const target = open.find((x: OpenRow) => x.p.id === a.id)!.p
    const { error: upErr } = await supabase.from("purchases").update({ paid_amount: Math.round((target.paid + a.amount) * 100) / 100 }).eq("id", a.id)
    if (upErr) throw upErr
    codes.push(target.code)
  }
  if (leftover > 0.009) {
    const { error: payErr } = await supabase.from("supplier_payments").insert({ supplier_name: supplierName, amount: leftover, payment_date: localDateStr(), note: "Genel ödeme" })
    if (payErr) throw payErr
  }
  await createTransaction({
    type: "expense",
    category: "Tedarikçi Ödemesi",
    amount,
    description: `🚚 Tedarikçi ödemesi: ${supplierName}${codes.length ? ` (${codes.join(", ")})` : ""}`,
    date: localDateStr(),
    customer: supplierName,
    source: "manual",
  })
  logActivity("Tedarikçiler", "updated", `${supplierName} — ${amount.toLocaleString("tr-TR")} TL ödeme yapıldı`)
  return { allocated: Math.round((amount - leftover) * 100) / 100, leftover }
}

// Envanter formundan eklenen ürünün alışını (envantere zaten eklenmiş) Alışlar'a işler. Stok değişmez;
// sadece alış kaydı ve ödenen kısmın kasa gideri yazılır. (Ürünün eski "ödeme durumu" borç takibi
// kaldırılıp borç artık bu kayıttan izlenir; çağıran ürünü "paid" işaretlemelidir.)
export async function recordStockPurchase(
  item: InventoryItem,
  opts: { quantity: number; paid: number; rates: { USD: number; EUR: number }; note?: string }
): Promise<Purchase> {
  const rate = item.purchaseCurrency === "USD" ? opts.rates.USD : item.purchaseCurrency === "EUR" ? opts.rates.EUR : 1
  const cost = Math.round(item.purchasePrice * rate * 100) / 100
  const line: PurchaseLine = {
    inventoryId: item.id,
    isNew: true,
    name: item.name,
    category: item.category,
    quantity: opts.quantity,
    unitPrice: item.purchasePrice,
    currency: item.purchaseCurrency,
    rate,
    unitCostTRY: cost,
    salePrice: item.salePrice,
    profitMargin: item.profitMargin,
    minQuantity: item.minQuantity,
    imei: item.imei || undefined,
    productCode: item.productCode,
  }
  const total = purchaseTotal([line])
  const paid = Math.min(total, Math.max(0, opts.paid))
  const date = localDateStr()
  const purchase = await insertPurchaseHeader({
    code: newCode(),
    kind: "supplier",
    partyName: item.supplier,
    date,
    lines: [line],
    total,
    paid,
    note: opts.note || "Envanterden stok girişi",
  })
  if (paid > 0.009) {
    await createTransaction({
      type: "expense",
      category: "Stok Alımı",
      amount: paid,
      description: `📦 Alış ${purchase.code}: ${purchase.partyName} — ${item.name} x${opts.quantity}`,
      date,
      customer: purchase.partyName,
      source: "manual",
    })
  }
  logActivity("Envanter", "created", `Alış ${purchase.code}: ${purchase.partyName} — ${total.toLocaleString("tr-TR")} TL`)
  return purchase
}

// Yanlış girilmiş / iade edilen alışı geri alır: en yeni alıştan başlayarak alış satırlarındaki adet azaltılır,
// alış toplamı ve borç düşer; ödenen tutar yeni toplamdan fazlaysa fark kasaya "Tedarikçi İadesi" geliri yazılır.
// Alışlarla karşılanamayan kısım (eski sistemde girilmiş stok) alınan adetten düşülür (eski borç hesabı).
// Stok da aynı adet kadar azalır.
export async function reduceStockPurchase(
  itemId: string,
  quantity: number
): Promise<{ reverted: { code: string; qty: number; refund: number }[]; legacyQty: number }> {
  if (!(quantity > 0)) throw new Error("Adet 0'dan büyük olmalı.")
  const { data: inv, error: invErr } = await supabase.from("inventory").select("id, name, supplier, quantity, total_purchased_qty").eq("id", itemId).single()
  if (invErr || !inv) throw invErr || new Error("Ürün bulunamadı.")
  const stock = Number(inv.quantity) || 0
  if (quantity > stock) throw new Error(`Stokta sadece ${stock} adet var.`)

  // Stok önce kontrollü düşülür (yetersizse hiçbir alış kaydı değişmez)
  await adjustInventoryQuantity(itemId, -quantity, "Alış düzeltmesi / iade", inv.name, true)

  const reverted: { code: string; qty: number; refund: number }[] = []
  let remaining = quantity
  try {
    const { data: rows, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("kind", "supplier")
      .eq("party_name", inv.supplier || "")
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) throw error
    for (const row of (rows || []) as any[]) {
      if (remaining <= 0) break
      const p = fromRow(row)
      const idx = p.items.findIndex((l) => l.inventoryId === itemId && l.quantity > 0)
      if (idx < 0) continue
      const take = Math.min(p.items[idx].quantity, remaining)
      const newLines = p.items.map((l, i) => (i === idx ? { ...l, quantity: l.quantity - take } : l)).filter((l) => l.quantity > 0)
      const newTotal = purchaseTotal(newLines)
      const newPaid = Math.min(p.paid, newTotal)
      const refund = Math.round((p.paid - newPaid) * 100) / 100
      const { error: upErr } = await supabase
        .from("purchases")
        .update({
          items: newLines,
          total_try: newTotal,
          paid_amount: newPaid,
          note: `${p.note ? p.note + " | " : ""}Düzeltme (${localDateStr()}): ${take} adet ${p.items[idx].name} geri alındı`.slice(0, 500),
        })
        .eq("id", p.id)
      if (upErr) throw upErr
      if (refund > 0.009) {
        await createTransaction({
          type: "income",
          category: "Tedarikçi İadesi",
          amount: refund,
          description: `↩️ Alış düzeltmesi/iade ${p.code}: ${p.partyName} — ${p.items[idx].name} x${take}`,
          date: localDateStr(),
          customer: p.partyName,
          source: "manual",
        })
      }
      reverted.push({ code: p.code, qty: take, refund })
      remaining -= take
    }
    // Alınan toplam adet düşer (eski ürün-bazlı borç hesabı ve mutabakat için)
    const purchased = Number(inv.total_purchased_qty != null ? inv.total_purchased_qty : stock)
    await updateInventoryItem(itemId, { purchasedQuantity: Math.max(0, purchased - quantity) })
  } catch (e) {
    // Alış kayıtları güncellenemediyse stok geri verilir
    await adjustInventoryQuantity(itemId, quantity, "Alış düzeltmesi başarısız — stok iadesi", inv.name).catch((err) => console.error(err))
    throw e
  }
  logActivity("Envanter", "updated", `${inv.name}: ${quantity} adet alış düzeltmesi/iade (${reverted.map((r) => r.code).join(", ") || "eski stok"})`)
  return { reverted, legacyQty: Math.max(0, remaining) }
}

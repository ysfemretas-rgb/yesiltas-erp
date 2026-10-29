// Yapıştırılan liste ve Excel satırlarını alış satırlarına (PurchaseLine) çevirir. (Saf okuma işi lib/purchaseList.ts'dedir.)
import { InventoryItem } from "@/lib/inventory"
import { PurchaseLine } from "@/lib/purchases"
import { Currency, rateFor, unitCostTRY, suggestedSalePrice } from "@/lib/purchaseMath"
import { lineNetUnitPrice } from "@/lib/settlementMath"
import { normKey } from "@/lib/purchaseList"

export interface LineCtx {
  inventory: InventoryItem[]
  currency: Currency
  category: string
  rates: { USD: number; EUR: number }
}

// Aynı adlı ürün (büyük/küçük harf fark etmez) envanterde varsa stoğuna eklenir, yoksa yeni ürün açılır.
export function makePurchaseLine(row: { name: string; quantity: number; price: number; discountPct: number }, ctx: LineCtx, byName?: Map<string, InventoryItem>): PurchaseLine {
  const map = byName || new Map(ctx.inventory.map((i): [string, InventoryItem] => [normKey(i.name), i]))
  const rate = rateFor(ctx.currency, ctx.rates)
  const net = row.discountPct > 0 ? lineNetUnitPrice(row.price, row.quantity, "pct", row.discountPct) : row.price
  const cost = unitCostTRY(net, ctx.currency, ctx.rates)
  const disc = row.discountPct > 0 ? { listPrice: row.price, lineDiscount: { type: "pct" as const, value: row.discountPct } } : {}
  const ex = map.get(normKey(row.name))
  if (ex) {
    return { isNew: false, inventoryId: ex.id, name: ex.name, category: ex.category, quantity: row.quantity, unitPrice: net, currency: ctx.currency, rate, unitCostTRY: cost, salePrice: 0, profitMargin: ex.profitMargin, minQuantity: ex.minQuantity, productCode: ex.productCode, ...disc }
  }
  return { isNew: true, name: row.name.trim(), category: ctx.category || "Diğer", quantity: row.quantity, unitPrice: net, currency: ctx.currency, rate, unitCostTRY: cost, salePrice: suggestedSalePrice(net, ctx.currency, 20, ctx.rates), profitMargin: 20, minQuantity: 0, ...disc }
}

// Excel satırlarını tedarikçiye göre gruplar: HİÇBİR şey kaydedilmeden önce tüm hatalar toplanır (bilinmeyen tedarikçi, geçersiz sayı vb.)
export interface ExcelPurchaseRow { supplier?: string; name?: string; category?: string; quantity?: number; listPrice?: number; discountPct?: number; currency?: string }

export function groupExcelPurchases(
  rows: ExcelPurchaseRow[],
  supplierNames: string[],
  inventory: InventoryItem[],
  rates: { USD: number; EUR: number },
  isFallback = false
): { groups: { supplierName: string; lines: PurchaseLine[] }[]; errors: string[] } {
  const errors: string[] = []
  const nameMap = new Map(supplierNames.map((n): [string, string] => [normKey(n), n]))
  const byName = new Map(inventory.map((i): [string, InventoryItem] => [normKey(i.name), i]))
  const groups = new Map<string, PurchaseLine[]>()
  rows.forEach((r, idx) => {
    const line = idx + 2 // Excel'de başlık 1. satır
    const supplier = nameMap.get(normKey(String(r.supplier || "")))
    const name = String(r.name || "").trim()
    const qty = Number(r.quantity)
    const price = Number(r.listPrice)
    const pct = Number(r.discountPct) || 0
    const cur = String(r.currency || "TRY").toUpperCase()
    if (!name) return errors.push(`Satır ${line}: ürün adı boş`)
    if (!supplier) return errors.push(`Satır ${line}: "${r.supplier || ""}" adlı kayıtlı tedarikçi yok (Tedarikçiler sayfasından ekleyin ya da adı aynen yazın)`)
    if (!(qty > 0) || Math.floor(qty) !== qty) return errors.push(`Satır ${line} (${name}): adet geçersiz`)
    if (!(price >= 0)) return errors.push(`Satır ${line} (${name}): liste fiyatı geçersiz`)
    if (!(pct >= 0 && pct <= 100)) return errors.push(`Satır ${line} (${name}): iskonto % geçersiz`)
    if (cur !== "TRY" && cur !== "USD" && cur !== "EUR") return errors.push(`Satır ${line} (${name}): para birimi TRY, USD veya EUR olmalı`)
    if (cur !== "TRY" && isFallback) return errors.push(`Satır ${line} (${name}): güncel döviz kuru alınamadı; dövizli alış şu an kaydedilemez`)
    const l = makePurchaseLine({ name, quantity: qty, price, discountPct: pct }, { inventory, currency: cur as Currency, category: String(r.category || "Diğer"), rates }, byName)
    groups.set(supplier, [...(groups.get(supplier) || []), l])
  })
  return { groups: Array.from(groups.entries()).map(([supplierName, lines]) => ({ supplierName, lines })), errors }
}

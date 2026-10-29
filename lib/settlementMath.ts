// İndirimle borç kapatma ve alış/satış iskontosu için SAF hesaplar (veritabanına dokunmaz; testle doğrulanır).

export const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

export interface OpenItem {
  id: string
  remaining: number
}

export interface SettlementPlan {
  pays: { id: string; amount: number }[]
  discounts: { id: string; amount: number }[]
  payTotal: number
  discountTotal: number
  totalOpen: number
  remainingAfter: number
}

// Ödenen tutar önce EN ESKİ borçtan başlayarak dağıtılır; indirim, ödemeden sonra kalan borçlara yine en eskiden başlayarak.
// Böylece "350 borç, 300 öde, 50 indirim" tek bir borçta ya da birden çok borçta aynı sonucu verir.
export function planSettlement(items: OpenItem[], pay: number, discount: number): SettlementPlan {
  const open = items.filter((i) => i.remaining > 0.004).map((i) => ({ id: i.id, remaining: r2(i.remaining) }))
  const totalOpen = r2(open.reduce((s, i) => s + i.remaining, 0))
  const p = r2(Math.max(0, pay))
  const d = r2(Math.max(0, discount))
  if (p + d > totalOpen + 0.004) throw new Error(`Ödenen + indirim (${r2(p + d)}) toplam borcu (${totalOpen}) aşıyor.`)
  if (p + d <= 0) throw new Error("Ödenen tutar ya da indirim girin.")
  const pays: { id: string; amount: number }[] = []
  const discounts: { id: string; amount: number }[] = []
  let left = p
  for (const it of open) {
    if (left <= 0.004) break
    const a = r2(Math.min(it.remaining, left))
    if (a > 0) { pays.push({ id: it.id, amount: a }); it.remaining = r2(it.remaining - a); left = r2(left - a) }
  }
  let dleft = d
  for (const it of open) {
    if (dleft <= 0.004) break
    const a = r2(Math.min(it.remaining, dleft))
    if (a > 0) { discounts.push({ id: it.id, amount: a }); it.remaining = r2(it.remaining - a); dleft = r2(dleft - a) }
  }
  const remainingAfter = r2(open.reduce((s, i) => s + i.remaining, 0))
  return { pays, discounts, payTotal: p, discountTotal: d, totalOpen, remainingAfter }
}

// İndirim girişi: "amount" ise doğrudan tutar, "pct" ise baz tutarın yüzdesi
export function discountAmount(type: "amt" | "pct", value: number, base: number): number {
  const v = Math.max(0, Number(value) || 0)
  const raw = type === "pct" ? (Math.max(0, base) * Math.min(v, 100)) / 100 : v
  return r2(Math.min(raw, Math.max(0, base)))
}

// Alış satırı: liste fiyatı, adet ve SATIR indirimi (tutar = satırın toplamından düşülür; yüzde = liste fiyatın yüzdesi)
// → net BİRİM fiyat (4 ondalık, maliyet hassas kalsın)
export function lineNetUnitPrice(listPrice: number, quantity: number, type: "amt" | "pct", value: number): number {
  const qty = Math.max(0, Number(quantity) || 0)
  const list = Math.max(0, Number(listPrice) || 0)
  if (qty <= 0) return list
  const lineTotal = list * qty
  const off = discountAmount(type, value, lineTotal)
  return Math.round(((lineTotal - off) / qty) * 10000) / 10000
}

// Genel iskonto (alışın tamamına) satırlara orantılı dağıtılır: her net birim fiyat bu çarpanla çarpılır
export function generalFactor(subtotalTRY: number, discountTRY: number): number {
  if (!(subtotalTRY > 0)) return 1
  const d = Math.max(0, Math.min(discountTRY, subtotalTRY))
  return (subtotalTRY - d) / subtotalTRY
}

// Bir alış kaydının toplamını (ödenmemiş kalanından) iskonto kadar azaltmak için satırları oranlar
export function scaleFactorForReduction(total: number, reduction: number): number {
  if (!(total > 0)) return 1
  const red = Math.max(0, Math.min(reduction, total))
  return (total - red) / total
}

// Yüzde olarak etkin iskonto: (liste - net) / liste
export function effectivePct(listTotal: number, netTotal: number): number {
  if (!(listTotal > 0)) return 0
  return Math.round(((listTotal - netTotal) / listTotal) * 10000) / 100
}

// Mutabakat: satış, tamir, ikinci el alım, stok ve taksit kayıtlarının kasa/borç kayıtlarıyla
// uyumunu kontrol eden SAF fonksiyon (hiçbir içe aktarma yok; testle doğrulanır).

export interface RSale {
  id: string
  saleCode?: string
  customerName: string
  status?: string
  paymentMethod: string
  paid: number
  remaining: number
  items: { purchasePrice?: number; quantity: number }[]
  installments?: { amount: number; paidAmount: number }[]
  tradeIn?: { value: number } | null
}
export interface RTx {
  type: "income" | "expense"
  amount: number
  source: string
  sourceId?: string
  description: string
}
export interface RRepair {
  id: string
  repairCode?: string
  customerName: string
  paymentType: string
  paid: number
}
export interface RPurchase {
  id: string
  docCode: string
  price: number
  deviceName: string
}
export interface RAlis {
  id: string
  code: string
  partyName: string
  paid: number
}
export interface RItem {
  id: string
  name: string
  productCode?: string
  quantity: number
  purchasedQuantity?: number
  imei?: string
}

export interface Issue {
  id: string
  kind: "sale-finance" | "repair-finance" | "purchase-finance" | "stock" | "imei" | "installment"
  severity: "high" | "medium" | "low"
  title: string
  detail: string
  // Kasa farkı varsa tek tıkla düzeltme için: kaydın kasadaki net etkisi bu değere getirilir
  fix?: { source: "sale" | "repair"; id: string; desiredNet: number; customer: string; label: string }
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const TOL = 0.01

function netOf(txs: RTx[], source: string, id: string): number {
  return r2(
    txs
      .filter((t) => t.source === source && t.sourceId === id)
      .reduce((sum, t) => sum + (t.type === "income" ? 1 : -1) * (Number(t.amount) || 0), 0)
  )
}

const money = (n: number) => `${r2(n).toLocaleString("tr-TR")} TL`

export function reconcile(input: { sales: RSale[]; repairs: RRepair[]; transactions: RTx[]; purchases: RPurchase[]; inventory: RItem[]; alislar?: RAlis[] }): Issue[] {
  const issues: Issue[] = []
  const { sales, repairs, transactions, purchases, inventory } = input

  // 1) Satış <-> kasa
  for (const s of sales) {
    const code = s.saleCode || s.id.slice(0, 8)
    const cost = r2(s.items.reduce((sum, i) => sum + (Number(i.purchasePrice) || 0) * (Number(i.quantity) || 0), 0))
    let expected: number
    if (s.status === "cancelled") expected = 0
    else if (s.paymentMethod === "gift") expected = -cost
    else expected = r2((Number(s.paid) || 0) - (s.tradeIn?.value || 0))
    const net = netOf(transactions, "sale", s.id)
    if (Math.abs(net - expected) > TOL) {
      const diff = r2(net - expected)
      issues.push({
        id: `sale-${s.id}`,
        kind: "sale-finance",
        severity: Math.abs(diff) >= 100 ? "high" : "medium",
        title: `Satış ${code} — kasa kaydı uyuşmuyor`,
        detail: `${s.customerName}: kasada net ${money(net)}, olması gereken ${money(expected)} (fark ${diff > 0 ? "+" : ""}${money(diff)})${s.status === "cancelled" ? " — iptal edilmiş satış" : ""}`,
        fix: { source: "sale", id: s.id, desiredNet: expected, customer: s.customerName, label: `Mutabakat düzeltmesi ${code}` },
      })
    }
    // 2) Taksit planı <-> kalan borç
    if (s.status !== "cancelled" && (s.installments || []).length > 0) {
      const left = r2((s.installments || []).reduce((sum, i) => sum + (Number(i.amount) || 0) - (Number(i.paidAmount) || 0), 0))
      if (Math.abs(left - r2(Number(s.remaining) || 0)) > TOL) {
        issues.push({
          id: `inst-${s.id}`,
          kind: "installment",
          severity: "medium",
          title: `Satış ${code} — taksit planı kalan borçla uyuşmuyor`,
          detail: `${s.customerName}: taksitlerde kalan ${money(left)}, satış kaydında kalan ${money(s.remaining)}`,
        })
      }
    }
  }

  // 3) Tamir <-> kasa (eşantiyon tamirler kontrol dışı)
  for (const r of repairs) {
    if (r.paymentType === "gift") continue
    const code = r.repairCode || r.id.slice(0, 8)
    const expected = r2(Number(r.paid) || 0)
    const net = netOf(transactions, "repair", r.id)
    if (Math.abs(net - expected) > TOL) {
      const diff = r2(net - expected)
      issues.push({
        id: `repair-${r.id}`,
        kind: "repair-finance",
        severity: Math.abs(diff) >= 100 ? "high" : "medium",
        title: `Tamir ${code} — kasa kaydı uyuşmuyor`,
        detail: `${r.customerName}: kasada net ${money(net)}, alınan ödeme ${money(expected)} (fark ${diff > 0 ? "+" : ""}${money(diff)})`,
        fix: { source: "repair", id: r.id, desiredNet: expected, customer: r.customerName, label: `Mutabakat düzeltmesi ${code}` },
      })
    }
  }

  // 4) İkinci el alım belgesi <-> kasa gideri
  for (const p of purchases) {
    const found = transactions.some((t) => t.type === "expense" && t.description.includes(p.docCode))
    if (!found) {
      issues.push({
        id: `purchase-${p.id}`,
        kind: "purchase-finance",
        severity: "high",
        title: `Alım belgesi ${p.docCode} — kasada gider kaydı yok`,
        detail: `${p.deviceName}: ${money(p.price)} ödeme yapılmış görünüyor ama kasada karşılığı bulunamadı. Finans'tan gider ekleyin.`,
      })
    }
  }

  // 4b) Alışlar sayfasından yapılan alışlar: ödenen tutarın kasada gideri var mı?
  for (const a of input.alislar || []) {
    if ((Number(a.paid) || 0) <= TOL) continue
    const found = transactions.some((t) => t.type === "expense" && t.description.includes(a.code))
    if (!found) {
      issues.push({
        id: `alis-${a.id}`,
        kind: "purchase-finance",
        severity: "high",
        title: `Alış ${a.code} — kasada gider kaydı yok`,
        detail: `${a.partyName}: ${money(a.paid)} ödeme yapılmış görünüyor ama kasada karşılığı bulunamadı. Finans'tan gider ekleyin.`,
      })
    }
  }

  // 5) Stok tutarlılığı
  for (const it of inventory) {
    if (it.quantity < 0) {
      issues.push({ id: `stock-neg-${it.id}`, kind: "stock", severity: "high", title: `${it.name} — stok negatif`, detail: `Stok ${it.quantity} adet görünüyor.` })
    } else if (it.purchasedQuantity && it.quantity > it.purchasedQuantity) {
      issues.push({
        id: `stock-over-${it.id}`,
        kind: "stock",
        severity: "medium",
        title: `${it.name} — stok alınan adetten fazla`,
        detail: `Stokta ${it.quantity} adet var ama bugüne kadar toplam ${it.purchasedQuantity} adet alınmış görünüyor.`,
      })
    }
  }

  // 6) Aynı IMEI birden fazla aktif stok kaydında
  const byImei = new Map<string, RItem[]>()
  for (const it of inventory) {
    const imei = (it.imei || "").trim()
    if (!imei || it.quantity <= 0) continue
    byImei.set(imei, [...(byImei.get(imei) || []), it])
  }
  byImei.forEach((list, imei) => {
    if (list.length > 1) {
      issues.push({
        id: `imei-${imei}`,
        kind: "imei",
        severity: "high",
        title: `IMEI ${imei} birden fazla aktif stok kaydında`,
        detail: list.map((i) => `${i.name}${i.productCode ? ` (${i.productCode})` : ""}`).join(", "),
      })
    }
  })

  const order = { high: 0, medium: 1, low: 2 }
  return issues.sort((a, b) => order[a.severity] - order[b.severity])
}

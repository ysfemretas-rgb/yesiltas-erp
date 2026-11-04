// Stok uyarısı ayarları: hangi ürün grubunda kritik stok uyarısı verilsin (ör. telefonlarda ve hiç gelmeyen yedek parçalarda verilmesin).
// Ürün bazında uyarı = ürünün minimum stoğu 0'dan büyükse AÇIK, 0 ise KAPALI. Gruplar yeni ürünlerin ve "Gruplara uygula"nın varsayılanıdır.
import { PRODUCT_TYPE_GROUPS } from "@/lib/productCatalog"

export type StockGroupKey = "devices" | "phoneAcc" | "genAcc" | "parts" | "other"

export const STOCK_GROUPS: { key: StockGroupKey; label: string; hint: string }[] = [
  { key: "devices", label: "📱 Cihazlar", hint: "telefon (sıfır/2. el), tablet, laptop, akıllı saat" },
  { key: "phoneAcc", label: "🛡️ Telefon aksesuarları", hint: "kılıf, ekran koruyucu, kamera koruyucu" },
  { key: "genAcc", label: "🔌 Genel aksesuarlar", hint: "şarj aleti, kablo, kulaklık, powerbank..." },
  { key: "parts", label: "🔧 Yedek parça", hint: "ekran, batarya, kamera, şarj soketi..." },
  { key: "other", label: "🧰 Diğer", hint: "listedeki gruplara girmeyen ürünler" },
]

export interface StockGroupConfig {
  enabled: boolean // bu gruptaki ürünlerde varsayılan olarak uyarı AÇIK mı
  min: number // uyarı açıkken minimum stok adedi (bu adede ya da altına inince kritik)
}
export type StockAlertConfig = Record<StockGroupKey, StockGroupConfig>

export const DEFAULT_STOCK_ALERT_CONFIG: StockAlertConfig = {
  devices: { enabled: false, min: 1 },
  phoneAcc: { enabled: true, min: 5 },
  genAcc: { enabled: true, min: 5 },
  parts: { enabled: false, min: 2 },
  other: { enabled: true, min: 5 },
}

const norm = (s: string) => String(s ?? "").trim().toLocaleLowerCase("tr")

function groupKeyOfCatalogName(name: string): StockGroupKey {
  const n = norm(name)
  if (n.includes("cihaz")) return "devices"
  if (n.includes("telefon aksesuar")) return "phoneAcc"
  if (n.includes("genel aksesuar")) return "genAcc"
  if (n.includes("yedek par")) return "parts"
  return "other"
}

// Katalogdaki her ürün türü (Kılıf, Yedek Parça - Ekran, Telefon (İkinci El)...) hangi gruba ait
const CATEGORY_GROUP: Map<string, StockGroupKey> = (() => {
  const m = new Map<string, StockGroupKey>()
  for (const g of PRODUCT_TYPE_GROUPS) {
    const key = groupKeyOfCatalogName(g.name)
    for (const t of g.types) m.set(norm(t.label), key)
  }
  return m
})()

export function stockGroupOf(category: string | null | undefined): StockGroupKey {
  const c = String(category ?? "").trim()
  const hit = CATEGORY_GROUP.get(norm(c))
  if (hit) return hit
  // Katalogda olmayan (elle yazılmış / Excel'den gelen) kategoriler için tahmin
  if (/yedek\s*par[cç]a/i.test(c)) return "parts"
  if (/k[ıi]l[ıi]f|koruyucu/i.test(c)) return "phoneAcc"
  if (/telefon|tablet|laptop|bilgisayar|ak[ıi]ll[ıi]\s*saat/i.test(c)) return "devices"
  return "other"
}

const cleanMin = (n: unknown) => Math.max(1, Math.floor(Number(n) || 0) || 1)

// Yeni ürün / "Gruplara uygula" için olması gereken minimum stok: uyarı açık grupta grubun adedi, kapalı grupta 0
export function desiredMinQuantity(category: string | null | undefined, cfg: StockAlertConfig): number {
  const g = cfg[stockGroupOf(category)]
  return g.enabled ? cleanMin(g.min) : 0
}

// Ürünün uyarısını elle AÇARKEN kullanılacak minimum stok (grup kapalı olsa bile en az 1)
export function alertOnMinQuantity(category: string | null | undefined, cfg: StockAlertConfig): number {
  return cleanMin(cfg[stockGroupOf(category)].min)
}

// Ayarlardan (localStorage/sunucu) okunan ham değeri eksiksiz bir ayara çevirir
export function normalizeStockAlertConfig(raw: unknown): StockAlertConfig {
  const out = {} as StockAlertConfig
  for (const { key } of STOCK_GROUPS) {
    const r: any = (raw as any)?.[key]
    out[key] = {
      enabled: typeof r?.enabled === "boolean" ? r.enabled : DEFAULT_STOCK_ALERT_CONFIG[key].enabled,
      min: Number.isFinite(Number(r?.min)) && Number(r?.min) >= 1 ? Math.floor(Number(r.min)) : DEFAULT_STOCK_ALERT_CONFIG[key].min,
    }
  }
  return out
}

export function getStockAlertConfig(): StockAlertConfig {
  if (typeof window === "undefined") return DEFAULT_STOCK_ALERT_CONFIG
  try {
    const raw = window.localStorage.getItem("yt_company")
    return normalizeStockAlertConfig(raw ? JSON.parse(raw)?.stockAlertGroups : undefined)
  } catch {
    return DEFAULT_STOCK_ALERT_CONFIG
  }
}

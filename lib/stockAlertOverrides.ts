// Stok uyarısı İSTİSNALARI: kartındaki 🔔/🔕 düğmesiyle ya da ürün düzenlemede minimum stoğu elle değiştirilen ürünler.
// "Gruplara göre tüm ürünlere uygula" bu ürünlere dokunmaz (istenirse "istisnaları sıfırla" ile temizlenir).
import { getAppValue, setAppValue } from "@/lib/appStore"

const KEY = "stock_alert_overrides"

export async function fetchStockAlertOverrides(): Promise<string[]> {
  const v = await getAppValue<unknown>(KEY, [])
  return Array.isArray(v) ? v.map(String) : []
}

export async function addStockAlertOverride(productId: string): Promise<void> {
  const cur = await fetchStockAlertOverrides()
  if (!cur.includes(productId)) await setAppValue(KEY, [...cur, productId])
}

export async function clearStockAlertOverrides(): Promise<boolean> {
  return setAppValue(KEY, [])
}

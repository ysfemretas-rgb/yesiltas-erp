// "Çıkanlar": iade edilen ya da elden çıkarılan (hurda, kayıp, hasarlı vb.) ürünler/cihazlar.
// Ürün SİLİNMEZ — sadece ana (aktif) listeden gizlenir ve ayrı bir sekmede, sebep ve tarihiyle
// birlikte görünür. İstenirse "Geri Al" ile tekrar aktif listeye döner. Yeni bir SQL sütunu/tablosu
// gerektirmez, mevcut app_settings anahtar-değer tablosunda saklanır.
import { getAppValue, setAppValue } from "@/lib/appStore"

const KEY = "inventory_removed_v1"

export interface RemovedEntry {
  id: string // inventory.id
  reason: string
  date: string // YYYY-MM-DD
}

export async function fetchRemovedInventory(): Promise<RemovedEntry[]> {
  const v = await getAppValue<unknown>(KEY, [])
  if (!Array.isArray(v)) return []
  return v
    .filter((e) => e && typeof e === "object" && typeof (e as any).id === "string")
    .map((e: any) => ({ id: e.id, reason: String(e.reason || ""), date: String(e.date || "") }))
}

export async function markInventoryRemoved(id: string, reason: string, date: string): Promise<RemovedEntry[]> {
  const cur = await fetchRemovedInventory()
  const next = [...cur.filter((e) => e.id !== id), { id, reason: reason.trim(), date }]
  await setAppValue(KEY, next)
  return next
}

export async function restoreInventoryItem(id: string): Promise<RemovedEntry[]> {
  const cur = await fetchRemovedInventory()
  const next = cur.filter((e) => e.id !== id)
  await setAppValue(KEY, next)
  return next
}

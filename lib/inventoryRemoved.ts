// "Çıkanlar": iade edilen ya da elden çıkarılan (hurda, kayıp, hasarlı vb.) ürünler/cihazlar.
// Ürün SİLİNMEZ — sadece ana (aktif) listeden gizlenir ve ayrı bir sekmede, sebep ve tarihiyle
// birlikte görünür. İstenirse "Geri Al" ile tekrar aktif listeye döner. Yeni bir SQL sütunu/tablosu
// gerektirmez, mevcut app_settings anahtar-değer tablosunda saklanır.
import { getAppValue, setAppValue } from "@/lib/appStore"

const KEY = "inventory_removed_v1"

// v60: "iade" sebebiyle çıkarılan ürünlerde, iadenin nasıl sonuçlandığını (nakit iade /
// tedarikçi cari alacağı / ürün değişimi / belirtilmedi) ve tutarını da kaydeder — böylece
// "iade ettim ama para alındı mı, tedarikçi cariye mi yazıldı?" sorusu Çıkanlar listesinden
// cevaplanabilir. Eski kayıtlarda bu alanlar yok, hepsi opsiyonel.
// v62: iade anında sonuç henüz belli olmayabilir ("şimdilik ayırdım, sonra karar veririm").
// Bu yüzden sonuç sonradan da (Çıkanlar sekmesinden) belirlenebilir/düzeltilebilir —
// bkz. updateIadeResolution. financialRecorded, kasaya/tedarikçi carisine yazma işleminin
// zaten yapılıp yapılmadığını tutar; aynı iade için ikinci kez finansal kayıt oluşmasın diye.
export type IadeResolution = "refund" | "supplier_credit" | "exchange" | "other"

export interface RemovedEntry {
  id: string // inventory.id
  reason: string
  date: string // YYYY-MM-DD — çıkarılma tarihi, sonradan sonuç düzenlense de DEĞİŞMEZ
  resolution?: IadeResolution
  resolutionAmount?: number
  resolutionNote?: string
  financialRecorded?: boolean
}

export async function fetchRemovedInventory(): Promise<RemovedEntry[]> {
  const v = await getAppValue<unknown>(KEY, [])
  if (!Array.isArray(v)) return []
  return v
    .filter((e) => e && typeof e === "object" && typeof (e as any).id === "string")
    .map((e: any) => ({
      id: e.id,
      reason: String(e.reason || ""),
      date: String(e.date || ""),
      resolution: ["refund", "supplier_credit", "exchange", "other"].includes(e.resolution) ? e.resolution : undefined,
      resolutionAmount: Number.isFinite(Number(e.resolutionAmount)) && Number(e.resolutionAmount) > 0 ? Number(e.resolutionAmount) : undefined,
      resolutionNote: e.resolutionNote ? String(e.resolutionNote) : undefined,
      financialRecorded: e.financialRecorded === true,
    }))
}

export async function markInventoryRemoved(
  id: string,
  reason: string,
  date: string,
  extra?: { resolution?: IadeResolution; resolutionAmount?: number; resolutionNote?: string; financialRecorded?: boolean }
): Promise<RemovedEntry[]> {
  const cur = await fetchRemovedInventory()
  const entry: RemovedEntry = { id, reason: reason.trim(), date }
  if (extra?.resolution) entry.resolution = extra.resolution
  if (extra?.resolutionAmount && extra.resolutionAmount > 0) entry.resolutionAmount = extra.resolutionAmount
  if (extra?.resolutionNote?.trim()) entry.resolutionNote = extra.resolutionNote.trim()
  if (extra?.financialRecorded) entry.financialRecorded = true
  const next = [...cur.filter((e) => e.id !== id), entry]
  await setAppValue(KEY, next)
  return next
}

// v62: zaten "Çıkanlar"da olan bir kaydın iade sonucunu sonradan belirlemek/düzeltmek için.
// markInventoryRemoved'tan FARKI: sebep ve çıkarılma tarihini DEĞİŞTİRMEZ, sadece sonuç
// alanlarını günceller — "şimdilik belirtmedim, sonra netleşince düzeltirim" akışı için.
export async function updateIadeResolution(
  id: string,
  extra: { resolution?: IadeResolution; resolutionAmount?: number; resolutionNote?: string; financialRecorded?: boolean }
): Promise<RemovedEntry[]> {
  const cur = await fetchRemovedInventory()
  const existing = cur.find((e) => e.id === id)
  if (!existing) throw new Error("Kayıt bulunamadı — ürün Çıkanlar listesinde değil.")
  const updated: RemovedEntry = { ...existing }
  if (extra.resolution) updated.resolution = extra.resolution
  if (extra.resolutionAmount && extra.resolutionAmount > 0) updated.resolutionAmount = extra.resolutionAmount
  else if (extra.resolutionAmount === 0) updated.resolutionAmount = undefined
  if (extra.resolutionNote !== undefined) updated.resolutionNote = extra.resolutionNote.trim() || undefined
  if (extra.financialRecorded) updated.financialRecorded = true
  const next = [...cur.filter((e) => e.id !== id), updated]
  await setAppValue(KEY, next)
  return next
}

export async function restoreInventoryItem(id: string): Promise<RemovedEntry[]> {
  const cur = await fetchRemovedInventory()
  const next = cur.filter((e) => e.id !== id)
  await setAppValue(KEY, next)
  return next
}

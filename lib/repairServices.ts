// Teknik servis hazır işlem listesi (ekran değişimi, batarya değişimi...). Fiyatlar BAŞLANGIÇ değeridir: Ayarlar'dan
// düzenlenebilir, kayıt açarken de "Özel fiyat" seçilerek tutar elle yazılabilir. (Saf modül, testle doğrulanır.)
export interface RepairService {
  name: string
  price: number
}

export const DEFAULT_REPAIR_SERVICES: RepairService[] = [
  { name: "Ekran değişimi", price: 1800 },
  { name: "Batarya değişimi", price: 900 },
  { name: "Şarj soketi değişimi", price: 700 },
  { name: "Arka kapak/cam değişimi", price: 800 },
  { name: "Kamera değişimi", price: 1000 },
  { name: "Yazılım / format", price: 350 },
  { name: "Cihaz bakımı / temizlik", price: 300 },
]

export function normalizeServices(raw: unknown): RepairService[] {
  if (!Array.isArray(raw)) return DEFAULT_REPAIR_SERVICES
  const list = raw
    .map((x: any) => ({ name: String(x?.name ?? "").trim(), price: Math.max(0, Math.round(Number(x?.price) || 0)) }))
    .filter((x) => x.name)
  return list.length > 0 ? list : DEFAULT_REPAIR_SERVICES
}

// Seçilen işlemlerin fiyat toplamı
export function servicesTotal(selected: string[], services: RepairService[]): number {
  const set = new Set(selected)
  return services.filter((s) => set.has(s.name)).reduce((sum, s) => sum + s.price, 0)
}

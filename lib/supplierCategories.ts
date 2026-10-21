// Bir tedarikçi birden çok kategoride ürün verebilir. Kategoriler veritabanında tek bir metin sütununda
// virgülle ayrılmış saklanır ("Ekran, Batarya"); yeni sütun gerekmez, eski tek kategorili kayıtlar aynen çalışır.
// (Hiçbir içe aktarma yok; testle doğrulanır.)

export const DEFAULT_SUPPLIER_CATEGORIES = ["Ekran", "Batarya", "Kapak", "Port", "Yapıştırıcı", "Diğer"]

export function parseCategories(value: string | null | undefined): string[] {
  return Array.from(new Set(String(value || "").split(",").map((c) => c.trim()).filter(Boolean)))
}

export function joinCategories(list: string[]): string {
  return Array.from(new Set(list.map((c) => c.trim()).filter(Boolean))).join(", ")
}

// Tüm bilinen kategoriler: varsayılanlar + tedarikçilerde kullanılanlar + (varsa) ek olarak verilenler
export function allCategories(suppliers: { category?: string }[], extra: string[] = []): string[] {
  const set = new Set<string>(DEFAULT_SUPPLIER_CATEGORIES)
  suppliers.forEach((s) => parseCategories(s.category).forEach((c) => set.add(c)))
  extra.forEach((c) => c.trim() && set.add(c.trim()))
  const rest = Array.from(set).filter((c) => !DEFAULT_SUPPLIER_CATEGORIES.includes(c)).sort((a, b) => a.localeCompare(b, "tr"))
  return [...DEFAULT_SUPPLIER_CATEGORIES.filter((c) => set.has(c)), ...rest]
}

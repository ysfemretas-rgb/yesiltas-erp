// Envanterde "yedek parça" kategorisindeki ürünler (Yedek Parça - Ekran, Yedek Parça - Batarya ...) satış ekranında değil,
// teknik servis parça seçiminde görünür; kılıf, kablo gibi satış ürünleri ise teknik servis parça listesinde görünmez.
export function isSparePart(item: { category?: string | null }): boolean {
  return /yedek\s*par[cç]a/i.test(String(item?.category ?? ""))
}

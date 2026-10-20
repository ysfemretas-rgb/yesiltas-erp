// Ürün türleri (kategoriler) ve telefon marka/model kataloğu. Ürün eklerken "Tür → Marka → Model"
// seçilerek ürün adı ve kategori otomatik oluşturulur. Listede olmayan marka/model elle yazılabilir.

export interface ProductType {
  label: string // kategori adı olarak kaydedilir
  short: string // ürün adının başına gelen kısa ad (aksesuar/yedek parça için)
  modelBased: boolean // marka+model seçimi gerekir mi (kılıf, ekran, telefon...)
  isPhone?: boolean // cihazın kendisi mi (adı "Marka Model" olur)
}

export const PRODUCT_TYPE_GROUPS: { name: string; types: ProductType[] }[] = [
  {
    name: "📱 Cihazlar",
    types: [
      { label: "Telefon (Sıfır)", short: "Telefon", modelBased: true, isPhone: true },
      { label: "Telefon (İkinci El)", short: "Telefon (2. El)", modelBased: true, isPhone: true },
      { label: "Tablet", short: "Tablet", modelBased: false },
      { label: "Akıllı Saat / Bileklik", short: "Akıllı Saat", modelBased: false },
      { label: "Bilgisayar / Laptop", short: "Bilgisayar", modelBased: false },
    ],
  },
  {
    name: "🛡️ Telefon Aksesuarları (modele özel)",
    types: [
      { label: "Kılıf", short: "Kılıf", modelBased: true },
      { label: "Ekran Koruyucu (Cam)", short: "Ekran Koruyucu Cam", modelBased: true },
      { label: "Ekran Koruyucu (Nano/Hidrojel)", short: "Ekran Koruyucu Nano", modelBased: true },
      { label: "Kamera Koruyucu", short: "Kamera Koruyucu", modelBased: true },
    ],
  },
  {
    name: "🔌 Genel Aksesuarlar",
    types: [
      { label: "Şarj Aleti (Adaptör)", short: "Şarj Aleti", modelBased: false },
      { label: "Şarj / Data Kablosu", short: "Kablo", modelBased: false },
      { label: "Kablosuz Şarj", short: "Kablosuz Şarj", modelBased: false },
      { label: "Kulaklık", short: "Kulaklık", modelBased: false },
      { label: "Bluetooth Hoparlör", short: "Hoparlör", modelBased: false },
      { label: "Powerbank", short: "Powerbank", modelBased: false },
      { label: "Araç Aksesuarı", short: "Araç Aksesuarı", modelBased: false },
      { label: "Hafıza Kartı / Flash Bellek", short: "Hafıza", modelBased: false },
      { label: "Klavye / Mouse", short: "Klavye/Mouse", modelBased: false },
      { label: "Tutucu / Stand / Selfie", short: "Tutucu", modelBased: false },
    ],
  },
  {
    name: "🔧 Yedek Parça (modele özel)",
    types: [
      { label: "Yedek Parça - Ekran", short: "Ekran (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Batarya", short: "Batarya (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Kamera", short: "Kamera (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Şarj Soketi / Flex", short: "Şarj Soketi (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Kasa / Kapak", short: "Kasa/Kapak (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Hoparlör / Ahize / Mikrofon", short: "Hoparlör/Ahize (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Tuş / Flex Kablo", short: "Tuş/Flex (Yedek Parça)", modelBased: true },
      { label: "Yedek Parça - Anakart / Entegre", short: "Anakart/Entegre (Yedek Parça)", modelBased: true },
    ],
  },
  {
    name: "🧰 Diğer",
    types: [
      { label: "Tamir Aleti / Ekipman", short: "Tamir Aleti", modelBased: false },
      { label: "Diğer", short: "", modelBased: false },
    ],
  },
]

export const ALL_PRODUCT_TYPES: ProductType[] = PRODUCT_TYPE_GROUPS.flatMap((g) => g.types)

export function findProductType(label: string): ProductType | undefined {
  return ALL_PRODUCT_TYPES.find((t) => t.label === label)
}

// Mevcut stokta olup hazır listede bulunmayan kategoriler ("Ekran" gibi eski kayıtlar) ayrı gösterilir
export function extraCategories(existing: string[]): string[] {
  const known = new Set(ALL_PRODUCT_TYPES.map((t) => t.label))
  return Array.from(new Set(existing.filter((c) => c && c !== "__new__" && !known.has(c)))).sort((a, b) => a.localeCompare(b, "tr"))
}

// Ürün adı üretir. Telefon: "Marka Model Varyant". Modele özel aksesuar/parça: "Tür — Marka Model Varyant".
// Genel ürün: "Tür — Varyant".
export function buildProductName(type: ProductType | undefined, brand: string, model: string, variant: string): string {
  const v = variant.trim()
  const b = brand.trim()
  const m = model.trim()
  // Model adı zaten markayla başlıyorsa (ör. "OnePlus 9", "Nokia 3.4") markayı tekrar yazma
  const device = m.toLowerCase().startsWith(b.toLowerCase()) ? m : [b, m].filter(Boolean).join(" ")
  if (!type) return [device, v].filter(Boolean).join(" ")
  if (type.isPhone) return [device, v].filter(Boolean).join(" ")
  if (type.modelBased) return [type.short, [device, v].filter(Boolean).join(" ")].filter(Boolean).join(" — ")
  return [type.short, v].filter(Boolean).join(" — ")
}

const range = (prefix: string, nums: (number | string)[], suffix = "") => nums.map((n) => `${prefix}${n}${suffix}`)

export const PHONE_CATALOG: Record<string, string[]> = {
  Apple: [
    "iPhone 6", "iPhone 6 Plus", "iPhone 6s", "iPhone 6s Plus", "iPhone SE (2016)", "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus",
    "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone SE (2020)",
    "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone SE (2022)",
    "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    "iPhone 16e", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 17", "iPhone 17 Air", "iPhone 17 Pro", "iPhone 17 Pro Max",
  ],
  Samsung: [
    ...["Galaxy S6", "Galaxy S6 Edge", "Galaxy S7", "Galaxy S7 Edge", "Galaxy S8", "Galaxy S8+", "Galaxy S9", "Galaxy S9+", "Galaxy S10e", "Galaxy S10", "Galaxy S10+"],
    ...["Galaxy S20 FE", "Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S21 FE", "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra"],
    ...["Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra", "Galaxy S23 FE", "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra"],
    ...["Galaxy S24 FE", "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S25 Edge", "Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra"],
    ...range("Galaxy A", ["01", "02", "02s", "03", "03s", "03 Core", "04", "04s", "04e", "05", "05s", "06", "07", "10", "10s", "11", "12", "13", "14", "15", "16", "17"]),
    ...range("Galaxy A", [20, "20s", 21, "21s", 22, 23, 24, 25, 26, 30, "30s", 31, 32, 33, 34, 35, 36, 40, 41, 42, 50, 51, 52, "52s", 53, 54, 55, 56, 70, 71, 72, 73, 80, 90]),
    ...range("Galaxy M", [11, 12, 13, 14, 15, 21, 22, 23, "30s", 31, 32, 33, 34, 35, 51, 52, 53, 54, 55]),
    ...["Galaxy Note 8", "Galaxy Note 9", "Galaxy Note 10", "Galaxy Note 10+", "Galaxy Note 20", "Galaxy Note 20 Ultra"],
    ...["Galaxy Z Flip", "Galaxy Z Flip3", "Galaxy Z Flip4", "Galaxy Z Flip5", "Galaxy Z Flip6", "Galaxy Z Flip7", "Galaxy Z Fold2", "Galaxy Z Fold3", "Galaxy Z Fold4", "Galaxy Z Fold5", "Galaxy Z Fold6", "Galaxy Z Fold7"],
    ...["Galaxy J2 Prime", "Galaxy J4+", "Galaxy J5", "Galaxy J5 Prime", "Galaxy J6", "Galaxy J6+", "Galaxy J7", "Galaxy J7 Prime", "Galaxy J7 Pro", "Galaxy J8"],
  ],
  Xiaomi: [
    ...["Mi 8", "Mi 8 Lite", "Mi 9", "Mi 9 Lite", "Mi 9T", "Mi 9T Pro", "Mi 10", "Mi 10 Lite", "Mi 10T", "Mi 10T Lite", "Mi 10T Pro", "Mi 11", "Mi 11 Lite", "Mi 11 Lite 5G NE", "Mi 11T", "Mi 11T Pro", "Mi A2", "Mi A3"],
    ...["Xiaomi 12", "Xiaomi 12 Lite", "Xiaomi 12T", "Xiaomi 12T Pro", "Xiaomi 13", "Xiaomi 13 Lite", "Xiaomi 13T", "Xiaomi 13T Pro", "Xiaomi 14", "Xiaomi 14T", "Xiaomi 14T Pro", "Xiaomi 15", "Xiaomi 15T", "Xiaomi 15T Pro"],
    ...["Redmi Note 5", "Redmi Note 6 Pro", "Redmi Note 7", "Redmi Note 8", "Redmi Note 8 Pro", "Redmi Note 8T", "Redmi Note 9", "Redmi Note 9 Pro", "Redmi Note 9S", "Redmi Note 10", "Redmi Note 10 Pro", "Redmi Note 10S", "Redmi Note 11", "Redmi Note 11 Pro", "Redmi Note 11S", "Redmi Note 12", "Redmi Note 12 Pro", "Redmi Note 12S", "Redmi Note 13", "Redmi Note 13 Pro", "Redmi Note 13 Pro+", "Redmi Note 14", "Redmi Note 14 Pro", "Redmi Note 14 Pro+"],
    ...["Redmi 7A", "Redmi 8", "Redmi 8A", "Redmi 9", "Redmi 9A", "Redmi 9C", "Redmi 9T", "Redmi 10", "Redmi 10A", "Redmi 10C", "Redmi 12", "Redmi 12C", "Redmi 13", "Redmi 13C", "Redmi A1", "Redmi A2", "Redmi A3", "Redmi A5"],
  ],
  POCO: [
    ...["Poco X3 NFC", "Poco X3 Pro", "Poco X4 Pro", "Poco X5", "Poco X5 Pro", "Poco X6", "Poco X6 Pro", "Poco X7", "Poco X7 Pro"],
    ...["Poco F3", "Poco F4", "Poco F4 GT", "Poco F5", "Poco F5 Pro", "Poco F6", "Poco F6 Pro", "Poco F7", "Poco F7 Pro"],
    ...["Poco M3", "Poco M4 Pro", "Poco M5", "Poco M5s", "Poco M6", "Poco M6 Pro", "Poco C40", "Poco C55", "Poco C65", "Poco C75"],
  ],
  Huawei: [
    ...["P8 Lite", "P9 Lite", "P10 Lite", "P20 Lite", "P20", "P20 Pro", "P30 Lite", "P30", "P30 Pro", "P40 Lite", "P40", "P40 Pro", "P50 Pro", "P60 Pro"],
    ...["P Smart", "P Smart 2019", "P Smart 2020", "P Smart 2021", "P Smart Z", "P Smart Pro"],
    ...["Mate 10 Lite", "Mate 20 Lite", "Mate 20", "Mate 20 Pro", "Mate 30 Pro", "Mate 40 Pro", "Mate 50 Pro"],
    ...["Nova 3i", "Nova 5T", "Nova 7i", "Nova 8i", "Nova 9", "Nova 10", "Nova 11", "Nova Y70", "Nova Y90"],
    ...["Y5 2018", "Y5 2019", "Y6 2018", "Y6 2019", "Y6p", "Y7 2018", "Y7 2019", "Y7 Prime", "Y7p", "Y8p", "Y9 2018", "Y9 2019", "Y9 Prime", "Y9a", "Y9s"],
  ],
  Honor: [
    ...["Honor 8X", "Honor 9X", "Honor 9 Lite", "Honor 10 Lite", "Honor 20", "Honor 20 Lite", "Honor 50", "Honor 50 Lite", "Honor 70", "Honor 90", "Honor 90 Lite", "Honor 200", "Honor 200 Pro", "Honor 400"],
    ...["Honor X5", "Honor X6", "Honor X7", "Honor X8", "Honor X9", "Honor X9a", "Honor X9b", "Honor Magic5 Pro", "Honor Magic6 Pro", "Honor Magic7 Pro"],
  ],
  Oppo: [
    ...["A5", "A9 2020", "A15", "A16", "A17", "A31", "A53", "A54", "A57", "A58", "A74", "A78", "A79", "A98"],
    ...["Reno 4 Lite", "Reno 5", "Reno 6", "Reno 7", "Reno 8", "Reno 8T", "Reno 10", "Reno 11", "Reno 12", "Reno 13", "Find X3 Pro", "Find X5 Pro"],
  ],
  Realme: [
    ...["C11", "C15", "C21", "C21Y", "C25", "C30", "C33", "C35", "C51", "C53", "C55", "C61", "C63", "C65", "C67"],
    ...["5", "6", "6 Pro", "7", "7 Pro", "8", "8 Pro", "9", "9 Pro", "9 Pro+", "10", "11", "11 Pro", "12", "12 Pro", "13", "13 Pro", "GT Neo 3", "GT 5", "GT 6", "Narzo 50", "Narzo 60"].map((m) => (/^\d/.test(m) ? `Realme ${m}` : m)),
  ],
  Vivo: [
    ...["Y11", "Y12", "Y15", "Y17", "Y20", "Y21", "Y22", "Y33s", "Y35", "Y36", "Y17s", "Y28", "Y18", "V19", "V20", "V21", "V23", "V25", "V27", "V29", "V30", "V40", "X60 Pro", "X80", "X100"],
  ],
  OnePlus: [
    ...["OnePlus 6", "OnePlus 6T", "OnePlus 7", "OnePlus 7T", "OnePlus 8", "OnePlus 8T", "OnePlus 9", "OnePlus 9 Pro", "OnePlus 10 Pro", "OnePlus 10T", "OnePlus 11", "OnePlus 12", "OnePlus 13"],
    ...["Nord", "Nord 2", "Nord CE", "Nord CE 2", "Nord CE 3", "Nord 3", "Nord 4"],
  ],
  Google: [
    ...["Pixel 3", "Pixel 3a", "Pixel 4", "Pixel 4a", "Pixel 5", "Pixel 5a", "Pixel 6", "Pixel 6 Pro", "Pixel 6a", "Pixel 7", "Pixel 7 Pro", "Pixel 7a", "Pixel 8", "Pixel 8 Pro", "Pixel 8a", "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9a", "Pixel 10", "Pixel 10 Pro", "Pixel 10 Pro XL"],
  ],
  Motorola: [
    ...["Moto E7", "Moto E13", "Moto E22", "Moto E32", "Moto E40", "Moto G7", "Moto G8", "Moto G8 Power", "Moto G9 Play", "Moto G9 Power", "Moto G10", "Moto G22", "Moto G23", "Moto G32", "Moto G34", "Moto G42", "Moto G52", "Moto G54", "Moto G60", "Moto G73", "Moto G84", "Moto G85"],
    ...["Edge 20", "Edge 30", "Edge 40", "Edge 50", "Razr 40", "Razr 50"],
  ],
  Nokia: [
    ...["1.4", "2.4", "3.4", "5.4", "6.2", "G10", "G11", "G20", "G21", "G22", "G42", "G60", "C21", "C30", "C32", "105", "110", "150", "225", "230"].map((m) => `Nokia ${m}`),
  ],
  Tecno: [
    ...["Spark 8", "Spark 9", "Spark 10", "Spark 20", "Spark 30", "Camon 17", "Camon 18", "Camon 19", "Camon 20", "Camon 30", "Pova 4", "Pova 5", "Pova 6"],
  ],
  Infinix: [
    ...["Hot 10", "Hot 11", "Hot 12", "Hot 20", "Hot 30", "Hot 40", "Hot 50", "Note 10", "Note 11", "Note 12", "Note 30", "Note 40", "Smart 5", "Smart 6", "Smart 7", "Smart 8", "Smart 9", "Zero 20", "Zero 30"],
  ],
  Casper: ["VIA A1", "VIA A3", "VIA E3", "VIA M4", "VIA M30", "VIA F20", "VIA X30"],
  "General Mobile": ["GM 8", "GM 9 Pro", "GM 10", "GM 20", "GM 21", "GM 22", "GM 23", "GM 24"],
  Reeder: ["P13 Blue", "P13 Blue Max", "S19 Max Pro", "S19 Max Pro S", "S20 Max"],
}

export const PHONE_BRANDS = Object.keys(PHONE_CATALOG)

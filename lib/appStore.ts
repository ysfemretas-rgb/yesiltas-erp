// Küçük, cihazlar arasında paylaşılan uygulama değerleri (app_settings tablosu, anahtar → değer). Yeni SQL gerektirmez.
import { supabase } from "@/lib/supabase"

export async function getAppValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle()
    if (error || !data) return fallback
    return (data.value ?? fallback) as T
  } catch {
    return fallback
  }
}

export async function setAppValue(key: string, value: unknown): Promise<boolean> {
  const r = await setAppValueDetailed(key, value)
  return r.ok
}

// Hatanın GERÇEK sebebini (RLS/yetki mi, eksik sütun mu, bağlantı sorunu mu vs.) görmek
// gerektiğinde bu kullanılır — setAppValue sadece true/false döner, hatayı yutar.
// Mobil ağda (özellikle zayıf 4G sinyalinde) istek bazen ağ seviyesinde kesiliyor
// ("TypeError: Load failed" / "Failed to fetch") — bu durumda kısa bir bekleyişle
// birkaç kez otomatik tekrar denenir. Supabase'den düzgün bir hata (ör. yetki sorunu)
// dönerse tekrar denemenin faydası yoktur, hemen bildirilir.
export async function setAppValueDetailed(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  const MAX_DENEME = 3
  let sonHata = "bilinmeyen hata"
  for (let deneme = 1; deneme <= MAX_DENEME; deneme++) {
    try {
      const { error } = await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() })
      if (!error) return { ok: true }
      // Supabase'den gelen yapısal hata (RLS, eksik sütun vb.) — tekrar denemek işe yaramaz.
      return { ok: false, error: error.message || error.code || "bilinmeyen hata" }
    } catch (e) {
      sonHata = e instanceof Error ? e.message : "bilinmeyen hata"
      if (deneme < MAX_DENEME) await new Promise((r) => setTimeout(r, 700 * deneme))
    }
  }
  return { ok: false, error: `${sonHata} (${MAX_DENEME} deneme sonunda)` }
}

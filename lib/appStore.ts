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
export async function setAppValueDetailed(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) return { ok: false, error: error.message || error.code || "bilinmeyen hata" }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "bilinmeyen hata" }
  }
}

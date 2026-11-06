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
  try {
    const { error } = await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() })
    return !error
  } catch {
    return false
  }
}

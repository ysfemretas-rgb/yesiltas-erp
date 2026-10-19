// Firma ayarları (IBAN, adres, iskonto limiti vb.) eskiden sadece her cihazın kendi
// tarayıcısında (localStorage) duruyordu; tablet ve bilgisayar farklı ayar görüyordu.
// Artık "Kaydet" ile Supabase'e (app_settings) yazılır, her cihaz açılışta oradan alır.
// Sunucuya ulaşılamazsa yerel kopya kullanılmaya devam eder.
import { supabase } from "@/lib/supabase"

const KEY = "company"

export async function pullCompanySettings(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", KEY).maybeSingle()
    if (error || !data?.value) return false
    localStorage.setItem("yt_company", JSON.stringify(data.value))
    return true
  } catch {
    return false
  }
}

export async function pushCompanySettings(company: unknown): Promise<boolean> {
  try {
    const { error } = await supabase.from("app_settings").upsert({ key: KEY, value: company, updated_at: new Date().toISOString() })
    return !error
  } catch {
    return false
  }
}

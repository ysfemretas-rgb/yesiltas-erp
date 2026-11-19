// SADECE SUNUCU TARAFINDA (API route / cron) kullanılır. Bu dosyayı asla
// istemci (tarayıcı, "use client") koduna import ETMEYİN: SUPABASE_SERVICE_ROLE_KEY
// tüm RLS (Row Level Security) kurallarını atlar; tarayıcıya sızarsa veritabanının
// tamamına sınırsız, kimliksiz erişim sağlar. Env değişkeni "NEXT_PUBLIC_" ÖNEKİ
// TAŞIMAZ, bu yüzden Next.js onu asla istemci paketine gömmez — sadece sunucuda okunur.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// null dönerse: SUPABASE_SERVICE_ROLE_KEY Vercel'de henüz tanımlanmamış demektir.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

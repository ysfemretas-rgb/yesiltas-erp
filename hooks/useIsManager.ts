'use client'

// Silme butonlarını arayüzde gizlemek için kullanılır. Asıl güvenlik
// veritabanı seviyesinde (RLS, bkz. supabase-fine-permissions-migration.sql)
// zaten sağlanıyor — bu sadece yönetici olmayan bir kullanıcıya, zaten
// çalışmayacak bir düğmeyi hiç göstermeyerek daha iyi bir deneyim sunar.
export function useIsManager(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('yt_user')
    if (!raw) return false
    const user = JSON.parse(raw)
    return user?.role === 'Yönetici'
  } catch {
    return false
  }
}

// Son yedeğin yaşı (gün) — saf hesap (lib/backupStatus.ts kullanır)
export function backupAgeDays(at: string | null, now = Date.now()): number | null {
  if (!at) return null
  const t = new Date(at).getTime()
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86400000)) : null
}

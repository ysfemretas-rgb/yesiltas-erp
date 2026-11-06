"use client"

import { useEffect, useState } from "react"
import { APP_VERSION } from "@/lib/version"
import { useIsManager } from "@/hooks/useIsManager"
import { getLastBackup, recordBackup } from "@/lib/backupStatus"
import { backupAgeDays } from "@/lib/backupAge"
import { exportBackup } from "@/lib/backup"
import { localDateStr } from "@/lib/dates"

const BACKUP_WARN_DAYS = 7
const SNOOZE_KEY = "yt_backup_snooze"

// Uygulamanın üstündeki iki şerit:
// 1) Yeni sürüm yayındaysa "Yenile" uyarısı (iPhone'da açık kalan uygulama eski kodla çalışmaya devam edebiliyor).
// 2) Son yedek 7 günden eskiyse (ya da hiç alınmadıysa) yöneticilere yedek hatırlatması.
export function AppBanners() {
  const isManager = useIsManager()
  const [latest, setLatest] = useState<string | null>(null)
  const [backupAge, setBackupAge] = useState<number | null | undefined>(undefined) // undefined: bilinmiyor, null: hiç yedek yok
  const [snoozed, setSnoozed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
        if (!r.ok) return
        const j = await r.json()
        if (alive && typeof j?.version === "string" && j.version !== APP_VERSION) setLatest(j.version)
      } catch {
        // çevrimdışı: sessizce geç
      }
    }
    check()
    const timer = setInterval(check, 5 * 60 * 1000)
    const onVisible = () => { if (document.visibilityState === "visible") check() }
    document.addEventListener("visibilitychange", onVisible)
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible) }
  }, [])

  useEffect(() => {
    if (!isManager) return
    try { setSnoozed(localStorage.getItem(SNOOZE_KEY) === localDateStr()) } catch { /* yoksay */ }
    getLastBackup().then((at) => setBackupAge(backupAgeDays(at))).catch(() => undefined)
  }, [isManager])

  const backupNow = async () => {
    setBusy(true)
    try {
      await exportBackup()
      await recordBackup()
      setBackupAge(0)
    } catch (e) {
      console.error("Yedek alınamadı:", e)
    } finally {
      setBusy(false)
    }
  }

  const showBackup = isManager && !snoozed && backupAge !== undefined && (backupAge === null || backupAge >= BACKUP_WARN_DAYS)

  if (!latest && !showBackup) return null
  return (
    <div className="space-y-2 mb-4">
      {latest && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-3 text-sm text-sky-100">
          <span>🔄 Uygulamanın yeni sürümü (<b>{latest}</b>) yayında. Şu an açık olan {APP_VERSION}.</span>
          <button type="button" onClick={() => window.location.reload()} className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">
            Yenile
          </button>
        </div>
      )}
      {showBackup && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-amber-600 bg-amber-900/25 px-4 py-3 text-sm text-amber-100">
          <span>
            💾 {backupAge === null ? "Bu uygulamada henüz yedek alınmamış." : `Son yedek ${backupAge} gün önce alındı.`} Verilerinizi kaybetmemek için yedek alın (dosya bu cihaza iner).
          </span>
          <span className="flex gap-2">
            <button type="button" disabled={busy} onClick={backupNow} className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium disabled:opacity-50">
              {busy ? "Hazırlanıyor..." : "Şimdi yedekle"}
            </button>
            <button type="button" onClick={() => { try { localStorage.setItem(SNOOZE_KEY, localDateStr()) } catch { /* yoksay */ } setSnoozed(true) }} className="px-3 py-1.5 rounded-md border border-amber-700 text-amber-200">
              Yarın hatırlat
            </button>
          </span>
        </div>
      )}
    </div>
  )
}

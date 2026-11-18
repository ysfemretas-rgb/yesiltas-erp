// Son yedeğin tarihi (tüm cihazlar görür). Ayarlar > Yedeği İndir ya da hatırlatma şeridindeki "Şimdi yedekle" ile yazılır.
import { getAppValue, setAppValue } from "@/lib/appStore"

const KEY = "last_backup"

export async function getLastBackup(): Promise<string | null> {
  const v = await getAppValue<{ at?: string } | null>(KEY, null)
  return v && typeof v.at === "string" ? v.at : null
}

// Yazma başarılıysa true döner (ve diğer bileşenlerin — ör. AppBanners — hemen
// güncellenmesi için "yt:backup-recorded" olayı yayınlanır). Başarısızsa false döner;
// çağıran taraf bunu kullanıcıya bildirebilir (sessizce yutmayın — "yedek aldım ama
// hala uyarıyor" bu yüzden oluyordu: yazma RLS'den sessizce başarısız oluyordu).
export async function recordBackup(by?: string): Promise<boolean> {
  const ok = await setAppValue(KEY, { at: new Date().toISOString(), by: by || "" })
  if (ok && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yt:backup-recorded"))
  }
  return ok
}

export { backupAgeDays } from "@/lib/backupAge"

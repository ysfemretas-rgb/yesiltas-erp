// Son yedeğin tarihi (tüm cihazlar görür). Ayarlar > Yedeği İndir ya da hatırlatma şeridindeki "Şimdi yedekle" ile yazılır.
import { getAppValue, setAppValueDetailed } from "@/lib/appStore"

const KEY = "last_backup"

export async function getLastBackup(): Promise<string | null> {
  const v = await getAppValue<{ at?: string } | null>(KEY, null)
  return v && typeof v.at === "string" ? v.at : null
}

// Yazma başarılıysa {ok:true} döner (ve diğer bileşenlerin — ör. AppBanners — hemen
// güncellenmesi için "yt:backup-recorded" olayı yayınlanır). Başarısızsa {ok:false, error}
// döner — gerçek hata metniyle; çağıran taraf bunu kullanıcıya gösterebilir (sessizce
// yutmayın — "yedek aldım ama hala uyarıyor" bu yüzden oluyordu: yazma sessizce
// başarısız oluyordu, sebebi görünmüyordu).
export async function recordBackup(by?: string): Promise<{ ok: boolean; error?: string }> {
  const r = await setAppValueDetailed(KEY, { at: new Date().toISOString(), by: by || "" })
  if (r.ok && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yt:backup-recorded"))
  }
  return r
}

export { backupAgeDays } from "@/lib/backupAge"

// Son yedeğin tarihi (tüm cihazlar görür). Ayarlar > Yedeği İndir ya da hatırlatma şeridindeki "Şimdi yedekle" ile yazılır.
import { getAppValue, setAppValue } from "@/lib/appStore"

const KEY = "last_backup"

export async function getLastBackup(): Promise<string | null> {
  const v = await getAppValue<{ at?: string } | null>(KEY, null)
  return v && typeof v.at === "string" ? v.at : null
}

export async function recordBackup(by?: string): Promise<void> {
  await setAppValue(KEY, { at: new Date().toISOString(), by: by || "" })
}

export { backupAgeDays } from "@/lib/backupAge"

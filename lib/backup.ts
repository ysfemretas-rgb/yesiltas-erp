// Yedekleme (dışa/içe aktarma). Uygulamadaki tüm iş verisi şu an localStorage'da
// tutulduğu için (bkz. Supabase'e taşıma projesi), bu dosya en azından tek
// tıkla tam bir yedek alıp geri yükleyebilmeyi sağlar.

export const BACKUP_KEYS = [
  'yt_app_users',
  'yt_appointments',
  'yt_company',
  'yt_consumables',
  'yt_customers',
  'yt_finance',
  'yt_inventory',
  'yt_login_records',
  'yt_products',
  'yt_repair_notes',
  'yt_repairs',
  'yt_sales',
  'yt_staff',
  'yt_suppliers',
  'yt_warranties',
] as const

export interface BackupFile {
  app: 'yesiltas-erp'
  exportedAt: string
  data: Record<string, unknown>
}

export function exportBackup(): void {
  const data: Record<string, unknown> = {}
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }
  }

  const backup: BackupFile = {
    app: 'yesiltas-erp',
    exportedAt: new Date().toISOString(),
    data,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `yesiltas-erp-yedek-${dateStr}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function readBackupFile(file: File): Promise<BackupFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (!parsed || parsed.app !== 'yesiltas-erp' || typeof parsed.data !== 'object') {
          reject(new Error('Bu dosya geçerli bir Yeşiltaş ERP yedeği değil.'))
          return
        }
        resolve(parsed as BackupFile)
      } catch {
        reject(new Error('Dosya okunamadı. Geçerli bir JSON yedek dosyası seçin.'))
      }
    }
    reader.onerror = () => reject(new Error('Dosya okunamadı.'))
    reader.readAsText(file)
  })
}

export function restoreBackup(backup: BackupFile): void {
  for (const key of BACKUP_KEYS) {
    if (key in backup.data) {
      localStorage.setItem(key, JSON.stringify(backup.data[key]))
    }
  }
}

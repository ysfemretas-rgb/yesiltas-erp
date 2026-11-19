// Yedekleme (dışa aktarma) ve geri yükleme. İş verisinin tamamı Supabase'de
// olduğu için, bu dosya gerçek verileri Supabase'den çekip tek bir JSON
// dosyası olarak indirir; aynı dosya "Yedekten Geri Yükle" ile geri
// yüklenebilir. Gerçek bir felaket kurtarma için Supabase'in kendi proje
// yedekleme özelliğini de kullan (Supabase Dashboard → Database → Backups).

import { supabase, fetchAllRows } from '@/lib/supabase'

// Geri yükleme sırası önemli: önce bağımsız tablolar, sonra onlara bağlı olanlar.
// v60: önceden eksik olan 5 tablo eklendi (cash_counts, scheduled_payments,
// settlement_discounts, app_settings, activity_log) — bu tablolar daha önce
// yedeğe dahil edilmiyordu, bkz. DUZELTMELER.md > v60.
const RESTORE_TABLES: { table: string; order: string; idColumn?: string; conflictKey?: string }[] = [
  { table: 'customers', order: 'created_at' },
  { table: 'suppliers', order: 'created_at' },
  { table: 'inventory', order: 'created_at' },
  { table: 'staff', order: 'created_at' },
  { table: 'sales', order: 'created_at' },
  { table: 'devices', order: 'received_date' },
  { table: 'debts', order: 'created_at' },
  { table: 'transactions', order: 'created_at' },
  { table: 'warranties', order: 'created_at' },
  { table: 'appointments', order: 'created_at' },
  { table: 'consumables', order: 'created_at' },
  { table: 'tasks', order: 'created_at' },
  { table: 'fixed_assets', order: 'created_at' },
  { table: 'repair_notes', order: 'created_at' },
  { table: 'supplier_payments', order: 'created_at' },
  { table: 'stock_movements', order: 'created_at' },
  { table: 'device_purchases', order: 'created_at' },
  { table: 'products', order: 'created_at' },
  { table: 'cash_counts', order: 'created_at' },
  { table: 'scheduled_payments', order: 'created_at' },
  { table: 'settlement_discounts', order: 'created_at' },
  { table: 'activity_log', order: 'created_at' },
  // app_settings'in birincil anahtarı "id" değil "key"; sıralama ve çakışma
  // çözümü buna göre yapılmalı.
  { table: 'app_settings', order: 'key', idColumn: 'key', conflictKey: 'key' },
]

export interface RestoreReport {
  restored: Record<string, number>
  failed: Record<string, string>
}

// Yedek dosyasındaki kayıtları (ID'ye göre) veritabanına işler: mevcut kayıt güncellenir,
// eksik kayıt eklenir. Yedekte olmayan kayıtlara dokunulmaz (silme yapılmaz).
export async function restoreBackup(file: File): Promise<RestoreReport> {
  const text = await file.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Dosya okunamadı: geçerli bir yedek dosyası değil.')
  }
  if (parsed?.app !== 'yesiltas-erp' || parsed?.format !== 2 || typeof parsed?.tables !== 'object') {
    throw new Error('Bu dosya geri yüklenebilir bir yedek değil. Yalnızca yeni sürümden indirilen yedekler geri yüklenebilir.')
  }
  const report: RestoreReport = { restored: {}, failed: {} }
  for (const t of RESTORE_TABLES) {
    const rows = parsed.tables[t.table]
    if (!Array.isArray(rows) || rows.length === 0) continue
    try {
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200)
        const { error } = await supabase.from(t.table).upsert(chunk, { onConflict: t.conflictKey || 'id' })
        if (error) throw error
      }
      report.restored[t.table] = rows.length
    } catch (e: any) {
      report.failed[t.table] = e?.message || 'Bilinmeyen hata'
    }
  }
  return report
}

export interface CollectResult {
  ok: boolean
  failedTables: string[]
  backup?: Record<string, unknown>
}

// Adım 1/2: Tüm tabloları Supabase'den çeker (sadece ağ isteği, henüz dosya
// indirmez). Not: Geri yükleme yalnızca `tables` alanını okur, bu yüzden
// burada ikinci bir "kullanıcı dostu" veri turu çekilmiyor (v60 öncesi
// sürümde 13 ayrı fonksiyon tekrar çağrılıp hiç kullanılmayan bir `data`
// alanı dolduruluyordu — bkz. DUZELTMELER.md > v60). `company` tek istisna:
// localStorage'dan okunuyor, ağ isteği gerektirmiyor, insan tarafından
// okunabilir referans olarak eklenir.
export async function collectBackupData(): Promise<CollectResult> {
  let company: unknown = null
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('yt_company') : null
    if (raw) company = JSON.parse(raw)
  } catch {
    // yoksay
  }

  // Bir tablo çekilemezse yedek EKSİK kabul edilir ve indirme yapılmaz
  // (önceden hata sadece konsola yazılıp dosya yine indiriliyordu —
  // kullanıcı "yedek tam" diye düşünebiliyordu, bkz. 4.1).
  const rawTables: Record<string, unknown[]> = {}
  const failedTables: string[] = []
  for (const t of RESTORE_TABLES) {
    try {
      rawTables[t.table] = await fetchAllRows(t.table, t.order, true, undefined, t.idColumn || 'id')
    } catch (e) {
      console.error(`${t.table} yedeğe eklenemedi:`, e)
      failedTables.push(t.table)
    }
  }

  if (failedTables.length > 0) {
    return { ok: false, failedTables }
  }

  const backup = {
    app: 'yesiltas-erp',
    format: 2,
    exportedAt: new Date().toISOString(),
    note: 'Bu dosya Ayarlar > Yedekleme > "Yedekten Geri Yükle" ile geri yüklenebilir (kayıtlar birleştirilir, silinen kayıtlar geri gelir, mevcutlar güncellenir). Ayrıca Supabase Dashboard > Database > Backups kullanılabilir.',
    tables: rawTables,
    data: { company },
  }
  return { ok: true, failedTables: [], backup }
}

// Adım 2/2: Önceden toplanan veriyi dosya olarak indirir (ağ isteği yapmaz).
// iOS'ta "Dosyalara Kaydet" penceresi uygulamayı arka plana attığı için, bu
// adım her zaman ağ yazma işlemlerinden (recordBackup) SONRA çağrılmalı —
// bkz. DUZELTMELER.md > v57.
export function downloadBackupFile(backup: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `yesiltas-erp-yedek-${dateStr}.json`
  link.click()
  URL.revokeObjectURL(url)
}

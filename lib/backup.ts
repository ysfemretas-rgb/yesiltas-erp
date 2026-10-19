// Yedekleme (dışa aktarma). Artık iş verisinin tamamı Supabase'de olduğu
// için, bu dosya gerçek verileri Supabase'den çekip tek bir JSON dosyası
// olarak indirir. Geri yükleme (içe aktarma) kasıtlı olarak yok — 13 farklı
// tabloya güvenli, çakışmasız toplu geri yükleme yapmak, test edemeyeceğim
// kadar riskli bir işlem. Gerçek bir felaket kurtarma için Supabase'in
// kendi proje yedekleme özelliğini kullan (Supabase Dashboard → Database →
// Backups) ya da bu JSON dosyasını muhasebe/kayıt amaçlı referans olarak sakla.

import { supabase, fetchAllRows } from '@/lib/supabase'
import { fetchSuppliers } from '@/lib/suppliers'
import { fetchWarranties } from '@/lib/warranties'
import { fetchAppointments } from '@/lib/appointments'
import { fetchCustomers } from '@/lib/customers'
import { fetchTransactions } from '@/lib/finance'
import { fetchInventory } from '@/lib/inventory'
import { fetchConsumables } from '@/lib/consumables'
import { fetchStaff } from '@/lib/staff'
import { fetchSales } from '@/lib/sales'
import { fetchRepairs } from '@/lib/repairs'
import { fetchProducts } from '@/lib/products'
import { fetchRepairNotes } from '@/lib/repairNotes'
import { fetchTasks } from '@/lib/tasks'

// Geri yükleme sırası önemli: önce bağımsız tablolar, sonra onlara bağlı olanlar.
const RESTORE_TABLES: { table: string; order: string }[] = [
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
        const { error } = await supabase.from(t.table).upsert(chunk, { onConflict: 'id' })
        if (error) throw error
      }
      report.restored[t.table] = rows.length
    } catch (e: any) {
      report.failed[t.table] = e?.message || 'Bilinmeyen hata'
    }
  }
  return report
}

export async function exportBackup(): Promise<void> {
  const [
    suppliers, warranties, appointments, customers, transactions,
    inventory, consumables, staff, sales, repairs, products, repairNotes, tasks,
  ] = await Promise.all([
    fetchSuppliers().catch(() => []),
    fetchWarranties().catch(() => []),
    fetchAppointments().catch(() => []),
    fetchCustomers().catch(() => []),
    fetchTransactions().catch(() => []),
    fetchInventory().catch(() => []),
    fetchConsumables().catch(() => []),
    fetchStaff().catch(() => []),
    fetchSales().catch(() => []),
    fetchRepairs().catch(() => []),
    fetchProducts().catch(() => []),
    fetchRepairNotes().catch(() => []),
    fetchTasks().catch(() => []),
  ])

  let company: unknown = null
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('yt_company') : null
    if (raw) company = JSON.parse(raw)
  } catch {
    // yoksay
  }

  // Geri yüklenebilir ham tablo verisi (format 2)
  const rawTables: Record<string, unknown[]> = {}
  for (const t of RESTORE_TABLES) {
    try {
      rawTables[t.table] = await fetchAllRows(t.table, t.order, true)
    } catch (e) {
      console.error(`${t.table} yedeğe eklenemedi:`, e)
    }
  }

  const backup = {
    app: 'yesiltas-erp',
    format: 2,
    exportedAt: new Date().toISOString(),
    note: 'Bu dosya Ayarlar > Yedekleme > "Yedekten Geri Yükle" ile geri yüklenebilir (kayıtlar birleştirilir, silinen kayıtlar geri gelir, mevcutlar güncellenir). Ayrıca Supabase Dashboard > Database > Backups kullanılabilir.',
    tables: rawTables,
    data: {
      company, suppliers, warranties, appointments, customers, transactions,
      inventory, consumables, staff, sales, repairs, products, repairNotes, tasks,
    },
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

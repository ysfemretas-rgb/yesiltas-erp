// Yedekleme (dışa aktarma). Artık iş verisinin tamamı Supabase'de olduğu
// için, bu dosya gerçek verileri Supabase'den çekip tek bir JSON dosyası
// olarak indirir. Geri yükleme (içe aktarma) kasıtlı olarak yok — 13 farklı
// tabloya güvenli, çakışmasız toplu geri yükleme yapmak, test edemeyeceğim
// kadar riskli bir işlem. Gerçek bir felaket kurtarma için Supabase'in
// kendi proje yedekleme özelliğini kullan (Supabase Dashboard → Database →
// Backups) ya da bu JSON dosyasını muhasebe/kayıt amaçlı referans olarak sakla.

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

  const backup = {
    app: 'yesiltas-erp',
    exportedAt: new Date().toISOString(),
    note: 'Bu dosya sadece kayıt/referans amaçlıdır — geri yükleme desteklenmiyor. Felaket kurtarma için Supabase Dashboard > Database > Backups kullanın.',
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

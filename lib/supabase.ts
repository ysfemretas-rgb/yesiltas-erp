import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase tek istekte en fazla 1000 satır döndürür; eskiden .limit(1000) ile
// 1000. kayıttan sonrası sessizce kayboluyordu. Bu yardımcı sayfa sayfa
// çekerek tüm kayıtları getirir.
export async function fetchAllRows(
  table: string,
  orderColumn: string,
  ascending = false,
  thenBy?: string // aynı değerlerde (ör. aynı tarihli kayıtlar) ikinci sıralama sütunu, ör. created_at
): Promise<any[]> {
  const pageSize = 1000
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    let q = supabase.from(table).select("*").order(orderColumn, { ascending })
    if (thenBy && thenBy !== orderColumn) q = q.order(thenBy, { ascending })
    // son çare benzersiz sıralama: aynı değerli kayıtlar sayfa geçişinde kaybolmasın/tekrarlanmasın
    const { data, error } = await q.order("id", { ascending }).range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < pageSize) break
    if (from >= 200000) throw new Error(`${table} tablosu 200.000 kayıt sınırını aştı; liste tamamlanamadı.`)
  }
  return all
}

// Yeni sürümlerle eklenen sütunlar (ör. extra_cost, stage, imei) veritabanına henüz eklenmemişse
// ("Could not find the ... column") kayıt işlemi tamamen başarısız olmasın diye, o sütunlar
// çıkarılıp işlem bir kez daha denenir. Bu durumda yeni özelliğe ait veri kaydedilmez ama satış/tamir
// kaydı yapılabilir. (İlgili SQL migrasyonunu çalıştırınca her şey normale döner.)
export function isMissingColumnError(err: any): boolean {
  const msg = String(err?.message || "")
  return err?.code === "PGRST204" || err?.code === "42703" || /could not find the .* column|column .* does not exist/i.test(msg)
}

export function stripColumns(row: Record<string, unknown>, cols: string[]): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...row }
  cols.forEach((c) => delete copy[c])
  return copy
}

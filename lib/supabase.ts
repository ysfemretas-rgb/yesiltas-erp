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
  ascending = false
): Promise<any[]> {
  const pageSize = 1000
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending })
      .range(from, from + pageSize - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < pageSize) break
    if (from > 200000) break
  }
  return all
}

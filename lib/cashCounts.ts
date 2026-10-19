// Kasa sayımı: açılışta ve kapanışta sayılan nakit, beklenenle karşılaştırılır; fark açıklamasıyla kaydedilir.
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"

export interface CashCount {
  id: string
  date: string
  kind: "open" | "close"
  countedCash: number
  expectedCash: number | null
  nonCash: number
  difference: number | null
  note: string
  userName: string
  createdAt: string
}

function fromRow(r: any): CashCount {
  return {
    id: r.id,
    date: r.count_date ? String(r.count_date).slice(0, 10) : "",
    kind: r.kind,
    countedCash: Number(r.counted_cash) || 0,
    expectedCash: r.expected_cash === null || r.expected_cash === undefined ? null : Number(r.expected_cash),
    nonCash: Number(r.non_cash) || 0,
    difference: r.difference === null || r.difference === undefined ? null : Number(r.difference),
    note: r.note ?? "",
    userName: r.user_name ?? "",
    createdAt: r.created_at ?? "",
  }
}

export async function fetchCashCounts(limit = 30): Promise<CashCount[]> {
  const { data, error } = await supabase
    .from("cash_counts")
    .select("*")
    .order("count_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map(fromRow)
}

function userName(): string {
  try {
    const raw = localStorage.getItem("yt_user")
    return raw ? JSON.parse(raw)?.name || "" : ""
  } catch {
    return ""
  }
}

export async function createCashCount(input: {
  date: string
  kind: "open" | "close"
  countedCash: number
  expectedCash?: number
  nonCash?: number
  note?: string
}): Promise<CashCount> {
  const difference = input.expectedCash !== undefined ? Math.round((input.countedCash - input.expectedCash) * 100) / 100 : null
  const { data, error } = await supabase
    .from("cash_counts")
    .insert({
      count_date: input.date,
      kind: input.kind,
      counted_cash: input.countedCash,
      expected_cash: input.expectedCash ?? null,
      non_cash: input.nonCash ?? 0,
      difference,
      note: input.note || "",
      user_name: userName(),
    })
    .select("*")
    .single()
  if (error) throw error
  logActivity(
    "Finans",
    "created",
    `Kasa ${input.kind === "open" ? "açılış" : "kapanış"} sayımı: ${input.countedCash.toLocaleString("tr-TR")} TL${difference !== null ? ` (fark ${difference > 0 ? "+" : ""}${difference.toLocaleString("tr-TR")} TL)` : ""}${input.note ? ` — ${input.note}` : ""}`
  )
  return fromRow(data)
}

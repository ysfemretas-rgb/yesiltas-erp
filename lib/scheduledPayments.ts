// Ödeme takvimi: kira, fatura, vergi, tedarikçi gibi ileri tarihli ödemeler.
import { supabase } from "@/lib/supabase"
import { logActivity } from "@/lib/activityLog"
import { createTransaction } from "@/lib/finance"
import { localDateStr } from "@/lib/dates"

export interface ScheduledPayment {
  id: string
  title: string
  category: string
  amount: number
  dueDate: string
  repeat: "none" | "monthly"
  status: "pending" | "paid"
  paidDate: string
  note: string
}

export const PAYMENT_CATEGORIES = ["Kira", "Fatura", "Vergi/SGK", "Tedarikçi", "Maaş", "Kredi/Taksit", "Diğer"]

function fromRow(r: any): ScheduledPayment {
  return {
    id: r.id,
    title: r.title ?? "",
    category: r.category ?? "Diğer",
    amount: Number(r.amount) || 0,
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : "",
    repeat: r.repeat === "monthly" ? "monthly" : "none",
    status: r.status === "paid" ? "paid" : "pending",
    paidDate: r.paid_date ? String(r.paid_date).slice(0, 10) : "",
    note: r.note ?? "",
  }
}

export async function fetchScheduledPayments(): Promise<ScheduledPayment[]> {
  const { data, error } = await supabase.from("scheduled_payments").select("*").order("due_date", { ascending: true }).limit(500)
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function createScheduledPayment(input: Omit<ScheduledPayment, "id" | "status" | "paidDate">): Promise<ScheduledPayment> {
  const { data, error } = await supabase
    .from("scheduled_payments")
    .insert({ title: input.title, category: input.category, amount: input.amount, due_date: input.dueDate, repeat: input.repeat, note: input.note })
    .select("*")
    .single()
  if (error) throw error
  logActivity("Finans", "created", `Ödeme takvimine eklendi: ${input.title} — ${input.amount.toLocaleString("tr-TR")} TL (${input.dueDate})`)
  return fromRow(data)
}

export async function deleteScheduledPayment(id: string): Promise<void> {
  const { data, error } = await supabase.from("scheduled_payments").delete().eq("id", id).select("id")
  if (error) throw error
  if (!data || data.length === 0) throw new Error("Silme yetkisi yalnızca Yönetici'dedir.")
}

// Bir sonraki ayın aynı günü (ay sonunu aşmadan)
export function addOneMonth(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDate()
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, lastDay))
  return localDateStr(next)
}

// "Ödendi" işaretler ve tutarı kasaya gider olarak yazar. Aylık tekrarlıysa bir sonraki ayın kaydını açar.
export async function markPaymentPaid(p: ScheduledPayment): Promise<{ next?: ScheduledPayment }> {
  const today = localDateStr()
  // Önce kasa gideri; başarısızsa kayıt "ödendi" yapılmaz (kasa ile takvim ayrışmasın)
  await createTransaction({
    type: "expense",
    category: p.category === "Tedarikçi" ? "Tedarikçi Ödemesi" : `Sabit Gider — ${p.category}`,
    amount: p.amount,
    description: `📅 ${p.title} (vade ${p.dueDate})`,
    date: today,
    customer: "",
    source: "manual",
  })
  const { error } = await supabase.from("scheduled_payments").update({ status: "paid", paid_date: today }).eq("id", p.id)
  if (error) throw error
  logActivity("Finans", "updated", `Ödeme yapıldı: ${p.title} — ${p.amount.toLocaleString("tr-TR")} TL`)
  let next: ScheduledPayment | undefined
  if (p.repeat === "monthly") {
    next = await createScheduledPayment({ title: p.title, category: p.category, amount: p.amount, dueDate: addOneMonth(p.dueDate), repeat: "monthly", note: p.note })
  }
  return { next }
}

// Günlük bildirim özeti (Web Push) — Vercel Cron tarafından çağrılır (bkz. vercel.json).
// "Bildirimler telefona düşmüyor" sorununun çözümü: bu rota günde BİR KEZ çalışır, o gün için
// hatırlatma varsa kayıtlı tüm telefonlara gerçek bir OS bildirimi gönderir.
//
// ÖNEMLİ SINIR: Vercel'in ücretsiz (Hobby) planında cron günde sadece 1 kez çalışabilir ve
// saati birebir garanti değildir (birkaç dakika kayabilir). Anlık/çoklu günlük bildirim
// isteniyorsa Vercel planının yükseltilmesi gerekir — bkz. DUZELTMELER.md > v53.
import webpush from "web-push"
import { supabase } from "@/lib/supabase"
import { fetchRepairs } from "@/lib/repairs"
import { fetchTasks } from "@/lib/tasks"
import { fetchAppointments } from "@/lib/appointments"
import { stageOf } from "@/lib/repairWorkflow"

export const dynamic = "force-dynamic"

function todayInTurkey(): string {
  // Sunucu UTC çalışır; Türkiye (UTC+3) bugününü sağlam şekilde hesaplar (saat dilimi kaymasına bakmaz).
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) // YYYY-MM-DD
}

function daysSince(dateStr: string, today: string): number {
  const a = new Date(dateStr).getTime()
  const b = new Date(today).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.floor((b - a) / 86400000)
}

async function buildDigest(): Promise<{ count: number; lines: string[] }> {
  const today = todayInTurkey()
  const lines: string[] = []
  let count = 0

  let pickupReminderDays = 3
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "company").maybeSingle()
    const v = Number((data?.value as any)?.pickupReminderDays)
    if (Number.isFinite(v) && v > 0) pickupReminderDays = v
  } catch { /* varsayılanla devam */ }

  try {
    const repairs = await fetchRepairs()
    const pickup = repairs.filter((r) => stageOf(r) === "ready" && daysSince(r.createdAt, today) >= pickupReminderDays)
    const parts = repairs.filter((r) => stageOf(r) === "awaiting_parts")
    if (pickup.length) { lines.push(`🎁 ${pickup.length} cihaz teslim alınmayı bekliyor`); count += pickup.length }
    if (parts.length) { lines.push(`📦 ${parts.length} tamir parça bekliyor`); count += parts.length }
  } catch (e) { console.error("push-digest: tamirler okunamadı", e) }

  try {
    const tasks = await fetchTasks()
    const dueTasks = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate <= today)
    if (dueTasks.length) { lines.push(`📝 ${dueTasks.length} görevin vadesi geldi/geçti`); count += dueTasks.length }
  } catch (e) { console.error("push-digest: görevler okunamadı", e) }

  try {
    const appts = await fetchAppointments()
    const todays = appts.filter((a) => a.status === "scheduled" && a.date === today)
    if (todays.length) { lines.push(`📅 Bugün ${todays.length} randevu var`); count += todays.length }
  } catch (e) { console.error("push-digest: randevular okunamadı", e) }

  return { count, lines }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:destek@yesiltasteknoloji.com"
  if (!vapidPublic || !vapidPrivate) {
    return Response.json({ error: "VAPID anahtarları ayarlanmamış (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)" }, { status: 500 })
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const { count, lines } = await buildDigest()
  if (count === 0) {
    return Response.json({ sent: 0, reason: "Bugün için hatırlatma yok." })
  }

  const { data: subs, error } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth")
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  if (!subs || subs.length === 0) {
    return Response.json({ sent: 0, reason: "Kayıtlı abonelik yok." })
  }

  const payload = JSON.stringify({
    title: "Yeşiltaş ERP — Bugün",
    body: `${count} hatırlatmanız var:\n${lines.join("\n")}`,
    url: "/dashboard/today",
  })

  let sent = 0
  const staleEndpoints: string[] = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload)
        sent++
      } catch (e: any) {
        // 404/410: abonelik artık geçersiz (kullanıcı izni geri aldı, cihaz değişti vb.) — temizle.
        if (e?.statusCode === 404 || e?.statusCode === 410) staleEndpoints.push(s.endpoint)
        else console.error("push gönderilemedi:", s.endpoint, e?.message || e)
      }
    })
  )

  if (staleEndpoints.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints)
  }

  return Response.json({ sent, total: subs.length, removedStale: staleEndpoints.length, count, lines })
}

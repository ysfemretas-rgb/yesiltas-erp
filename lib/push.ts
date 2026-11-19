// Telefona GERÇEK bildirim (Web Push) — tarayıcı/telefon aboneliği.
// Önkoşul (iPhone): Uygulama "Ana Ekrana Ekle" ile eklenmiş olmalı (iOS 16.4+ push bildirimlerini
// sadece ana ekrana eklenmiş uygulamalara veriyor, sekmede açıkken ÇALIŞMAZ).
"use client"

import { supabase, isMissingColumnError, stripColumns } from "@/lib/supabase"

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64Safe)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported"
  return Notification.permission
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return !!sub
  } catch {
    return false
  }
}

// İzin ister, abone olur ve aboneliği Supabase'e kaydeder. Hata mesajı Türkçe, kullanıcıya gösterilebilir.
export async function subscribeToPush(): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) {
    return { ok: false, message: "Bu tarayıcı/cihaz bildirim desteklemiyor. iPhone'da önce bu uygulamayı Paylaş > Ana Ekrana Ekle ile ekleyin, sonra Safari yerine ana ekrandaki simgeden açıp tekrar deneyin." }
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    return { ok: false, message: "Sunucu tarafında bildirim anahtarı (VAPID) henüz ayarlanmamış. Vercel ortam değişkenlerini kontrol edin." }
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      return { ok: false, message: "Bildirim izni verilmedi. Telefon Ayarları > Bildirimler'den bu uygulamaya izin verip tekrar deneyin." }
    }
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      })
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, message: "Abonelik bilgisi alınamadı." }
    }
    // v60: kaydı giriş yapan personele bağlar (supabase-push-subscriptions-guvenlik-onar.sql
    // çalıştırılmadıysa user_id sütunu henüz yoktur; o durumda sütun atılıp tekrar denenir).
    const { data: userData } = await supabase.auth.getUser()
    const row: Record<string, unknown> = {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 200),
      user_id: userData?.user?.id || null,
    }
    let { error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" })
    if (error && isMissingColumnError(error)) {
      ;({ error } = await supabase.from("push_subscriptions").upsert(stripColumns(row, ["user_id"]), { onConflict: "endpoint" }))
    }
    if (error) {
      console.error("push_subscriptions kaydı başarısız:", error)
      return { ok: false, message: "Abonelik tarayıcıda oluştu ama sunucuya kaydedilemedi (supabase-push-subscriptions-migration.sql çalıştırıldı mı?)." }
    }
    return { ok: true, message: "Bildirimler açıldı. Her gün bir kez, o gün için hatırlatmanız varsa telefonunuza bildirim düşecek." }
  } catch (e) {
    console.error("Push aboneliği başarısız:", e)
    return { ok: false, message: "Bildirim açılamadı. iPhone'da bu uygulamanın Ana Ekrana Ekle ile eklendiğinden emin olun." }
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
      await sub.unsubscribe()
    }
  } catch (e) {
    console.error("Push aboneliği iptal edilemedi:", e)
  }
}

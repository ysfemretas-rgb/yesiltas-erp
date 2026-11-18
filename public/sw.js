// Yeşiltaş ERP — hafif servis çalışanı (service worker).
// Amaç: internet yokken uygulama "boş ekran/hata" yerine anlaşılır bir sayfa göstersin ve
// uygulama dosyaları (JS/CSS) hızlı açılsın. Veriler (müşteri, satış, stok vb.) önbelleğe
// ALINMAZ; veri işlemleri için internet gerekir. Supabase ve dış istekler hiç yakalanmaz.
const VERSION = "yt-v1"
const STATIC_CACHE = `static-${VERSION}`
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL])))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

// Telefona GERÇEK bildirim (Web Push): sunucudan (günlük cron) gelen push olayını
// işletim sistemi bildirimi olarak gösterir. Uygulama kapalıyken de tetiklenir.
self.addEventListener("push", (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }
  const title = data.title || "Yeşiltaş ERP"
  const options = {
    body: data.body || "",
    icon: "/app-icon-192x192.png",
    badge: "/app-icon-192x192.png",
    data: { url: data.url || "/dashboard/today" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Bildirime dokununca: uygulama zaten açıksa o sekmeye odaklan, değilse yeni aç.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/dashboard/today"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus().then(() => client.navigate ? client.navigate(url) : undefined)
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Supabase, kur servisi vb. dokunulmaz

  // Sayfa gezintisi: önce ağ, olmazsa çevrimdışı sayfası
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Next.js'in sürümlü (hash'li) statik dosyaları: önce önbellek
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
      })
    )
  }
})

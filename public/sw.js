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

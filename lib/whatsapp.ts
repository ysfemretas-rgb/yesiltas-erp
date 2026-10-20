// WhatsApp'ı açar. Telefonda (özellikle iPhone'da ana ekrana eklenmiş uygulamada) wa.me bağlantısı
// uygulama içi tarayıcıda açılıp WhatsApp'a geçince "bembeyaz sayfada" takılı kalıyordu ve
// kapatınca ERP en başa dönüyordu. Artık mobilde doğrudan WhatsApp uygulamasına (whatsapp://)
// geçilir; ERP sayfası olduğu gibi kalır. Uygulama açılmazsa (yüklü değil vb.) web sürümü denenir.
// phone: ülke koduyla birlikte rakamlar (örn. 905551112233); boş olabilir (kişiyi WhatsApp'ta seçersiniz).
export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const digits = (phone || "").replace(/\D/g, "")
  const text = encodeURIComponent(message)
  const web = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`

  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (!isMobile) {
    window.open(web, "_blank")
    return
  }

  const app = digits ? `whatsapp://send?phone=${digits}&text=${text}` : `whatsapp://send?text=${text}`
  let switched = false
  const onVisibility = () => {
    if (document.hidden) switched = true
  }
  document.addEventListener("visibilitychange", onVisibility)
  window.location.href = app
  // Uygulama açılırsa sayfa gizlenir; açılmadıysa web sürümü denenir
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility)
    if (!switched && !document.hidden) window.open(web, "_blank")
  }, 2000)
}

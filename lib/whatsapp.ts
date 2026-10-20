// WhatsApp'ı açar.
//
// SORUN: wa.me bağlantısı telefonda (özellikle iPhone'da) uygulama içi tarayıcı penceresinde açılıyor;
// WhatsApp'a geçip dönünce o pencere "bembeyaz sayfada" takılı kalıyor, kapatınca ERP en başa dönüyordu.
//
// ÇÖZÜM: Telefonda hiçbir web sayfası açılmaz; doğrudan WhatsApp uygulamasının kendi bağlantısına
// (whatsapp://) gidilir. iPhone'da Safari ilk seferde "WhatsApp'ta aç?" diye sorabilir.
// iPhone'da yedek (web) bağlantı BİLİNÇLİ OLARAK yok: o yedek, iPhone'un onay penceresi açıkken
// devreye girip aynı beyaz sayfayı yeniden açıyordu. Bilgisayarda wa.me web sürümü açılır.
//
// phone: ülke koduyla birlikte rakamlar (örn. 905551112233); boş olabilir (kişiyi WhatsApp'ta seçersiniz).
export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const digits = (phone || "").replace(/\D/g, "")
  const text = encodeURIComponent(message)
  const web = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(ua)

  if (!isIOS && !isAndroid) {
    window.open(web, "_blank")
    return
  }

  const app = digits ? `whatsapp://send?phone=${digits}&text=${text}` : `whatsapp://send?text=${text}`

  if (isIOS) {
    // Doğrudan uygulamaya geç; sayfa aynen kalır. (Yedek yok — açıklama yukarıda.)
    window.location.href = app
    return
  }

  // Android: uygulama açılmazsa (nadir) 2,5 sn sonra web sürümüne düş
  let switched = false
  const onHide = () => {
    if (document.hidden) switched = true
  }
  document.addEventListener("visibilitychange", onHide)
  window.location.href = app
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide)
    if (!switched && !document.hidden) window.open(web, "_blank")
  }, 2500)
}

// WhatsApp mesaj şablonları — Ayarlar sayfasından düzenlenebilir, üç modül
// için ayrı ayrı saklanır (Satış / Teknik Servis / Müşteri Borç Hatırlatma).
// Şablonlarda {parantez} içindeki kelimeler ilgili sayfa tarafından gerçek
// değerlerle değiştirilir.

export interface WhatsAppTemplates {
  sales: string
  repairs: string
  customerDebt: string
}

const STORAGE_KEY = "yt_whatsapp_templates"

export const DEFAULT_TEMPLATES: WhatsAppTemplates = {
  sales: `👋 Merhaba *{musteri}*,

✅ *Yeşiltaş Teknoloji* satış işleminiz hakkında bilgi vermek istiyoruz.

🛒 *Satış Detayları:*
{urunler}

💰 *Toplam Tutar:* {toplam} TL
{odeme_durumu}
📅 *Tarih:* {tarih}

🙏 Teşekkür ederiz, iyi günler dileriz!
🏪 *Yeşiltaş Teknoloji*`,

  repairs: `👋 Merhaba *{musteri}*,

✅ *{cihaz}* cihazınızın tamiri tamamlanmıştır. 🔧

{odeme_durumu}

🏪 *Yeşiltaş Teknoloji*
📞 Bizi tercih ettiğiniz için teşekkür ederiz! 🙏`,

  customerDebt: `👋 Merhaba *{musteri}*,

✅ *Yeşiltaş Teknoloji*'den bilgilendirme mesajıdır.

{odeme_bilgisi}

🙏 Teşekkür ederiz, iyi günler dileriz!
🏪 *Yeşiltaş Teknoloji*`,
}

export function getWhatsAppTemplates(): WhatsAppTemplates {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TEMPLATES
    return { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_TEMPLATES
  }
}

export function saveWhatsAppTemplates(templates: WhatsAppTemplates): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

// {degisken} biçimindeki tüm yer tutucuları verilen değerlerle değiştirir.
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match))
}

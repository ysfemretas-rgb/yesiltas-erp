// Phone validation
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '').replace(/^0/, '').replace(/^\+90/, '')
  return /^5\d{9}$/.test(cleaned)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  return phone
}

// Email validation
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// IMEI validation
export function validateIMEI(imei: string): boolean {
  return /^\d{15}$/.test(imei.replace(/\s/g, ''))
}

// v60: "IMEI / Seri No" gibi çift amaçlı alanlarda (envanter) her girilen metin
// IMEI olmak zorunda değil — aksesuar/ürün seri numarası harf de içerebilir.
// Bu yüzden sadece "görünüşe göre IMEI girilmeye çalışılmış ama hatalı" durumunda
// (tamamen rakamlardan oluşuyor ama 15 hane değil) uyarı gösterilir; harf içeren
// gerçek seri numaraları için uyarı çıkmaz.
export function imeiLooksInvalid(value: string): boolean {
  const v = value.replace(/\s/g, '')
  if (!v) return false
  return /^\d+$/.test(v) && !validateIMEI(v)
}

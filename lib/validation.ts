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

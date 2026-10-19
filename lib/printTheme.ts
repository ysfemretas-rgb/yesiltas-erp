// Tüm yazdırılan belgeler (satış fişi, tamir teslim belgesi, alım belgesi, gün sonu,
// etiketler) için ortak "resmi belge" tasarımı: logo + firma antet bilgileri.
// Logo, uygulamanın public klasöründeki /logo-512x512.png dosyasıdır.

export interface CompanyInfo {
  name?: string
  address?: string
  phone?: string
  email?: string
  taxNumber?: string
  iban?: string
  accountName?: string
}

// Ayarlar sayfasındaki örnek (yer tutucu) değerler. Kullanıcı bunları değiştirmediyse
// resmi belgelere sahte adres/IBAN/vergi no basılmasın diye gizlenir.
const PLACEHOLDERS = [
  "İstanbul, Kadıköy, Caferağa Mah. Örnek Sok. No:15",
  "0216 123 4567",
  "info@yesiltas.com",
  "123 456 7890",
  "TR00 1234 5678 9012 3456 7890 12",
]

export function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function money(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
}

export function readCompany(): CompanyInfo {
  let raw: CompanyInfo = {}
  try {
    raw = JSON.parse(localStorage.getItem("yt_company") || "{}")
  } catch {
    raw = {}
  }
  const clean = (v?: string) => (v && !PLACEHOLDERS.includes(v.trim()) ? v.trim() : "")
  return {
    name: (raw.name || "").trim() || "Yeşiltaş Teknoloji",
    address: clean(raw.address),
    phone: clean(raw.phone),
    email: clean(raw.email),
    taxNumber: clean(raw.taxNumber),
    iban: clean(raw.iban),
    accountName: (raw.accountName || "").trim(),
  }
}

export function logoUrl(): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/logo-512x512.png`
}

// Belge sayfası stilleri (A5/A4 uyumlu, siyah-beyaz yazıcıda da okunur)
export function docStyles(extra = ""): string {
  return `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif; color: #111827; margin: 0; font-size: 11.5px; line-height: 1.5; }
  .letterhead { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 2px solid #064e3b; position: relative; }
  .letterhead::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; border-bottom: 0.6px solid #064e3b; }
  .letterhead .logo { width: 18mm; height: 18mm; object-fit: contain; flex: none; }
  .letterhead .co { flex: 1; min-width: 0; }
  .letterhead .co-name { font-size: 16px; font-weight: 700; color: #064e3b; letter-spacing: 0.3px; }
  .letterhead .co-line { font-size: 10px; color: #4b5563; line-height: 1.35; }
  .doc-title { margin: 14px 0 8px; padding: 6px 0; text-align: center; font-size: 12.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid #064e3b; border-bottom: 1px solid #064e3b; background: #f3f6f4; }
  .meta { display: flex; justify-content: space-between; font-size: 10.5px; color: #374151; margin-bottom: 8px; }
  table.grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.grid th { text-align: left; background: #eef2ef; border-bottom: 1.5px solid #064e3b; padding: 5px 6px; font-size: 10.5px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.4px; }
  table.grid td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  table.kv td.l { color: #4b5563; width: 34%; background: #f9fafb; }
  table.kv td.v { font-weight: 600; }
  table.kv td { border: 1px solid #e5e7eb; }
  .totals { margin-left: auto; width: 62%; border: 1px solid #d1d5db; border-radius: 3px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid #eef0f2; }
  .totals .row:last-child { border-bottom: none; }
  .totals .row.strong { background: #eef2ef; font-weight: 700; color: #064e3b; font-size: 12.5px; }
  .note { margin-top: 10px; font-size: 9.5px; color: #4b5563; border-top: 1px dashed #9ca3af; padding-top: 6px; }
  .sigs { display: flex; gap: 24px; margin-top: 26px; }
  .sig { flex: 1; text-align: center; font-size: 10px; color: #4b5563; }
  .sig .line { border-top: 1px solid #6b7280; height: 36px; margin-bottom: 4px; }
  .footer { margin-top: 14px; padding-top: 6px; border-top: 1px solid #064e3b; text-align: center; font-size: 9.5px; color: #6b7280; }
  .toolbar { position: sticky; top: 0; z-index: 99; display: flex; gap: 8px; justify-content: center; padding: 10px; margin-bottom: 10px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  @media print { .no-print { display: none !important; } }
  ${extra}`
}

export function toolbarHtml(): string {
  return `<div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>`
}

// Antet: logo solda, firma bilgileri yanında
export function letterheadHtml(company: CompanyInfo = readCompany()): string {
  const contact = [company.phone, company.email].filter(Boolean).join("  •  ")
  return `<div class="letterhead">
    <img class="logo" src="${logoUrl()}" alt="" onerror="this.style.display='none'" />
    <div class="co">
      <div class="co-name">${esc(company.name)}</div>
      ${company.address ? `<div class="co-line">${esc(company.address)}</div>` : ""}
      ${contact ? `<div class="co-line">${esc(contact)}</div>` : ""}
      ${company.taxNumber ? `<div class="co-line">Vergi No: ${esc(company.taxNumber)}</div>` : ""}
    </div>
  </div>`
}

export function footerHtml(text: string, company: CompanyInfo = readCompany()): string {
  return `<div class="footer">${esc(company.name)} — ${esc(text)}</div>`
}

// Yazdırma penceresini açıp belgeyi yazar. Masaüstünde otomatik yazdırma başlatır;
// görsellerin (logo) yüklenmesi beklenir.
export function openPrintWindow(html: string, width = 800, height = 900, autoPrintDelay = 300): boolean {
  const win = window.open("", "_blank", `width=${width},height=${height}`)
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return false
  }
  const withAuto = html.replace(
    "</body>",
    `<script>window.addEventListener("load", function () { var m = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); if (!m) { setTimeout(function () { window.print(); }, ${autoPrintDelay}); } });</script></body>`
  )
  win.document.write(withAuto)
  win.document.close()
  return true
}

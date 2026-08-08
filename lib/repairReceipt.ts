// Cihaz teslim alma fişi. Müşteri cihazını bırakırken eline verilecek belge.
// Yazdırma, tarayıcının kendi yazdırma penceresiyle yapılır — böylece Türkçe
// karakterler her zaman doğru çıkar ve ek bir PDF kütüphanesine gerek kalmaz.

interface ReceiptRepair {
  id: string
  customerName: string
  phone1: string
  device: string
  brand: string
  model: string
  issue: string
  imei?: string
  cost: number
  paid: number
  remaining: number
  createdAt: string
  notes?: string
}

interface CompanyInfo {
  name?: string
  address?: string
  phone?: string
  iban?: string
  accountName?: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
}

function readCompany(): CompanyInfo {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function printRepairReceipt(repair: ReceiptRepair) {
  const company = readCompany()
  const shortId = repair.id.slice(0, 8).toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Teslim Fişi - ${shortId}</title>
<style>
  @page { size: A5; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; font-size: 12px; line-height: 1.5; }
  .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
  .company { font-size: 18px; font-weight: bold; color: #059669; }
  .company-sub { font-size: 11px; color: #555; margin-top: 2px; }
  .title { text-align: center; font-size: 14px; font-weight: bold; margin: 12px 0 8px; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  td.label { color: #555; width: 38%; }
  td.value { font-weight: 600; }
  .money { margin-top: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
  .money-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .money-row.total { border-top: 1px solid #ddd; margin-top: 4px; padding-top: 6px; font-weight: bold; }
  .remaining { color: #d97706; font-weight: bold; }
  .terms { margin-top: 12px; font-size: 9.5px; color: #555; border-top: 1px dashed #bbb; padding-top: 8px; }
  .terms li { margin-bottom: 3px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 24px; gap: 20px; }
  .sig { flex: 1; text-align: center; font-size: 10px; color: #555; }
  .sig-line { border-top: 1px solid #999; margin-bottom: 4px; height: 34px; }
  .footer { text-align: center; margin-top: 14px; font-size: 10px; color: #777; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div class="company">${company.name || "Yeşiltaş Teknoloji"}</div>
    <div class="company-sub">
      ${company.address || ""}${company.address && company.phone ? " · " : ""}${company.phone || ""}
    </div>
  </div>

  <div class="title">CİHAZ TESLİM ALMA FİŞİ</div>

  <div class="meta">
    <span>Fiş No: <strong>${shortId}</strong></span>
    <span>Tarih: <strong>${repair.createdAt || new Date().toLocaleDateString("tr-TR")}</strong></span>
  </div>

  <table>
    <tr><td class="label">Müşteri</td><td class="value">${repair.customerName || "-"}</td></tr>
    <tr><td class="label">Telefon</td><td class="value">${repair.phone1 || "-"}</td></tr>
    <tr><td class="label">Cihaz</td><td class="value">${[repair.brand, repair.model].filter(Boolean).join(" ") || repair.device || "-"}</td></tr>
    <tr><td class="label">Cihaz Türü</td><td class="value">${repair.device || "-"}</td></tr>
    ${repair.imei ? `<tr><td class="label">IMEI / Seri No</td><td class="value">${repair.imei}</td></tr>` : ""}
    <tr><td class="label">Bildirilen Arıza</td><td class="value">${repair.issue || "-"}</td></tr>
    ${repair.notes ? `<tr><td class="label">Not</td><td class="value">${repair.notes}</td></tr>` : ""}
  </table>

  <div class="money">
    <div class="money-row"><span>Tahmini / Anlaşılan Ücret</span><span>${formatCurrency(repair.cost)}</span></div>
    <div class="money-row"><span>Alınan Ön Ödeme</span><span>${formatCurrency(repair.paid)}</span></div>
    <div class="money-row total"><span>Kalan Tutar</span><span class="remaining">${formatCurrency(repair.remaining)}</span></div>
  </div>

  ${company.iban ? `<div style="margin-top:8px;font-size:10px;color:#555;">
    Havale/EFT: <strong>${company.iban}</strong>${company.accountName ? ` (${company.accountName})` : ""}
  </div>` : ""}

  <div class="terms">
    <strong>Teslim Koşulları</strong>
    <ul style="margin:4px 0 0 14px;padding:0;">
      <li>Cihazınız yukarıda belirtilen arıza için teslim alınmıştır. Tespit sonrası ücret değişebilir, değişiklik öncesinde tarafınıza bildirilir.</li>
      <li>Cihaz içindeki verilerin yedeği müşteriye aittir; işlem sırasında oluşabilecek veri kaybından firmamız sorumlu tutulamaz.</li>
      <li>Teslim tarihinden itibaren 30 gün içinde alınmayan cihazlardan firmamız sorumlu değildir.</li>
      <li>Cihazın teslim alınabilmesi için bu fişin ibrazı gerekmektedir.</li>
      <li>Yapılan işleme, kullanılan parça bazında garanti verilir; kullanıcı kaynaklı hasarlar garanti kapsamı dışındadır.</li>
    </ul>
  </div>

  <div class="signatures">
    <div class="sig"><div class="sig-line"></div>Teslim Eden (Müşteri)</div>
    <div class="sig"><div class="sig-line"></div>Teslim Alan (Yetkili)</div>
  </div>

  <div class="footer">${company.name || "Yeşiltaş Teknoloji"} · Bu fiş 2 nüsha düzenlenir.</div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`

  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

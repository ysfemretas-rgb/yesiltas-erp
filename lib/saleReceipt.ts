// Satış fişi. Tamir fişiyle aynı yöntemle (tarayıcı yazdırma penceresi) basılır,
// böylece Türkçe karakterler her zaman doğru çıkar.

interface ReceiptSale {
  id: string
  saleCode?: string
  customerName: string
  customerPhone?: string
  items: { name: string; price: number; quantity: number }[]
  totalAmount: number
  discount: number
  paid: number
  remaining: number
  paymentMethod: string
  date: string
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kredi Kartı",
  transfer: "Havale/EFT",
  partial: "Kısmi Ödeme",
  unpaid: "Ödenmedi",
  gift: "Eşantiyon (Bedelsiz)",
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function money(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
}

function readCompany(): { name?: string; address?: string; phone?: string; iban?: string; accountName?: string } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function printSaleReceipt(sale: ReceiptSale) {
  const company = readCompany()
  const no = sale.saleCode || sale.id.slice(0, 8).toUpperCase()
  const isGift = sale.paymentMethod === "gift"
  const subtotal = sale.items.reduce((s, i) => s + i.price * i.quantity, 0)

  const rows = sale.items.map(i => `<tr>
      <td>${esc(i.name)}</td><td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${money(i.price)}</td><td style="text-align:right">${money(i.price * i.quantity)}</td></tr>`).join("")

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Satış Fişi - ${esc(no)}</title>
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
  th { text-align: left; border-bottom: 2px solid #ddd; padding: 4px; font-size: 11px; color: #555; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  .money { margin-top: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; }
  .row.total { border-top: 1px solid #ddd; margin-top: 4px; padding-top: 6px; font-weight: bold; }
  .footer { text-align: center; margin-top: 14px; font-size: 10px; color: #777; }
  .toolbar { position: sticky; top: 0; display: flex; gap: 8px; justify-content: center; padding: 10px; margin: -12mm -12mm 10px -12mm; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
  <div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>
  <div class="header">
    <div class="company">${esc(company.name || "Yeşiltaş Teknoloji")}</div>
    <div class="company-sub">${esc(company.address || "")}${company.address && company.phone ? " · " : ""}${esc(company.phone || "")}</div>
  </div>
  <div class="title">SATIŞ FİŞİ</div>
  <div class="meta"><span>Fiş No: <strong>${esc(no)}</strong></span><span>Tarih: <strong>${esc(sale.date)}</strong></span></div>
  <div style="margin-bottom:8px">Müşteri: <strong>${esc(sale.customerName || "-")}</strong>${sale.customerPhone ? " · " + esc(sale.customerPhone) : ""}</div>
  <table>
    <tr><th>Ürün</th><th style="text-align:center">Adet</th><th style="text-align:right">Fiyat</th><th style="text-align:right">Tutar</th></tr>
    ${rows}
  </table>
  <div class="money">
    <div class="row"><span>Ara Toplam</span><span>${money(subtotal)}</span></div>
    ${sale.discount > 0 ? `<div class="row"><span>İskonto</span><span>-${money(sale.discount)}</span></div>` : ""}
    <div class="row total"><span>Toplam</span><span>${money(sale.totalAmount)}</span></div>
    <div class="row"><span>Ödeme Şekli</span><span>${esc(METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod)}</span></div>
    ${isGift ? "" : `<div class="row"><span>Alınan</span><span>${money(sale.paid)}</span></div>`}
    ${!isGift && sale.remaining > 0 ? `<div class="row total"><span>Kalan Borç</span><span>${money(sale.remaining)}</span></div>` : ""}
    ${!isGift && sale.remaining < 0 ? `<div class="row total"><span>Fazla Ödeme (Alacağınız)</span><span>${money(-sale.remaining)}</span></div>` : ""}
  </div>
  ${company.iban && !isGift && sale.remaining > 0 ? `<div style="margin-top:8px;font-size:10px;color:#555;">Havale/EFT: <strong>${esc(company.iban)}</strong>${company.accountName ? ` (${esc(company.accountName)})` : ""}</div>` : ""}
  <div class="footer">${esc(company.name || "Yeşiltaş Teknoloji")} · Bizi tercih ettiğiniz için teşekkür ederiz.</div>
  <script>window.onload = function() { var m = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); if (!m) { window.print(); } }</script>
</body></html>`

  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

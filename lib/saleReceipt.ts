// Satış belgesi (resmi antetli). Tarayıcının yazdırma penceresiyle basılır; Türkçe karakterler doğru çıkar.
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

interface ReceiptSale {
  id: string
  saleCode?: string
  customerName: string
  customerCode?: string
  customerPhone?: string
  items: { name: string; price: number; quantity: number; imei?: string }[]
  totalAmount: number
  discount: number
  paid: number
  remaining: number
  paymentMethod: string
  date: string
  payments?: { method: string; amount: number }[]
  installments?: { no: number; dueDate: string; amount: number; paidAmount: number }[]
  tradeIn?: { name: string; imei?: string; value: number } | null
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kredi Kartı",
  transfer: "Havale/EFT",
  partial: "Kısmi Ödeme",
  split: "Çoklu Ödeme",
  installment: "Taksitli",
  unpaid: "Ödenmedi",
  gift: "Eşantiyon (Bedelsiz)",
}

export function printSaleReceipt(sale: ReceiptSale) {
  const company = readCompany()
  const no = sale.saleCode || sale.id.slice(0, 8).toUpperCase()
  const isGift = sale.paymentMethod === "gift"
  const subtotal = sale.items.reduce((s, i) => s + i.price * i.quantity, 0)

  const rows = sale.items.map((i, idx) => `<tr>
      <td style="width:6%">${idx + 1}</td>
      <td>${esc(i.name)}${i.imei ? `<div style="font-size:9.5px;color:#6b7280">IMEI / Seri No: ${esc(i.imei)}</div>` : ""}</td>
      <td style="text-align:center;width:10%">${i.quantity}</td>
      <td style="text-align:right;width:18%">${money(i.price)}</td>
      <td style="text-align:right;width:18%">${money(i.price * i.quantity)}</td></tr>`).join("")

  const paymentBreakdown = (sale.payments || []).length > 0
    ? `<div class="row"><span>Ödeme Dağılımı</span><span>${(sale.payments || []).map(p => `${p.method === "cash" ? "Nakit" : p.method === "card" ? "Kart" : "Havale"} ${money(p.amount)}`).join(" • ")}</span></div>`
    : ""

  const installments = (sale.installments || []).length > 0
    ? `<div style="margin-top:10px"><div style="font-weight:700;color:#064e3b;margin-bottom:3px">TAKSİT PLANI</div>
        <table class="grid"><tr><th>Taksit</th><th>Vade Tarihi</th><th style="text-align:right">Tutar</th></tr>
        ${(sale.installments || []).map(i => `<tr><td>${i.no}. taksit</td><td>${esc(i.dueDate)}</td><td style="text-align:right">${money(i.amount)}</td></tr>`).join("")}</table></div>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Satış Belgesi - ${esc(no)}</title>
<style>
  @page { size: A5; margin: 12mm; }
  ${docStyles()}
</style></head><body>
  ${toolbarHtml()}
  ${letterheadHtml(company)}
  <div class="doc-title">Satış Belgesi</div>
  <div class="meta"><span>Belge No: <strong>${esc(no)}</strong></span><span>Tarih: <strong>${esc(sale.date)}</strong></span></div>
  <table class="grid kv" style="margin-bottom:8px">
    <tr><td class="l">Müşteri</td><td class="v">${esc(sale.customerName || "-")}${sale.customerCode ? ` <span style="font-weight:400;color:#6b7280">(${esc(sale.customerCode)})</span>` : ""}</td></tr>
    ${sale.customerPhone ? `<tr><td class="l">Telefon</td><td class="v">${esc(sale.customerPhone)}</td></tr>` : ""}
  </table>
  <table class="grid">
    <tr><th>#</th><th>Ürün / Hizmet</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Fiyat</th><th style="text-align:right">Tutar</th></tr>
    ${rows}
  </table>
  <div class="totals">
    <div class="row"><span>Ara Toplam</span><span>${money(subtotal)}</span></div>
    ${sale.discount > 0 ? `<div class="row"><span>İskonto</span><span>-${money(sale.discount)}</span></div>` : ""}
    <div class="row strong"><span>Genel Toplam</span><span>${money(sale.totalAmount)}</span></div>
    <div class="row"><span>Ödeme Şekli</span><span>${esc(METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod)}</span></div>
    ${paymentBreakdown}
    ${sale.tradeIn ? `<div class="row"><span>Takas: ${esc(sale.tradeIn.name)}${sale.tradeIn.imei ? ` (IMEI ${esc(sale.tradeIn.imei)})` : ""}</span><span>-${money(sale.tradeIn.value)}</span></div>` : ""}
    ${isGift ? "" : `<div class="row"><span>Ödenen</span><span>${money(sale.paid)}</span></div>`}
    ${!isGift && sale.remaining > 0 ? `<div class="row strong"><span>Kalan Borç</span><span>${money(sale.remaining)}</span></div>` : ""}
    ${!isGift && sale.remaining < 0 ? `<div class="row strong"><span>Fazla Ödeme (Alacak)</span><span>${money(-sale.remaining)}</span></div>` : ""}
  </div>
  ${isGift ? `<div class="note">Bu satış bedelsiz (eşantiyon) olarak düzenlenmiştir.</div>` : ""}
  ${installments}
  ${company.iban && !isGift && sale.remaining > 0 ? `<div class="note">Havale/EFT ile ödeme: <strong>${esc(company.iban)}</strong>${company.accountName ? ` — ${esc(company.accountName)}` : ""}</div>` : ""}
  <div class="sigs"><div class="sig"><div class="line"></div>Teslim Alan (Müşteri)</div><div class="sig"><div class="line"></div>Teslim Eden (Yetkili)</div></div>
  ${footerHtml("Bu belge bilgilendirme amaçlıdır; fatura veya yazar kasa fişi yerine geçmez.", company)}
</body></html>`
  openPrintWindow(html)
}

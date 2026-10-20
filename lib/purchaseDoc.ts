// Tedarikçi alış fişi (resmi antetli). Müşteriden ikinci el cihaz alımında ayrıca
// lib/devicePurchases.ts içindeki "İkinci El Cihaz Alım Belgesi" kullanılır.
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"
import type { Purchase } from "@/lib/purchases"

export function printPurchaseSlip(p: Purchase) {
  const company = readCompany()
  const remaining = Math.round((p.total - p.paid) * 100) / 100
  const rows = p.items
    .map(
      (i, idx) => `<tr><td style="width:6%">${idx + 1}</td><td>${esc(i.name)}${i.productCode ? `<div style="font-size:9.5px;color:#6b7280">${esc(i.productCode)}${i.imei ? ` • IMEI ${esc(i.imei)}` : ""}</div>` : ""}</td><td style="text-align:center;width:10%">${i.quantity}</td><td style="text-align:right;width:20%">${i.unitPrice.toLocaleString("tr-TR")} ${i.currency}</td><td style="text-align:right;width:20%">${money(i.quantity * i.unitCostTRY)}</td></tr>`
    )
    .join("")
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Alış Fişi - ${esc(p.code)}</title>
<style>@page { size: A5; margin: 12mm; } ${docStyles()}</style></head><body>
${toolbarHtml()}${letterheadHtml(company)}
<div class="doc-title">${p.kind === "supplier" ? "Alış Fişi (Tedarikçi)" : "Alış Fişi (Müşteriden)"}</div>
<div class="meta"><span>Alış No: <strong>${esc(p.code)}</strong></span><span>Tarih: <strong>${esc(p.date)}</strong></span></div>
<table class="grid kv" style="margin-bottom:8px">
  <tr><td class="l">${p.kind === "supplier" ? "Tedarikçi" : "Satıcı"}</td><td class="v">${esc(p.partyName)}${p.partyPhone ? ` • ${esc(p.partyPhone)}` : ""}</td></tr>
  ${p.invoiceNo ? `<tr><td class="l">Fatura / İrsaliye No</td><td class="v">${esc(p.invoiceNo)}</td></tr>` : ""}
</table>
<table class="grid"><tr><th>#</th><th>Ürün</th><th style="text-align:center">Adet</th><th style="text-align:right">Birim Alış</th><th style="text-align:right">Tutar (TL)</th></tr>${rows}</table>
<div class="totals">
  <div class="row strong"><span>Toplam</span><span>${money(p.total)}</span></div>
  <div class="row"><span>Ödenen</span><span>${money(p.paid)}</span></div>
  ${remaining > 0 ? `<div class="row strong"><span>Kalan Borç</span><span>${money(remaining)}</span></div>` : ""}
</div>
${p.note ? `<div class="note">Not: ${esc(p.note)}</div>` : ""}
<div class="sigs"><div class="sig"><div class="line"></div>Teslim Eden</div><div class="sig"><div class="line"></div>Teslim Alan (Yetkili)</div></div>
${footerHtml("Dahili alış fişi.", company)}
</body></html>`
  openPrintWindow(html)
}

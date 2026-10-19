// Tamir teklif formu (resmi antetli): müşteriye sunulur; onay/ret ve imza alanları vardır.
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

interface QuoteRepair {
  id: string
  repairCode?: string
  customerName: string
  phone1: string
  brand: string
  model: string
  imei?: string
  issue: string
  estimatedDelivery?: string
  createdAt: string
}

export function printRepairQuote(repair: QuoteRepair, quote: { amount: number; note: string; createdAt: string }) {
  const company = readCompany()
  const no = repair.repairCode || repair.id.slice(0, 8).toUpperCase()
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Tamir Teklifi - ${esc(no)}</title>
<style>@page { size: A5; margin: 12mm; } ${docStyles(`.box { display:inline-block; width:12px; height:12px; border:1.5px solid #111; vertical-align:middle; margin-right:6px; }`)}</style></head><body>
${toolbarHtml()}${letterheadHtml(company)}
<div class="doc-title">Tamir Teklif Formu</div>
<div class="meta"><span>Kayıt No: <strong>${esc(no)}</strong></span><span>Teklif Tarihi: <strong>${esc(quote.createdAt)}</strong></span></div>
<table class="grid kv">
  <tr><td class="l">Müşteri</td><td class="v">${esc(repair.customerName)}</td></tr>
  <tr><td class="l">Telefon</td><td class="v">${esc(repair.phone1 || "-")}</td></tr>
  <tr><td class="l">Cihaz</td><td class="v">${esc([repair.brand, repair.model].filter(Boolean).join(" ") || "-")}</td></tr>
  ${repair.imei ? `<tr><td class="l">IMEI / Seri No</td><td class="v">${esc(repair.imei)}</td></tr>` : ""}
  <tr><td class="l">Bildirilen Arıza</td><td class="v">${esc(repair.issue || "-")}</td></tr>
  <tr><td class="l">Teşhis / Yapılacak İşlem</td><td class="v">${esc(quote.note || "-")}</td></tr>
  ${repair.estimatedDelivery ? `<tr><td class="l">Tahmini Teslim</td><td class="v">${esc(repair.estimatedDelivery)}</td></tr>` : ""}
</table>
<div class="totals"><div class="row strong"><span>Tamir Ücreti (Teklif)</span><span>${money(quote.amount)}</span></div></div>
<div class="note">Bu teklif, cihaz teşhisi sonrası verilmiştir. Onay verilmesi halinde işleme başlanır. Beklenmeyen ek arıza çıkarsa ücret değişikliği öncesinde müşteriye bilgi verilir.</div>
<div style="margin-top:14px;font-size:12px"><span class="box"></span>Teklifi KABUL EDİYORUM &nbsp;&nbsp;&nbsp;&nbsp; <span class="box"></span>Teklifi REDDEDİYORUM</div>
<div class="sigs"><div class="sig"><div class="line"></div>Müşteri (Ad Soyad / İmza / Tarih)</div><div class="sig"><div class="line"></div>Yetkili</div></div>
${footerHtml("Tamir teklif formu — iki nüsha düzenlenir.", company)}
</body></html>`
  openPrintWindow(html)
}

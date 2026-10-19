// Cihaz teslim alma belgesi (resmi antetli). Müşteri cihazını bırakırken eline verilir.
// Yazdırma, tarayıcının kendi yazdırma penceresiyle yapılır — böylece Türkçe karakterler
// her zaman doğru çıkar ve ek bir PDF kütüphanesine gerek kalmaz.
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

interface ReceiptRepair {
  id: string
  repairCode?: string
  customerCode?: string
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
  signature?: string
  technician?: string
}

export function printRepairReceipt(repair: ReceiptRepair) {
  const company = readCompany()
  const no = repair.repairCode || repair.id.slice(0, 8).toUpperCase()
  const deviceName = [repair.brand, repair.model].filter(Boolean).join(" ") || repair.device || "-"

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Teslim Belgesi - ${esc(no)}</title>
<style>
  @page { size: A5; margin: 12mm; }
  ${docStyles()}
</style></head><body>
  ${toolbarHtml()}
  ${letterheadHtml(company)}
  <div class="doc-title">Cihaz Teslim Alma Belgesi</div>
  <div class="meta"><span>Kayıt No: <strong>${esc(no)}</strong></span><span>Tarih: <strong>${esc(repair.createdAt || new Date().toLocaleDateString("tr-TR"))}</strong></span></div>

  <table class="grid kv">
    <tr><td class="l">Müşteri</td><td class="v">${esc(repair.customerName || "-")}${repair.customerCode ? ` <span style="font-weight:400;color:#6b7280">(${esc(repair.customerCode)})</span>` : ""}</td></tr>
    <tr><td class="l">Telefon</td><td class="v">${esc(repair.phone1 || "-")}</td></tr>
    <tr><td class="l">Cihaz</td><td class="v">${esc(deviceName)}</td></tr>
    <tr><td class="l">Cihaz Türü</td><td class="v">${esc(repair.device || "-")}</td></tr>
    ${repair.imei ? `<tr><td class="l">IMEI / Seri No</td><td class="v">${esc(repair.imei)}</td></tr>` : ""}
    <tr><td class="l">Bildirilen Arıza</td><td class="v">${esc(repair.issue || "-")}</td></tr>
    ${repair.notes ? `<tr><td class="l">Not</td><td class="v">${esc(repair.notes)}</td></tr>` : ""}
    ${repair.technician ? `<tr><td class="l">Teknisyen</td><td class="v">${esc(repair.technician)}</td></tr>` : ""}
  </table>

  <div class="totals">
    <div class="row"><span>Tahmini / Anlaşılan Ücret</span><span>${money(repair.cost)}</span></div>
    <div class="row"><span>Alınan Ön Ödeme</span><span>${money(repair.paid)}</span></div>
    ${repair.remaining < 0
      ? `<div class="row strong"><span>Fazla Ödeme (Alacak)</span><span>${money(-repair.remaining)}</span></div>`
      : `<div class="row strong"><span>Kalan Tutar</span><span>${money(repair.remaining)}</span></div>`}
  </div>

  ${company.iban ? `<div class="note" style="border-top:none;margin-top:6px">Havale/EFT: <strong>${esc(company.iban)}</strong>${company.accountName ? ` — ${esc(company.accountName)}` : ""}</div>` : ""}

  <div class="note">
    <strong>Teslim Koşulları</strong>
    <ol style="margin:4px 0 0 16px;padding:0;">
      <li>Cihazınız yukarıda belirtilen arıza için teslim alınmıştır. Tespit sonrası ücret değişebilir, değişiklik öncesinde tarafınıza bildirilir.</li>
      <li>Cihaz içindeki verilerin yedeği müşteriye aittir; işlem sırasında oluşabilecek veri kaybından firmamız sorumlu tutulamaz.</li>
      <li>Teslim tarihinden itibaren 30 gün içinde alınmayan cihazlardan firmamız sorumlu değildir.</li>
      <li>Cihazın teslim alınabilmesi için bu belgenin ibrazı gerekmektedir.</li>
      <li>Yapılan işleme, kullanılan parça bazında garanti verilir; kullanıcı kaynaklı hasarlar garanti kapsamı dışındadır.</li>
    </ol>
  </div>

  <div class="sigs">
    <div class="sig">${repair.signature
      ? `<img src="${esc(repair.signature)}" alt="İmza" style="height:36px;max-width:100%;object-fit:contain;display:block;margin:0 auto" /><div style="border-top:1px solid #6b7280;margin-bottom:4px"></div>`
      : `<div class="line"></div>`}Teslim Eden (Müşteri)</div>
    <div class="sig"><div class="line"></div>Teslim Alan (Yetkili)</div>
  </div>
  ${footerHtml("Bu belge iki nüsha düzenlenir.", company)}
</body></html>`
  openPrintWindow(html)
}

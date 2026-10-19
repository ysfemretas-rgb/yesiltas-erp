// Ürün raf/etiket barkodu. Etikette logo, ürün adı, taranabilir barkod (Code128 — YTE-0001 gibi
// harf+rakam içeren kodları destekler), ürün kodu ve fiyat bulunur. Barkod JsBarcode ile
// tarayıcıda çizilir; A4 sayfaya dizilir, kesilerek kullanılır.
import { esc, logoUrl, readCompany, toolbarHtml, openPrintWindow } from "@/lib/printTheme"

interface LabelProduct {
  name: string
  productCode: string
  salePrice?: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
}

export function printBarcodeLabels(products: LabelProduct[], copiesPerProduct = 1) {
  const valid = products.filter(p => p.productCode)
  if (valid.length === 0) {
    alert("Yazdırılacak ürün kodu bulunamadı. Ürünlerin kodu oluşmuş olmalı.")
    return
  }

  const company = readCompany()
  const labels: LabelProduct[] = []
  valid.forEach(p => {
    for (let i = 0; i < copiesPerProduct; i++) labels.push(p)
  })

  const labelHtml = labels.map((p, i) => `
    <div class="label">
      <div class="head"><img src="${logoUrl()}" alt="" onerror="this.style.display='none'" /><span>${esc(company.name)}</span></div>
      <div class="pname">${esc(p.name)}</div>
      <svg class="bc" id="bc-${i}"></svg>
      <div class="foot"><span class="pcode">${esc(p.productCode)}</span>${p.salePrice ? `<span class="price">${formatCurrency(p.salePrice)}</span>` : ""}</div>
    </div>
  `).join("")

  const drawScript = labels.map((p, i) =>
    `try { JsBarcode("#bc-${i}", ${JSON.stringify(p.productCode)}, { format: "CODE128", width: 1.6, height: 38, displayValue: false, margin: 0 }); } catch (e) {}`
  ).join("\n")

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Barkod Etiketleri</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif; margin: 0; color: #111827; }
  .sheet { display: flex; flex-wrap: wrap; gap: 3mm; }
  .label { width: 50mm; height: 31mm; border: 0.3mm solid #064e3b; border-radius: 1.2mm; overflow: hidden; display: flex; flex-direction: column; page-break-inside: avoid; }
  .head { display: flex; align-items: center; gap: 1mm; padding: 0.6mm 1.5mm; background: #064e3b; color: #fff; font-size: 6pt; font-weight: 700; letter-spacing: 0.3px; }
  .head img { width: 4mm; height: 4mm; object-fit: contain; background: #fff; border-radius: 0.7mm; }
  .pname { font-size: 7.5pt; font-weight: 600; line-height: 1.1; max-height: 2.3em; overflow: hidden; padding: 0.8mm 1.5mm 0; text-align: center; }
  .bc { display: block; width: calc(100% - 3mm); height: 10mm; margin: 0.6mm auto 0; }
  .foot { display: flex; justify-content: space-between; align-items: center; padding: 0 1.5mm 0.8mm; margin-top: auto; }
  .pcode { font-family: "Consolas", "Courier New", monospace; font-size: 7.5pt; letter-spacing: 0.4px; }
  .price { font-size: 9pt; font-weight: 700; }
  .toolbar { position: sticky; top: 0; z-index: 99; display: flex; gap: 8px; justify-content: center; padding: 10px; margin: -8mm -8mm 10px -8mm; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  @media print { .label { border-color: #064e3b; } .no-print { display: none !important; } }
</style></head><body>
  ${toolbarHtml()}
  <div class="sheet">${labelHtml}</div>
  <script>
    window.addEventListener("load", function () { ${drawScript} });
  </script>
</body></html>`

  openPrintWindow(html, 900, 700, 450)
}

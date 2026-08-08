// Ürün barkod etiketi yazdırma. Etikette ürün adı, ürün kodu ve taranabilir
// barkod bulunur. Barkod, JsBarcode ile tarayıcıda çizilir (CODE128 formatı —
// harf+rakam içeren YTE-0001 gibi kodları destekler).

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

  const labels: LabelProduct[] = []
  valid.forEach(p => {
    for (let i = 0; i < copiesPerProduct; i++) labels.push(p)
  })

  const labelHtml = labels.map((p, i) => `
    <div class="label">
      <div class="pname">${p.name}</div>
      <svg class="bc" id="bc-${i}"></svg>
      <div class="pcode">${p.productCode}</div>
      ${p.salePrice ? `<div class="price">${formatCurrency(p.salePrice)}</div>` : ""}
    </div>
  `).join("")

  const drawScript = labels.map((p, i) =>
    `try { JsBarcode("#bc-${i}", ${JSON.stringify(p.productCode)}, { format: "CODE128", width: 1.6, height: 38, displayValue: false, margin: 0 }); } catch(e) { console.error(e); }`
  ).join("\n")

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Barkod Etiketleri</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; }
  .sheet { display: flex; flex-wrap: wrap; gap: 4mm; }
  .label {
    width: 48mm; height: 28mm; border: 1px dashed #ccc; border-radius: 2px;
    padding: 2mm; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    page-break-inside: avoid;
  }
  .pname { font-size: 8pt; font-weight: 600; line-height: 1.1; max-height: 2.4em; overflow: hidden; margin-bottom: 1mm; }
  .bc { max-width: 100%; height: 10mm; }
  .pcode { font-size: 8pt; font-family: monospace; letter-spacing: 0.5px; margin-top: 0.5mm; }
  .price { font-size: 8pt; font-weight: bold; margin-top: 0.5mm; }
  .toolbar {
    position: sticky; top: 0; z-index: 99;
    display: flex; gap: 8px; justify-content: center;
    padding: 10px; margin: -8mm -8mm 10px -8mm;
    background: #f1f5f9; border-bottom: 1px solid #cbd5e1;
  }
  .toolbar button {
    font-family: inherit; font-size: 14px; font-weight: 600;
    padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer;
  }
  .btn-print { background: #059669; color: #fff; }
  .btn-close { background: #e2e8f0; color: #334155; }
  @media print { .label { border-color: transparent; } .no-print { display: none !important; } }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>
  <div class="sheet">${labelHtml}</div>
  <script>
    window.onload = function() {
      ${drawScript}
      var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) { setTimeout(function() { window.print(); }, 350); }
    };
  </script>
</body>
</html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

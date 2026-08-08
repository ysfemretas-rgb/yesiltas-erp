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
  @media print { .label { border-color: transparent; } }
</style>
</head>
<body>
  <div class="sheet">${labelHtml}</div>
  <script>
    window.onload = function() {
      ${drawScript}
      setTimeout(function() { window.print(); }, 350);
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

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
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; } .btn-share { background: #2563eb; color: #fff; }
  @media print { .label { border-color: #064e3b; } .no-print { display: none !important; } }
</style></head><body>
  ${toolbarHtml('<button id="btnShare" class="btn-share" style="display:none" onclick="shareLabels()">📤 Paylaş / Yazdır</button>', false)}
  <div id="iosHint" class="no-print" style="display:none; margin: 0 0 10px; padding: 8px 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; font-size: 12px; color: #78350f;">
    iPhone'da "Yazdır" düğmesi çalışmayabilir. <b>📤 Paylaş / Yazdır</b>'a basın, açılan menüden <b>Yazdır</b>'ı seçin (A4 sayfaya etiketler dizili hazırlanır; bir etiket yazıcı uygulamanız varsa görseli ona da gönderebilirsiniz).
  </div>
  <div class="sheet">${labelHtml}</div>
  <script>
    window.addEventListener("load", function () { ${drawScript} });
    ${shareScript(labels, company.name || "")}
  </script>
</body></html>`

  openPrintWindow(html, 900, 700, 450)
}

// iPhone ana ekran uygulamasında window.print() çalışmaz. Bu betik etiketleri canvas ile A4 görsel(ler)e çizer
// (barkod JsBarcode ile gerçekten taranabilir şekilde, 300 dpi) ve iPhone paylaşım menüsüne (Yazdır, Dosyalara Kaydet,
// etiket yazıcı uygulamaları) gönderir. Etiket ölçüsü ve dizilimi sayfadaki yazdırma düzeniyle aynıdır (50x31 mm, 3 sütun).
function shareScript(labels: LabelProduct[], companyName: string): string {
  const data = JSON.stringify(labels.map(l => ({ name: l.name, code: l.productCode, price: l.salePrice ? formatCurrency(l.salePrice) : "" })))
  return `
    var LABELS = ${data.replace(/</g, "\\u003c")};
    var COMPANY = ${JSON.stringify(companyName).replace(/</g, "\\u003c")};
    (function () {
      var ua = navigator.userAgent || "";
      var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
      if (isIOS) { document.getElementById("btnShare").style.display = ""; document.getElementById("iosHint").style.display = ""; }
    })();
    function mmPx(mm) { return Math.round(mm * 300 / 25.4); }
    function ptPx(pt) { return Math.round(pt * 300 / 72); }
    function wrapLines(ctx, text, maxW, maxLines) {
      var words = String(text).split(/\\s+/), lines = [], cur = "";
      for (var i = 0; i < words.length; i++) {
        var t = cur ? cur + " " + words[i] : words[i];
        if (!cur || ctx.measureText(t).width <= maxW) { cur = t; } else { lines.push(cur); cur = words[i]; }
      }
      if (cur) lines.push(cur);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        var last = lines[maxLines - 1];
        while (last.length > 1 && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
        lines[maxLines - 1] = last + "…";
      }
      return lines;
    }
    function roundRectPath(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
    function drawLabel(ctx, x, y, L) {
      var w = mmPx(50), h = mmPx(31), pad = mmPx(1.5), headH = mmPx(5);
      ctx.save();
      roundRectPath(ctx, x, y, w, h, mmPx(1.2)); ctx.clip();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#064e3b"; ctx.fillRect(x, y, w, headH);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold " + ptPx(6) + "px Arial, Helvetica, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillText(COMPANY, x + pad, y + headH / 2);
      ctx.fillStyle = "#111827"; ctx.textAlign = "center"; ctx.font = "bold " + ptPx(7.5) + "px Arial, Helvetica, sans-serif"; ctx.textBaseline = "alphabetic";
      var lines = wrapLines(ctx, L.name, w - 2 * pad, 2), lh = Math.round(ptPx(7.5) * 1.12), ty = y + headH + mmPx(0.8) + ptPx(7.5) * 0.85;
      for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], x + w / 2, ty + i * lh);
      var bc = document.createElement("canvas");
      try { JsBarcode(bc, L.code, { format: "CODE128", width: 4, height: 120, displayValue: false, margin: 0 }); } catch (e) { bc = null; }
      var bTop = y + headH + mmPx(8.4), bH = mmPx(10), maxW = w - 2 * pad;
      if (bc && bc.width) {
        var bw = bc.width > maxW ? maxW : bc.width;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bc, x + (w - bw) / 2, bTop, bw, bH);
      }
      ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#111827"; ctx.textAlign = "left";
      ctx.font = ptPx(7.5) + "px 'Courier New', Courier, monospace"; ctx.fillText(L.code, x + pad, y + h - mmPx(1.6));
      if (L.price) { ctx.textAlign = "right"; ctx.font = "bold " + ptPx(9) + "px Arial, Helvetica, sans-serif"; ctx.fillText(L.price, x + w - pad, y + h - mmPx(1.4)); }
      ctx.restore();
      ctx.strokeStyle = "#064e3b"; ctx.lineWidth = Math.max(2, mmPx(0.3)); roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, mmPx(1.2)); ctx.stroke();
    }
    function buildPages() {
      var W = mmPx(210), H = mmPx(297), M = mmPx(8), GAP = mmPx(3), LW = mmPx(50), LH = mmPx(31);
      var cols = Math.max(1, Math.floor((W - 2 * M + GAP) / (LW + GAP))), rows = Math.max(1, Math.floor((H - 2 * M + GAP) / (LH + GAP)));
      var per = cols * rows, pages = [];
      for (var start = 0; start < LABELS.length; start += per) {
        var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
        for (var k = 0; k < per && start + k < LABELS.length; k++) {
          drawLabel(ctx, M + (k % cols) * (LW + GAP), M + Math.floor(k / cols) * (LH + GAP), LABELS[start + k]);
        }
        pages.push(cv);
      }
      return pages;
    }
    function toBlob(cv) { return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, "image/png"); }); }
    async function shareLabels() {
      try {
        var cvs = buildPages(), blobs = [];
        for (var i = 0; i < cvs.length; i++) blobs.push(await toBlob(cvs[i]));
        var files = blobs.map(function (b, i) { return new File([b], "etiket-" + (i + 1) + ".png", { type: "image/png" }); });
        if (navigator.canShare && navigator.canShare({ files: files })) {
          await navigator.share({ files: files, title: "Barkod etiketleri" });
        } else {
          window.location.href = URL.createObjectURL(blobs[0]);
          alert("Görsele uzun basıp Paylaş > Yazdır'ı seçebilirsiniz.");
        }
      } catch (e) {
        if (e && e.name === "AbortError") return;
        alert("Paylaşım açılamadı: " + (e && e.message ? e.message : e));
      }
    }
  `
}

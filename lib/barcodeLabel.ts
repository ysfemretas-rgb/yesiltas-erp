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
  <div id="iosHint" class="no-print" style="display:none; margin: 0 0 8px; padding: 8px 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; font-size: 12px; color: #78350f;">
    iPhone'da "Yazdır" düğmesi çalışmayabilir. Aşağıdan <b>etiket ölçüsünü</b> (rulonuzdaki etiketin gerçek ölçüsü) ve düzeni seçip <b>📤 Paylaş / Yazdır</b>'a basın, menüden <b>Yazdır</b>'ı seçin. Rulo/etiket yazıcıda "Tek etiket", normal yazıcıda "A4 sayfaya dizili" seçin.
  </div>
  <div id="lblOpts" class="no-print" style="display:none; margin: 0 0 10px; gap: 10px; flex-wrap: wrap; font-size: 13px;">
    <label>Etiket ölçüsü: <select id="lblSize" onchange="saveLblOpts()" style="padding:6px; border-radius:6px; border:1px solid #cbd5e1;"></select></label>
    <label>Düzen: <select id="lblMode" onchange="saveLblOpts()" style="padding:6px; border-radius:6px; border:1px solid #cbd5e1;"><option value="single">Tek etiket (rulo / etiket yazıcı)</option><option value="a4">A4 sayfaya dizili</option></select></label>
    <label><input type="checkbox" id="lblLogo" onchange="saveLblOpts()" checked /> Logo ve firma adı</label>
    <label>Başlık: <select id="lblHead" onchange="saveLblOpts()" style="padding:6px; border-radius:6px; border:1px solid #cbd5e1;"><option value="plain">Sade (siyah-beyaz / termal yazıcı)</option><option value="dark">Koyu zemin (renkli yazıcı)</option></select></label>
  </div>
  <div class="sheet">${labelHtml}</div>
  <script>
    window.addEventListener("load", function () { ${drawScript} });
    ${shareScript(labels, company.name || "", logoUrl())}
  </script>
</body></html>`

  openPrintWindow(html, 900, 700, 450)
}

// iPhone ana ekran uygulamasında window.print() çalışmaz. Bu betik etiketleri canvas ile görsel(ler)e çizer
// (barkod JsBarcode ile gerçekten taranabilir şekilde, 300 dpi) ve iPhone paylaşım menüsüne (Yazdır, Dosyalara Kaydet,
// etiket yazıcı uygulamaları) gönderir.
//  - "Tek etiket" düzeni (rulo/etiket yazıcılar için): her etiket, SEÇİLEN ETİKET BOYUTUNDA ayrı bir görseldir; yazıcı görseli
//    kağıt genişliğine sığdırdığı için etiket boyutunu rulonun/etiketin gerçek ölçüsüne eşitlemek gerekir.
//  - "A4 sayfaya dizili" düzeni: etiketler A4 sayfaya sığdığı kadar dizilir (normal yazıcı, kesilerek kullanım).
function shareScript(labels: LabelProduct[], companyName: string, logo: string): string {
  const data = JSON.stringify(labels.map(l => ({ name: l.name, code: l.productCode, price: l.salePrice ? formatCurrency(l.salePrice) : "" })))
  return `
    var LABELS = ${data.replace(/</g, "\\u003c")};
    var COMPANY = ${JSON.stringify(companyName).replace(/</g, "\\u003c")};
    var LOGO = ${JSON.stringify(logo).replace(/</g, "\\u003c")};
    var LOGO_IMG = null;
    var SIZES = ["40x30", "50x30", "50x31", "60x40", "70x40", "80x50", "100x50", "100x100", "100x150"];
    (function () {
      var ua = navigator.userAgent || "";
      var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
      var sel = document.getElementById("lblSize"), mode = document.getElementById("lblMode");
      var savedSize = "50x31", savedMode = "single";
      try { savedSize = localStorage.getItem("yt_lbl_size") || savedSize; savedMode = localStorage.getItem("yt_lbl_mode") || savedMode; } catch (e) {}
      if (sel) {
        SIZES.forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v.replace("x", " × ") + " mm"; sel.appendChild(o); });
        var oc = document.createElement("option"); oc.value = "custom"; oc.textContent = "Özel ölçü…"; sel.appendChild(oc);
        if (SIZES.indexOf(savedSize) < 0 && /^[0-9.]+x[0-9.]+$/.test(savedSize)) { var oo = document.createElement("option"); oo.value = savedSize; oo.textContent = savedSize.replace("x", " × ") + " mm"; sel.insertBefore(oo, oc); }
        sel.value = savedSize;
      }
      if (mode) mode.value = savedMode;
      var lg = document.getElementById("lblLogo"), hs = document.getElementById("lblHead");
      try { if (lg) lg.checked = (localStorage.getItem("yt_lbl_logo") || "1") === "1"; if (hs) hs.value = localStorage.getItem("yt_lbl_head") || "plain"; } catch (e) {}
      if (isIOS) { document.getElementById("btnShare").style.display = ""; document.getElementById("iosHint").style.display = ""; document.getElementById("lblOpts").style.display = "flex"; }
    })();
    function saveLblOpts() {
      var sel = document.getElementById("lblSize");
      if (sel.value === "custom") {
        var v = prompt("Etiket ölçüsü (genişlik x yükseklik, mm). Örn: 80x40", "50x31");
        var m = v && String(v).replace(",", ".").replace(/[×* ]/g, "x").match(/^([0-9.]+)x([0-9.]+)$/);
        if (m) {
          var val = parseFloat(m[1]) + "x" + parseFloat(m[2]);
          var o = document.createElement("option"); o.value = val; o.textContent = val.replace("x", " × ") + " mm"; sel.insertBefore(o, sel.querySelector('option[value="custom"]')); sel.value = val;
        } else { sel.value = "50x31"; }
      }
      try {
        localStorage.setItem("yt_lbl_size", sel.value); localStorage.setItem("yt_lbl_mode", document.getElementById("lblMode").value);
        localStorage.setItem("yt_lbl_logo", document.getElementById("lblLogo").checked ? "1" : "0"); localStorage.setItem("yt_lbl_head", document.getElementById("lblHead").value);
      } catch (e) {}
    }
    function labelDims() {
      var m = String((document.getElementById("lblSize") || {}).value || "50x31").split("x");
      var w = parseFloat(m[0]) || 50, h = parseFloat(m[1]) || 31;
      return { w: Math.max(20, Math.min(w, 210)), h: Math.max(15, Math.min(h, 297)) };
    }
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
    // Etiketi verilen ölçüde (mm) çizer. Yazı ve boşluklar etiket boyutuna göre ölçeklenir; barkod kalan alanı doldurur.
    function drawLabel(ctx, x, y, L, wMM, hMM) {
      var s = Math.max(0.6, Math.min(wMM / 50, hMM / 31));
      var showHead = !!(document.getElementById("lblLogo") || { checked: true }).checked, plain = ((document.getElementById("lblHead") || {}).value || "plain") === "plain";
      var w = mmPx(wMM), h = mmPx(hMM), pad = mmPx(1.5 * s), headH = showHead ? mmPx(5.5 * s) : 0, footH = mmPx(6 * s);
      ctx.save();
      roundRectPath(ctx, x, y, w, h, mmPx(1.2 * s)); ctx.clip();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, w, h);
      if (showHead) {
        var lsz = headH - mmPx(1 * s), lx = x + pad, ly = y + (headH - lsz) / 2, textX = x + pad;
        if (plain) {
          ctx.fillStyle = "#000000"; ctx.fillRect(x, y + headH - 2, w, 2);
        } else {
          ctx.fillStyle = "#064e3b"; ctx.fillRect(x, y, w, headH);
        }
        if (LOGO_IMG && LOGO_IMG.width) {
          if (!plain) { ctx.fillStyle = "#ffffff"; roundRectPath(ctx, lx, ly, lsz, lsz, mmPx(0.7 * s)); ctx.fill(); }
          var ratio = Math.min(lsz / LOGO_IMG.width, lsz / LOGO_IMG.height), lw = LOGO_IMG.width * ratio, lh2 = LOGO_IMG.height * ratio;
          ctx.drawImage(LOGO_IMG, lx + (lsz - lw) / 2, ly + (lsz - lh2) / 2, lw, lh2);
          textX = lx + lsz + mmPx(1.2 * s);
        }
        ctx.fillStyle = plain ? "#000000" : "#ffffff"; ctx.font = "bold " + ptPx(6.5 * s) + "px Arial, Helvetica, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
        ctx.fillText(COMPANY, textX, y + headH / 2, x + w - pad - textX);
      }
      var nf = ptPx(7.5 * s), lh = Math.round(nf * 1.12);
      ctx.fillStyle = "#111827"; ctx.textAlign = "center"; ctx.font = "bold " + nf + "px Arial, Helvetica, sans-serif"; ctx.textBaseline = "alphabetic";
      var lines = wrapLines(ctx, L.name, w - 2 * pad, hMM >= 45 ? 3 : 2), ty = y + headH + mmPx(0.8 * s) + nf * 0.85;
      for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], x + w / 2, ty + i * lh);
      var nameBottom = y + headH + mmPx(0.8 * s) + lines.length * lh + mmPx(0.6 * s);
      var areaTop = nameBottom, areaBottom = y + h - footH - mmPx(0.4 * s), avail = Math.max(mmPx(5), areaBottom - areaTop);
      var bH = Math.min(avail, mmPx(22 * s)), bY = areaTop + (avail - bH) / 2, maxW = w - 2 * pad;
      var bc = document.createElement("canvas");
      try { JsBarcode(bc, L.code, { format: "CODE128", width: 4, height: 120, displayValue: false, margin: 0 }); } catch (e) { bc = null; }
      if (bc && bc.width) {
        var k = Math.max(1, Math.floor(maxW / bc.width)), bw = bc.width * k > maxW ? maxW : bc.width * k;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bc, x + (w - bw) / 2, bY, bw, bH);
      }
      ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#111827"; ctx.textAlign = "left";
      ctx.font = ptPx(7.5 * s) + "px 'Courier New', Courier, monospace"; ctx.fillText(L.code, x + pad, y + h - mmPx(1.6 * s));
      if (L.price) { ctx.textAlign = "right"; ctx.font = "bold " + ptPx(9 * s) + "px Arial, Helvetica, sans-serif"; ctx.fillText(L.price, x + w - pad, y + h - mmPx(1.4 * s)); }
      ctx.restore();
      ctx.strokeStyle = plain ? "#000000" : "#064e3b"; ctx.lineWidth = Math.max(2, mmPx(0.3)); roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, mmPx(1.2 * s)); ctx.stroke();
    }
    function buildPages() {
      var d = labelDims(), mode = (document.getElementById("lblMode") || {}).value || "single", pages = [];
      if (mode === "single") {
        for (var i = 0; i < LABELS.length; i++) {
          var c = document.createElement("canvas"); c.width = mmPx(d.w); c.height = mmPx(d.h);
          var g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
          drawLabel(g, 0, 0, LABELS[i], d.w, d.h); pages.push(c);
        }
        return pages;
      }
      var W = mmPx(210), H = mmPx(297), M = mmPx(8), GAP = mmPx(3), LW = mmPx(d.w), LH = mmPx(d.h);
      var cols = Math.max(1, Math.floor((W - 2 * M + GAP) / (LW + GAP))), rows = Math.max(1, Math.floor((H - 2 * M + GAP) / (LH + GAP)));
      var per = cols * rows;
      for (var start = 0; start < LABELS.length; start += per) {
        var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
        for (var k = 0; k < per && start + k < LABELS.length; k++) {
          drawLabel(ctx, M + (k % cols) * (LW + GAP), M + Math.floor(k / cols) * (LH + GAP), LABELS[start + k], d.w, d.h);
        }
        pages.push(cv);
      }
      return pages;
    }
    function toBlob(cv) { return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, "image/png"); }); }
    async function shareLabels() {
      try {
        saveLblOpts();
        LOGO_IMG = null;
        if (document.getElementById("lblLogo").checked) {
          LOGO_IMG = await new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = LOGO; });
        }
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

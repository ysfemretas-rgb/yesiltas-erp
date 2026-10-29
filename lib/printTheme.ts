// Tüm yazdırılan belgeler (satış fişi, tamir teslim belgesi, alım belgesi, gün sonu,
// etiketler) için ortak "resmi belge" tasarımı: logo + firma antet bilgileri.
// Logo, uygulamanın public klasöründeki /logo-512x512.png dosyasıdır.

export interface CompanyInfo {
  name?: string
  address?: string
  phone?: string
  email?: string
  taxNumber?: string
  iban?: string
  accountName?: string
}

// Ayarlar sayfasındaki örnek (yer tutucu) değerler. Kullanıcı bunları değiştirmediyse
// resmi belgelere sahte adres/IBAN/vergi no basılmasın diye gizlenir.
const PLACEHOLDERS = [
  "İstanbul, Kadıköy, Caferağa Mah. Örnek Sok. No:15",
  "0216 123 4567",
  "info@yesiltas.com",
  "123 456 7890",
  "TR00 1234 5678 9012 3456 7890 12",
]

export function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function money(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
}

export function readCompany(): CompanyInfo {
  let raw: CompanyInfo = {}
  try {
    raw = JSON.parse(localStorage.getItem("yt_company") || "{}")
  } catch {
    raw = {}
  }
  const clean = (v?: string) => (v && !PLACEHOLDERS.includes(v.trim()) ? v.trim() : "")
  return {
    name: (raw.name || "").trim() || "Yeşiltaş Teknoloji",
    address: clean(raw.address),
    phone: clean(raw.phone),
    email: clean(raw.email),
    taxNumber: clean(raw.taxNumber),
    iban: clean(raw.iban),
    accountName: (raw.accountName || "").trim(),
  }
}

export function logoUrl(): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/logo-512x512.png`
}

// Belge sayfası stilleri (A5/A4 uyumlu, siyah-beyaz yazıcıda da okunur)
export function docStyles(extra = ""): string {
  return `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif; color: #111827; margin: 0; font-size: 11.5px; line-height: 1.5; }
  .letterhead { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 2px solid #064e3b; position: relative; }
  .letterhead::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; border-bottom: 0.6px solid #064e3b; }
  .letterhead .logo { width: 18mm; height: 18mm; object-fit: contain; flex: none; }
  .letterhead .co { flex: 1; min-width: 0; }
  .letterhead .co-name { font-size: 16px; font-weight: 700; color: #064e3b; letter-spacing: 0.3px; }
  .letterhead .co-line { font-size: 10px; color: #4b5563; line-height: 1.35; }
  .doc-title { margin: 14px 0 8px; padding: 6px 0; text-align: center; font-size: 12.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid #064e3b; border-bottom: 1px solid #064e3b; background: #f3f6f4; }
  .meta { display: flex; justify-content: space-between; font-size: 10.5px; color: #374151; margin-bottom: 8px; }
  table.grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.grid th { text-align: left; background: #eef2ef; border-bottom: 1.5px solid #064e3b; padding: 5px 6px; font-size: 10.5px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.4px; }
  table.grid td { padding: 5px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  table.kv td.l { color: #4b5563; width: 34%; background: #f9fafb; }
  table.kv td.v { font-weight: 600; }
  table.kv td { border: 1px solid #e5e7eb; }
  .totals { margin-left: auto; width: 62%; border: 1px solid #d1d5db; border-radius: 3px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid #eef0f2; }
  .totals .row:last-child { border-bottom: none; }
  .totals .row.strong { background: #eef2ef; font-weight: 700; color: #064e3b; font-size: 12.5px; }
  .note { margin-top: 10px; font-size: 9.5px; color: #4b5563; border-top: 1px dashed #9ca3af; padding-top: 6px; }
  .sigs { display: flex; gap: 24px; margin-top: 26px; }
  .sig { flex: 1; text-align: center; font-size: 10px; color: #4b5563; }
  .sig .line { border-top: 1px solid #6b7280; height: 36px; margin-bottom: 4px; }
  .footer { margin-top: 14px; padding-top: 6px; border-top: 1px solid #064e3b; text-align: center; font-size: 9.5px; color: #6b7280; }
  .toolbar { position: sticky; top: 0; z-index: 99; display: flex; gap: 8px; justify-content: center; padding: 10px; margin-bottom: 10px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  @media print { .no-print { display: none !important; } }
  ${extra}`
}

export function toolbarHtml(extraButtons: string = "", genericShare: boolean = true): string {
  const share = genericShare
    ? `<button id="btnShareDoc" style="display:none;background:#2563eb;color:#fff" onclick="shareDoc()">📤 Paylaş / Yazdır</button>`
    : ""
  const hint = genericShare
    ? `<div id="iosDocHint" class="no-print" style="display:none;margin:0 0 10px;padding:8px 10px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;font-size:12px;color:#78350f">iPhone'da "Yazdır" düğmesi çalışmayabilir. <b>📤 Paylaş / Yazdır</b>'a basın, açılan menüden <b>Yazdır</b>'ı seçin (belge görsel olarak hazırlanır).</div>`
    : ""
  return `<div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    ${share}${extraButtons}
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>${hint}`
}

// iPhone ana ekran uygulamasında window.print() çalışmaz. Bu betik belgeyi (html2canvas ile) A4 görsel(ler)e çevirip
// iPhone paylaşım menüsüne gönderir (Yazdır / Dosyalara Kaydet / başka uygulama). Belgede data-share-target="1" olan bir
// öğe varsa (küçük etiketler) sadece o öğe, sayfa boşluğu eklenmeden tek görsel olarak paylaşılır.
// Masaüstü ve Android'de düğme gizli kalır, normal "Yazdır" çalışır.
export const DOC_SHARE_SCRIPT = `
(function () {
  var ua = navigator.userAgent || "";
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var b = document.getElementById("btnShareDoc"), h = document.getElementById("iosDocHint");
  if (isIOS && b) { b.style.display = ""; if (h) h.style.display = ""; }
})();
function loadScriptOnce(src) {
  return new Promise(function (res, rej) {
    var s = document.createElement("script"); s.src = src; s.onload = res;
    s.onerror = function () { rej(new Error("Bileşen yüklenemedi; internet bağlantınızı kontrol edin.")); };
    document.head.appendChild(s);
  });
}
function canvasToBlob(cv) { return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, "image/png"); }); }
async function shareDoc() {
  var btn = document.getElementById("btnShareDoc"), old = btn ? btn.textContent : "";
  if (btn) { btn.textContent = "Hazırlanıyor..."; btn.disabled = true; }
  try {
    if (!window.html2canvas) await loadScriptOnce("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    var target = document.querySelector("[data-share-target]");
    var blobs = [];
    if (target) {
      var one = await html2canvas(target, { scale: 4, backgroundColor: "#ffffff", useCORS: true });
      blobs.push(await canvasToBlob(one));
    } else {
      var W = 794;
      var full = await html2canvas(document.body, {
        scale: 2, backgroundColor: "#ffffff", useCORS: true, windowWidth: W, width: W,
        ignoreElements: function (el) { return el.classList && el.classList.contains("no-print"); }
      });
      var pageH = Math.round(full.width * 297 / 210);
      for (var y = 0; y < full.height; y += pageH) {
        var pg = document.createElement("canvas"); pg.width = full.width; pg.height = pageH;
        var g = pg.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, pg.width, pg.height);
        g.drawImage(full, 0, y, full.width, Math.min(pageH, full.height - y), 0, 0, full.width, Math.min(pageH, full.height - y));
        blobs.push(await canvasToBlob(pg));
      }
    }
    var name = (document.title || "belge").replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü _-]/g, "").trim().replace(/\\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "belge";
    var files = blobs.map(function (bl, i) { return new File([bl], name + (blobs.length > 1 ? "-" + (i + 1) : "") + ".png", { type: "image/png" }); });
    if (navigator.canShare && navigator.canShare({ files: files })) {
      await navigator.share({ files: files, title: document.title || "Belge" });
    } else {
      window.location.href = URL.createObjectURL(blobs[0]);
      alert("Görsele uzun basıp Paylaş > Yazdır'ı seçebilirsiniz.");
    }
  } catch (e) {
    if (!(e && e.name === "AbortError")) alert("Paylaşım hazırlanamadı: " + (e && e.message ? e.message : e));
  } finally {
    if (btn) { btn.textContent = old; btn.disabled = false; }
  }
}
`

// Antet: logo solda, firma bilgileri yanında
export function letterheadHtml(company: CompanyInfo = readCompany()): string {
  const contact = [company.phone, company.email].filter(Boolean).join("  •  ")
  return `<div class="letterhead">
    <img class="logo" src="${logoUrl()}" alt="" onerror="this.style.display='none'" />
    <div class="co">
      <div class="co-name">${esc(company.name)}</div>
      ${company.address ? `<div class="co-line">${esc(company.address)}</div>` : ""}
      ${contact ? `<div class="co-line">${esc(contact)}</div>` : ""}
      ${company.taxNumber ? `<div class="co-line">Vergi No: ${esc(company.taxNumber)}</div>` : ""}
    </div>
  </div>`
}

export function footerHtml(text: string, company: CompanyInfo = readCompany()): string {
  return `<div class="footer">${esc(company.name)} — ${esc(text)}</div>`
}

// Yazdırma penceresini açıp belgeyi yazar. Masaüstünde otomatik yazdırma başlatır;
// görsellerin (logo) yüklenmesi beklenir.
export function openPrintWindow(html: string, width = 800, height = 900, autoPrintDelay = 300): boolean {
  const win = window.open("", "_blank", `width=${width},height=${height}`)
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return false
  }
  const shareJs = html.includes('id="btnShareDoc"') ? `<script>${DOC_SHARE_SCRIPT}</script>` : ""
  const withAuto = html.replace(
    "</body>",
    () => `<script>window.addEventListener("load", function () { var m = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); if (!m) { setTimeout(function () { window.print(); }, ${autoPrintDelay}); } });</script>${shareJs}</body>`
  )
  win.document.write(withAuto)
  win.document.close()
  return true
}

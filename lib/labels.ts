// Müşteri / satış / tamir / ürün etiketleri: kod yazısı + barkod (Code128) + karekod.
// Karekod artık dış bir siteye (api.qrserver.com) bağımlı değil, tarayıcıda üretilir.
// Barkod, USB/Bluetooth barkod okuyucularla okunur; karekod telefon kamerasıyla
// okutulunca ilgili kaydı açar (giriş gerekir; giriş yoksa önce giriş sayfası açılır).

export type RecordKind = "customer" | "sale" | "repair" | "product"

const PATHS: Record<RecordKind, string> = {
  customer: "/dashboard/customers",
  sale: "/dashboard/sales",
  repair: "/dashboard/repairs",
  product: "/dashboard/inventory",
}

export const KIND_LABELS: Record<RecordKind, string> = {
  customer: "Müşteri",
  sale: "Satış",
  repair: "Tamir",
  product: "Ürün",
}

// Karekodun taşıdığı bağlantı
export function recordUrl(kind: RecordKind, id: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}${PATHS[kind]}?open=${encodeURIComponent(id)}`
}

export function recordPath(kind: RecordKind, id: string): string {
  return `${PATHS[kind]}?open=${encodeURIComponent(id)}`
}

export async function qrDataUrl(text: string, size = 240): Promise<string> {
  try {
    const mod: any = await import("qrcode")
    const QR = mod.default || mod
    return await QR.toDataURL(text, { margin: 1, width: size, errorCorrectionLevel: "M" })
  } catch (e) {
    console.error("Karekod üretilemedi:", e)
    return ""
  }
}

function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

interface LabelOptions {
  kind: RecordKind
  id: string
  code: string
  title: string
  lines?: string[]
  // Karekod bağlantısını elle vermek için (ör. tamirin herkese açık durum sayfası)
  url?: string
}

export async function printRecordLabel(opts: LabelOptions) {
  if (!opts.code) {
    alert("Bu kaydın henüz kodu yok. Kodlar kayıt oluşturulunca otomatik atanır; sayfayı yenileyip tekrar deneyin.")
    return
  }
  const url = opts.url || recordUrl(opts.kind, opts.id)
  const qr = await qrDataUrl(url, 260)
  const lines = (opts.lines || []).filter(Boolean).map(l => `<div class="line">${esc(l)}</div>`).join("")

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Etiket - ${esc(opts.code)}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page { size: 80mm 50mm; margin: 3mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; }
  .toolbar { position: sticky; top: 0; z-index: 99; display: flex; gap: 8px; justify-content: center; padding: 10px; margin-bottom: 8px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  .label { width: 74mm; padding: 1mm; }
  .top { display: flex; gap: 3mm; align-items: center; }
  .qr { width: 24mm; height: 24mm; flex: none; }
  .info { flex: 1; min-width: 0; }
  .kind { font-size: 7pt; color: #555; text-transform: uppercase; letter-spacing: 1px; }
  .title { font-size: 10pt; font-weight: bold; line-height: 1.15; max-height: 2.4em; overflow: hidden; }
  .line { font-size: 7.5pt; color: #333; line-height: 1.2; }
  .code { font-family: monospace; font-size: 11pt; font-weight: bold; margin-top: 1mm; }
  .bc { display: block; width: 100%; height: 11mm; margin-top: 1mm; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
  <div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>
  <div class="label">
    <div class="top">
      ${qr ? `<img class="qr" src="${qr}" alt="QR" />` : ""}
      <div class="info">
        <div class="kind">${esc(KIND_LABELS[opts.kind])}</div>
        <div class="title">${esc(opts.title)}</div>
        ${lines}
        <div class="code">${esc(opts.code)}</div>
      </div>
    </div>
    <svg class="bc" id="bc"></svg>
  </div>
  <script>
    window.onload = function() {
      try { JsBarcode("#bc", ${JSON.stringify(opts.code)}, { format: "CODE128", width: 1.6, height: 38, displayValue: false, margin: 0 }); } catch (e) {}
      var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) { setTimeout(function() { window.print(); }, 500); }
    };
  </script>
</body></html>`

  const win = window.open("", "_blank", "width=520,height=520")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

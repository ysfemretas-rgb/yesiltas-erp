// Müşteri / satış / tamir / ürün etiketleri: logo + kod yazısı + barkod (Code128) + karekod.
// Karekod dış bir siteye bağımlı değil, tarayıcıda üretilir. Barkod USB/Bluetooth okuyucularla,
// karekod telefon kamerasıyla okutulur (giriş gerekir; giriş yoksa önce giriş sayfası açılır).
import { esc, logoUrl, readCompany, toolbarHtml, openPrintWindow } from "@/lib/printTheme"

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
  const company = readCompany()
  const url = opts.url || recordUrl(opts.kind, opts.id)
  const qr = await qrDataUrl(url, 300)
  const lines = (opts.lines || []).filter(Boolean).map(l => `<div class="line">${esc(l)}</div>`).join("")

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><title>Etiket - ${esc(opts.code)}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page { size: 80mm 50mm; margin: 2mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Roboto, Arial, sans-serif; margin: 0; color: #111827; }
  .toolbar { position: sticky; top: 0; z-index: 99; display: flex; gap: 8px; justify-content: center; padding: 10px; margin-bottom: 8px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
  .toolbar button { font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-print { background: #059669; color: #fff; } .btn-close { background: #e2e8f0; color: #334155; }
  .label { width: 76mm; border: 0.4mm solid #064e3b; border-radius: 1.5mm; overflow: hidden; }
  .head { display: flex; align-items: center; gap: 1.5mm; padding: 1mm 2mm; background: #064e3b; color: #fff; }
  .head img { width: 6mm; height: 6mm; object-fit: contain; background: #fff; border-radius: 1mm; padding: 0.3mm; }
  .head .co { flex: 1; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.3px; }
  .head .kind { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
  .body { display: flex; gap: 2mm; align-items: center; padding: 1.5mm 2mm 0; }
  .qr { width: 21mm; height: 21mm; flex: none; }
  .info { flex: 1; min-width: 0; }
  .title { font-size: 9.5pt; font-weight: 700; line-height: 1.15; max-height: 2.3em; overflow: hidden; }
  .line { font-size: 7pt; color: #374151; line-height: 1.2; }
  .bcwrap { padding: 0 2mm 1.2mm; text-align: center; }
  .bc { display: block; width: 100%; height: 10mm; }
  .code { font-family: "Consolas", "Courier New", monospace; font-size: 9.5pt; font-weight: 700; letter-spacing: 1px; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
  ${toolbarHtml()}
  <div class="label" data-share-target="1">
    <div class="head">
      <img src="${logoUrl()}" alt="" onerror="this.style.display='none'" />
      <span class="co">${esc(company.name)}</span>
      <span class="kind">${esc(KIND_LABELS[opts.kind])}</span>
    </div>
    <div class="body">
      ${qr ? `<img class="qr" src="${qr}" alt="QR" />` : ""}
      <div class="info">
        <div class="title">${esc(opts.title)}</div>
        ${lines}
      </div>
    </div>
    <div class="bcwrap">
      <svg class="bc" id="bc"></svg>
      <div class="code">${esc(opts.code)}</div>
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      try { JsBarcode("#bc", ${JSON.stringify(opts.code)}, { format: "CODE128", width: 1.7, height: 40, displayValue: false, margin: 0 }); } catch (e) {}
    });
  </script>
</body></html>`

  openPrintWindow(html, 520, 520, 500)
}

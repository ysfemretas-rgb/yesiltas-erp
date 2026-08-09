"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer } from "lucide-react"

interface RepairForQr {
  id: string
  repairCode?: string
  customerCode?: string
  customerName: string
  brand: string
  model: string
  issue: string
  createdAt: string
  imei?: string
}

interface QrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repair: RepairForQr | null
}

// QR kod artık düz metin değil, bir bağlantı taşıyor. Telefonun kendi kamerasıyla
// okutulunca doğrudan bu kaydı açan tarayıcı sayfasına gider; uygulama içindeki
// "QR Okut" özelliğiyle okutulunca da aynı kayda anında yönlendirir.
function buildQrUrl(repair: RepairForQr) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/dashboard/repairs?open=${repair.id}`
}

function buildQrCaption(repair: RepairForQr) {
  return [
    `Kayit No: ${repair.repairCode || repair.id.slice(0, 8).toUpperCase()}`,
    repair.customerCode ? `Musteri No: ${repair.customerCode}` : null,
    `Musteri: ${repair.customerName}`,
    `Cihaz: ${repair.brand} ${repair.model}`,
    repair.imei ? `IMEI: ${repair.imei}` : null,
    `Ariza: ${repair.issue}`,
    `Tarih: ${repair.createdAt}`,
  ].filter(Boolean).join("\n")
}

// QR etiketini ayrı pencerede yazdırır — sayfanın tamamı yerine sadece etiketi
// basar, mobilde de kapatma butonu bulunur.
function printQrLabel(repair: RepairForQr) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(buildQrUrl(repair))}`
  const code = repair.repairCode || repair.id.slice(0, 8).toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Cihaz Etiketi - ${code}</title>
<style>
  @page { size: 80mm 100mm; margin: 5mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; text-align: center; }
  .toolbar {
    position: sticky; top: 0; z-index: 99;
    display: flex; gap: 8px; justify-content: center;
    padding: 10px; margin-bottom: 10px;
    background: #f1f5f9; border-bottom: 1px solid #cbd5e1;
  }
  .toolbar button {
    font-family: inherit; font-size: 14px; font-weight: 600;
    padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer;
  }
  .btn-print { background: #059669; color: #fff; }
  .btn-close { background: #e2e8f0; color: #334155; }
  .code { font-size: 14pt; font-weight: bold; font-family: monospace; margin-bottom: 4px; }
  .cust { font-size: 10pt; margin-bottom: 6px; }
  img { width: 55mm; height: 55mm; }
  .line { font-size: 9pt; margin-top: 3px; }
  .imei { font-family: monospace; font-size: 8pt; color: #444; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Yazdır</button>
    <button class="btn-close" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button>
  </div>
  <div class="code">${code}</div>
  <div class="cust">${repair.customerName}${repair.customerCode ? ` (${repair.customerCode})` : ""}</div>
  <img src="${qrUrl}" alt="QR" />
  <div class="line"><strong>${repair.brand} ${repair.model}</strong></div>
  ${repair.imei ? `<div class="imei">IMEI: ${repair.imei}</div>` : ""}
  <div class="line">${repair.issue}</div>
  <div class="line">${repair.createdAt}</div>
  <script>
    window.onload = function() {
      var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) { setTimeout(function(){ window.print(); }, 400); }
    };
  </script>
</body>
</html>`

  const win = window.open("", "_blank", "width=500,height=700")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

export function QrDialog({ open, onOpenChange, repair }: QrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">📱 Cihaz QR Etiketi</DialogTitle>
        </DialogHeader>
        {repair && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg bg-white p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(buildQrUrl(repair))}`}
                alt="Cihaz QR Kodu"
                width={220}
                height={220}
              />
            </div>
            <div className="text-center text-sm text-slate-300">
              <p className="font-mono font-bold text-orange-300">{repair.repairCode || "—"}</p>
              <p className="font-medium text-white">{repair.customerName}</p>
              {repair.customerCode && <p className="font-mono text-xs text-slate-400">{repair.customerCode}</p>}
              <p>{repair.brand} {repair.model}</p>
              {repair.imei && <p className="font-mono text-xs text-slate-500">IMEI: {repair.imei}</p>}
            </div>
            <p className="text-xs text-slate-500 text-center">
              Bu kodu yazdırıp cihaza yapıştırabilirsiniz — telefonla okutunca kayıt bilgileri görünür.
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => printQrLabel(repair)}>
              <Printer className="h-4 w-4 mr-2" />Yazdır
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

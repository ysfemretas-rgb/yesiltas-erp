"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer } from "lucide-react"
import { useEffect, useState } from "react"
import { qrDataUrl, printRecordLabel } from "@/lib/labels"

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
// okutulunca GİRİŞ İSTEMEDEN salt-okunur durum sayfasını açar (bkz.
// app/repair-status/[id]). Düzenlemek için o sayfadaki "Giriş yap ve
// düzenle" bağlantısı kullanılır. Uygulama içindeki "QR Okut" özelliği
// (zaten giriş yapılmış olduğu için) doğrudan yönetim kaydını açar.
function buildQrUrl(repair: RepairForQr) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/repair-status/${repair.id}`
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

// Etiket: karekod (müşteri için herkese açık durum sayfası) + barkod + kod. Karekod artık
// dış siteye bağımlı değil, tarayıcıda üretilir.
function printQrLabel(repair: RepairForQr) {
  printRecordLabel({
    kind: "repair",
    id: repair.id,
    code: repair.repairCode || "",
    title: `${repair.brand} ${repair.model}`.trim() || repair.customerName,
    lines: [
      `${repair.customerName}${repair.customerCode ? ` (${repair.customerCode})` : ""}`,
      repair.imei ? `IMEI: ${repair.imei}` : "",
      repair.issue,
      repair.createdAt,
    ],
    url: buildQrUrl(repair),
  })
}

export function QrDialog({ open, onOpenChange, repair }: QrDialogProps) {
  const [qr, setQr] = useState("")
  useEffect(() => {
    let cancelled = false
    if (!repair) { setQr(""); return }
    qrDataUrl(buildQrUrl(repair), 220).then((url) => { if (!cancelled) setQr(url) })
    return () => { cancelled = true }
  }, [repair?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">📱 Cihaz QR Etiketi</DialogTitle>
        </DialogHeader>
        {repair && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg bg-white p-3">
              {qr ? (
                <img src={qr} alt="Cihaz QR Kodu" width={220} height={220} />
              ) : (
                <div style={{ width: 220, height: 220 }} />
              )}
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

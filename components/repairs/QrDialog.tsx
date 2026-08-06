"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RepairForQr {
  id: number
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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  [
                    `Kayit No: #${repair.id}`,
                    `Musteri: ${repair.customerName}`,
                    `Cihaz: ${repair.brand} ${repair.model}`,
                    repair.imei ? `IMEI: ${repair.imei}` : null,
                    `Ariza: ${repair.issue}`,
                    `Tarih: ${repair.createdAt}`,
                  ]
                    .filter(Boolean)
                    .join("\n")
                )}`}
                alt="Cihaz QR Kodu"
                width={220}
                height={220}
              />
            </div>
            <div className="text-center text-sm text-slate-300">
              <p className="font-medium text-white">#{repair.id} — {repair.customerName}</p>
              <p>{repair.brand} {repair.model}</p>
              {repair.imei && <p className="font-mono text-xs text-slate-500">IMEI: {repair.imei}</p>}
            </div>
            <p className="text-xs text-slate-500 text-center">
              Bu kodu yazdırıp cihaza yapıştırabilirsiniz — telefonla okutunca kayıt bilgileri görünür.
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => window.print()}
            >
              🖨️ Yazdır
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CustomerWhatsAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string
  onSend: (type: "simple" | "detailed") => void
}

export function CustomerWhatsAppDialog({ open, onOpenChange, customerName, onSend }: CustomerWhatsAppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">WhatsApp Mesajı - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-400">Göndermek istediğiniz mesaj tipini seçin:</p>
          <div className="space-y-2">
            <Button
              onClick={() => onSend("simple")}
              className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white"
            >
              <div className="text-left">
                <div className="text-sm">Sadece Borç Özeti</div>
                <div className="text-xs text-slate-400">Toplam borç tutarı gönderilir</div>
              </div>
            </Button>
            <Button
              onClick={() => onSend("detailed")}
              className="w-full justify-start bg-slate-800 hover:bg-slate-700 text-white"
            >
              <div className="text-left">
                <div className="text-sm">Detaylı Borç Listesi</div>
                <div className="text-xs text-slate-400">Tüm işlemler ve kalan borçlar gönderilir</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

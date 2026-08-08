"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Keyboard } from "lucide-react"

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (code: string) => void
  title?: string
}

// Telefon/tablet kamerasıyla barkod okur. Kamera açılamazsa (izin yok,
// masaüstü tarayıcı, HTTPS değil vb.) elle giriş alanına düşer — böylece
// USB barkod okuyucu kullananlar da aynı pencereden devam edebilir.
export function BarcodeScannerDialog({ open, onOpenChange, onScan, title = "Barkod Okut" }: BarcodeScannerDialogProps) {
  const containerId = "barcode-scanner-region"
  const scannerRef = useRef<any>(null)
  const [status, setStatus] = useState<"starting" | "scanning" | "failed">("starting")
  const [errorMsg, setErrorMsg] = useState("")
  const [manualCode, setManualCode] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const start = async () => {
      setStatus("starting")
      setErrorMsg("")
      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        if (cancelled) return
        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onScan(decodedText.trim())
            stop()
            onOpenChange(false)
          },
          () => { /* okunamayan kareler — sessizce geç */ }
        )
        if (!cancelled) setStatus("scanning")
      } catch (e: any) {
        console.error("Kamera başlatılamadı:", e)
        if (!cancelled) {
          setStatus("failed")
          setErrorMsg(
            typeof e?.message === "string" && e.message.toLowerCase().includes("permission")
              ? "Kamera izni verilmedi. Tarayıcı ayarlarından bu siteye kamera izni verin."
              : "Kamera açılamadı. Cihazınızda kamera yoksa veya tarayıcı desteklemiyorsa aşağıdan elle girebilirsiniz."
          )
        }
      }
    }

    const stop = async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop()
          await scannerRef.current.clear()
          scannerRef.current = null
        }
      } catch {
        // kapatma hatası önemli değil
      }
    }

    start()
    return () => {
      cancelled = true
      stop()
    }
  }, [open])

  const submitManual = () => {
    const code = manualCode.trim()
    if (!code) return
    onScan(code)
    setManualCode("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div id={containerId} className="w-full rounded-lg overflow-hidden bg-black min-h-[200px]" />

          {status === "starting" && (
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />Kamera açılıyor...
            </p>
          )}
          {status === "scanning" && (
            <p className="text-sm text-emerald-400">📷 Barkodu kameraya gösterin — otomatik okunacak.</p>
          )}
          {status === "failed" && (
            <p className="text-sm text-amber-400">{errorMsg}</p>
          )}

          <div className="border-t border-slate-700 pt-3 space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <Keyboard className="h-4 w-4" />Elle gir / USB okuyucuyla okut
            </label>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitManual() }}
                placeholder="YTE-0001"
                className="bg-slate-800 border-slate-600 text-white"
                autoFocus={status === "failed"}
              />
              <Button onClick={submitManual} disabled={!manualCode.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                Ara
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

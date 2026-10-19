"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { DeviceHistory, fetchDeviceHistory } from "@/lib/deviceHistory"

const ICONS: Record<string, string> = { alim: "📥", takas: "🔄", stok: "📦", tamir: "🔧", satis: "🛒" }
const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString("tr-TR")} TL`

// IMEI ile cihazın yaşam döngüsü: nereden/kaça alındı, stok kaydı, tamirler, kime kaça satıldı.
export function DeviceHistoryDialog({ imei, onClose }: { imei: string | null; onClose: () => void }) {
  const [data, setData] = useState<DeviceHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!imei) return
    let cancelled = false
    setLoading(true)
    setError("")
    setData(null)
    fetchDeviceHistory(imei)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { console.error(e); if (!cancelled) setError("Cihaz geçmişi yüklenemedi.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [imei])

  const profit = data ? data.saleTotal - data.costTotal - data.partsTotal : 0

  return (
    <Dialog open={!!imei} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">📱 Cihaz Geçmişi — {imei}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Yükleniyor...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {data && data.events.length === 0 && <p className="text-sm text-slate-500">Bu IMEI için kayıt bulunamadı.</p>}
          {data && data.events.length > 0 && (
            <>
              <div className="space-y-2">
                {data.events.map((e, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white">{ICONS[e.kind]} {e.title}</span>
                      <span className="text-xs text-slate-500 shrink-0">{e.date}</span>
                    </div>
                    <div className="text-xs text-slate-400">{e.detail}</div>
                    {e.amount !== undefined && <div className="text-xs text-amber-300">{money(e.amount)}</div>}
                  </div>
                ))}
              </div>
              {(data.costTotal > 0 || data.saleTotal > 0) && (
                <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Alış / takas maliyeti</span><span>{money(data.costTotal)}</span></div>
                  {data.partsTotal > 0 && <div className="flex justify-between"><span className="text-slate-400">Tamir parça maliyeti</span><span>{money(data.partsTotal)}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-400">Satış fiyatı</span><span>{money(data.saleTotal)}</span></div>
                  {data.saleTotal > 0 && (
                    <div className="flex justify-between border-t border-slate-700 pt-1 font-medium">
                      <span className="text-slate-300">Bu cihazdan kâr</span>
                      <span className={profit >= 0 ? "text-emerald-400" : "text-red-400"}>{money(profit)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

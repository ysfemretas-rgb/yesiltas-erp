"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ScanLine, Loader2 } from "lucide-react"
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog"
import { DeviceHistoryDialog } from "@/components/DeviceHistoryDialog"
import { KIND_LABELS } from "@/lib/labels"
import { FoundRecord, resolveScan, searchAll } from "@/lib/recordLookup"

const KIND_ICONS: Record<FoundRecord["kind"], string> = {
  customer: "👤",
  sale: "🛒",
  repair: "🔧",
  product: "📦",
}

// Üst çubuktaki arama + akıllı okut butonu.
// - Yazarak arama: müşteri, satış, tamir ve ürünlerde tek kutudan.
// - Kod yazınca/okutunca (YTM-, YTS-, YTT-, YTE-, karekod bağlantısı, IMEI) doğrudan o kayda gider.
// - listenKeyboard: USB/Bluetooth barkod okuyucu (klavye gibi yazar) sayfada bir kutuya
//   odaklanmadan okutulsa bile kaydı açar. Sadece bir yerde true verilmeli.
export function GlobalSearch({ listenKeyboard = false }: { listenKeyboard?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<FoundRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const requestId = useRef(0)
  const [historyImei, setHistoryImei] = useState<string | null>(null)

  const goTo = (rec: FoundRecord) => {
    setOpen(false)
    setTerm("")
    setResults([])
    setMessage("")
    router.push(rec.href)
  }

  const handleCode = async (code: string): Promise<boolean> => {
    // 15 haneli IMEI: kayıt yerine cihazın tüm geçmişi (alış, tamir, satış) açılır
    if (/^\d{15}$/.test(code.trim())) {
      setOpen(false)
      setTerm("")
      setHistoryImei(code.trim())
      return true
    }
    try {
      const rec = await resolveScan(code)
      if (rec) {
        goTo(rec)
        return true
      }
    } catch (e) {
      console.error("Kod çözümlenemedi:", e)
    }
    return false
  }

  // Yazdıkça ara (kısa gecikmeyle)
  useEffect(() => {
    if (!open) return
    const t = term.trim()
    if (t.length < 2) {
      setResults([])
      setMessage("")
      return
    }
    const id = ++requestId.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const found = await searchAll(t)
        if (id !== requestId.current) return
        setResults(found)
        setMessage(found.length === 0 ? "Sonuç bulunamadı." : "")
      } catch (e) {
        console.error(e)
        if (id === requestId.current) setMessage("Arama sırasında bir sorun oluştu.")
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [term, open])

  const submit = async () => {
    const t = term.trim()
    if (!t) return
    const ok = await handleCode(t)
    if (!ok && /^\d{8,17}$/.test(t)) {
      // IMEI olmayabilir ama rakam dizisi: cihaz geçmişini göster
      setOpen(false)
      setTerm("")
      setHistoryImei(t)
      return
    }
    if (!ok && results.length === 1) goTo(results[0])
  }

  // Klavye gibi çalışan barkod okuyucular: çok hızlı tuş dizisi + Enter
  useEffect(() => {
    if (!listenKeyboard) return
    let buffer = ""
    let lastTime = 0
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return
      const now = Date.now()
      if (now - lastTime > 80) buffer = ""
      lastTime = now
      if (e.key === "Enter") {
        const code = buffer.trim()
        buffer = ""
        if (code.length >= 6 && /^(YT[MSTE]-\d+|\d{15})$/i.test(code)) {
          e.preventDefault()
          handleCode(code)
        }
        return
      }
      if (e.key.length === 1) buffer += e.key
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [listenKeyboard])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-10 w-10 lg:h-8 lg:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
        title="Ara / Kod okut"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔎 Ara / Kod Okut</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit() }}
                placeholder="İsim, telefon, kod (YTM-0001), IMEI, ürün..."
                className="bg-slate-800 border-slate-600 text-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setOpen(false); setScanOpen(true) }}
                className="border-slate-600 text-amber-400 shrink-0"
                title="Kamerayla barkod / karekod okut"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Barkod okuyucuyla okutabilir ya da kodu yazıp Enter'a basabilirsiniz; kayıt doğrudan açılır.
            </p>
            {loading && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Aranıyor...</p>}
            {message && !loading && <p className="text-sm text-slate-500">{message}</p>}
            {/^\d{8,17}$/.test(term.trim()) && (
              <button
                onClick={() => { setOpen(false); setHistoryImei(term.trim()); setTerm("") }}
                className="w-full text-left p-3 rounded-lg bg-indigo-900/30 border border-indigo-700 hover:bg-indigo-900/50 text-sm text-indigo-200"
              >
                📱 Bu IMEI için cihaz geçmişini göster ({term.trim()})
              </button>
            )}
            <div className="space-y-2">
              {results.map((r) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => goTo(r)}
                  className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{KIND_ICONS[r.kind]} {r.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{KIND_LABELS[r.kind]}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex justify-between gap-2">
                    <span className="truncate">{r.subtitle}</span>
                    {r.code && <span className="font-mono text-amber-400 shrink-0">{r.code}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeviceHistoryDialog imei={historyImei} onClose={() => setHistoryImei(null)} />
      <BarcodeScannerDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        title="Barkod / Karekod Okut"
        onScan={async (code) => {
          const ok = await handleCode(code)
          if (!ok) {
            setTerm(code)
            setOpen(true)
          }
        }}
      />
    </>
  )
}

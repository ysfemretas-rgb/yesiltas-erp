"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { WHATSAPP_EVENT, rememberScroll } from "@/lib/whatsapp"

// iPhone'da ana ekrandan açılan uygulamada WhatsApp mesajı bu pencereden gönderilir (bkz. lib/whatsapp.ts).
// 1) "WhatsApp'ta aç": gerçek bir bağlantı (whatsapp://) — dokununca doğrudan WhatsApp açılır, ERP yerinde kalır.
// 2) Olmazsa: "Mesajı kopyala" ile mesajı kopyalayıp WhatsApp'ta yapıştırın, ya da "Paylaş".
export function WhatsAppSheet() {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [text, setText] = useState("")
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {}
      setPhone(String(d.phone || "").replace(/\D/g, ""))
      setText(String(d.message || ""))
      setCopied(false)
      setOpen(true)
    }
    window.addEventListener(WHATSAPP_EVENT, handler)
    setCanShare(typeof navigator !== "undefined" && typeof (navigator as any).share === "function")
    return () => window.removeEventListener(WHATSAPP_EVENT, handler)
  }, [])

  const enc = encodeURIComponent(text)
  const appUrl = phone ? `whatsapp://send?phone=${phone}&text=${enc}` : `whatsapp://send?text=${enc}`
  const webUrl = phone ? `https://wa.me/${phone}?text=${enc}` : `https://wa.me/?text=${enc}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
  }

  const share = async () => {
    try {
      await (navigator as any).share({ text })
    } catch {
      // kullanıcı vazgeçti
    }
  }

  const btn = "block w-full text-center rounded-lg py-3 text-sm font-semibold"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">💬 WhatsApp Mesajı</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{phone ? `Alıcı: +${phone}` : "Alıcıyı WhatsApp'ta seçeceksiniz."} Mesajı gerekirse düzenleyin.</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="bg-slate-800 border-slate-600 text-white text-sm" />
          <a href={appUrl} onClick={() => { rememberScroll(); setTimeout(() => setOpen(false), 800) }} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>
            📲 WhatsApp'ta Aç
          </a>
          <button type="button" onClick={copy} className={`${btn} border border-slate-600 text-slate-200`}>
            {copied ? "✅ Kopyalandı — WhatsApp'ta yapıştırın" : "📋 Mesajı Kopyala"}
          </button>
          {canShare && (
            <button type="button" onClick={share} className={`${btn} border border-slate-600 text-slate-200`}>📤 Paylaş (WhatsApp'ı seçin)</button>
          )}
          <a href={webUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-slate-500 underline pt-1">
            Olmazsa: tarayıcı penceresiyle aç (wa.me)
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

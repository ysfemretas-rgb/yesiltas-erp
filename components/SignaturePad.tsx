"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

// Parmak/kalemle imza alanı. İmza küçük bir resim olarak doğrudan kayda yazılır; hiçbir
// dosya depolamaya (herkese açık alan) yüklenmez.
export function SignaturePad({ onSaved }: { onSaved: (url: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#111827"
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    drawing.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    setHasInk(true)
  }
  const up = () => { drawing.current = false }

  const clear = () => {
    const c = canvasRef.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, c.width, c.height)
    setHasInk(false)
    setError("")
  }

  const save = () => {
    const c = canvasRef.current
    if (!c || !hasInk) return
    setSaving(true)
    setError("")
    try {
      // Küçültülmüş (300x100) JPEG: kayıt hafif kalır (~3-5 KB)
      const small = document.createElement("canvas")
      small.width = 300
      small.height = 100
      const sctx = small.getContext("2d")
      if (!sctx) throw new Error("canvas")
      sctx.fillStyle = "#ffffff"
      sctx.fillRect(0, 0, small.width, small.height)
      sctx.drawImage(c, 0, 0, small.width, small.height)
      const dataUrl = small.toDataURL("image/jpeg", 0.6)
      onSaved(dataUrl)
      clear()
    } catch (e) {
      console.error("İmza kaydedilemedi:", e)
      setError("İmza kaydedilemedi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-28 rounded-lg border border-slate-600 bg-white touch-none"
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} className="border-slate-600 text-slate-300">Temizle</Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasInk || saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}İmzayı Kaydet
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

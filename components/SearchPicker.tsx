"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { ChevronDown, Plus } from "lucide-react"

const MAX_SHOWN = 80

// Yazarak filtreleyen veya oka basınca tüm listeyi açan seçici. Listede olmayan değer
// "allowCustom" ile elle girilebilir. Liste sayfa akışının içinde açılır (kayan pencere değil).
export function SearchPicker({
  options,
  value,
  onChange,
  placeholder,
  allowCustom = true,
  disabled = false,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  allowCustom?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("touchstart", close)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("touchstart", close)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  }, [options, query])

  const exact = options.some((o) => o.toLowerCase() === query.trim().toLowerCase())

  return (
    <div ref={ref} className="space-y-1">
      <div className="relative">
        <Input
          value={open ? query : value}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery("") }}
          onChange={(e) => { setOpen(true); setQuery(e.target.value) }}
          className="pr-10 bg-slate-800 border-slate-600 text-white"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setOpen((o) => !o); setQuery("") }}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-white"
          aria-label="Listeyi aç"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="rounded-lg border border-slate-600 bg-slate-800 max-h-56 overflow-y-auto">
          {allowCustom && query.trim() && !exact && (
            <button
              type="button"
              onClick={() => { onChange(query.trim()); setOpen(false); setQuery("") }}
              className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm text-emerald-400 font-semibold border-b border-slate-700 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />“{query.trim()}” olarak kullan
            </button>
          )}
          {filtered.length === 0 && !(allowCustom && query.trim()) && <div className="p-3 text-sm text-slate-500">Sonuç yok</div>}
          {filtered.slice(0, MAX_SHOWN).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); setQuery("") }}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-700/60 last:border-b-0 hover:bg-slate-700 ${o === value ? "bg-emerald-600/20 text-emerald-300" : "text-white"}`}
            >
              {o}
            </button>
          ))}
          {filtered.length > MAX_SHOWN && <div className="px-3 py-2 text-xs text-slate-500">İlk {MAX_SHOWN} sonuç gösteriliyor; aramak için yazın.</div>}
        </div>
      )}
    </div>
  )
}

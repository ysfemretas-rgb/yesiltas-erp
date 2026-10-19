"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, UserPlus } from "lucide-react"

export interface PickerCustomer {
  id: string
  name: string
  phone?: string
  phone1?: string
  customerCode?: string
}

interface CustomerPickerProps {
  customers: PickerCustomer[]
  value: string
  onChange: (id: string, customer: PickerCustomer) => void
  placeholder?: string
  // Verilirse listenin başında "+ Yeni Müşteri Ekle" satırı görünür
  onNew?: () => void
}

const MAX_SHOWN = 100

// Müşteri seçici: yazarak arama (ad, telefon, müşteri kodu) YA DA kutuya dokununca / oka basınca
// tüm müşteri listesini açıp oradan doğrudan seçme. Liste sayfa akışının içinde açılır
// (kayan pencere değil), bu yüzden telefonda ve iç içe pencerelerde de taşmaz.
export function CustomerPicker({ customers, value, onChange, placeholder = "Müşteri ara veya listeden seç...", onNew }: CustomerPickerProps) {
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

  const selected = customers.find(c => String(c.id) === String(value))
  const phoneOf = (c: PickerCustomer) => c.phone || c.phone1 || ""

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, "")
    const list = !q
      ? customers
      : customers.filter(c =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.customerCode || "").toLowerCase().includes(q) ||
          (digits.length >= 3 && phoneOf(c).replace(/\D/g, "").includes(digits))
        )
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"))
  }, [customers, query])

  const label = selected ? `${selected.name}${phoneOf(selected) ? ` - ${phoneOf(selected)}` : ""}` : ""

  return (
    <div ref={ref} className="space-y-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          value={open ? query : label}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery("") }}
          onChange={(e) => { setOpen(true); setQuery(e.target.value) }}
          className="pl-10 pr-10 bg-slate-800 border-slate-600 text-white"
        />
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setQuery("") }}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-white"
          aria-label="Müşteri listesini aç"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="rounded-lg border border-slate-600 bg-slate-800 max-h-60 overflow-y-auto">
          {onNew && (
            <button
              type="button"
              onClick={() => { setOpen(false); onNew() }}
              className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm text-emerald-400 font-semibold border-b border-slate-700 hover:bg-slate-700"
            >
              <UserPlus className="h-4 w-4" />Yeni Müşteri Ekle
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">❌ Müşteri bulunamadı</div>
          ) : (
            filtered.slice(0, MAX_SHOWN).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(String(c.id), c); setOpen(false); setQuery("") }}
                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-700/60 last:border-b-0 hover:bg-slate-700 ${String(c.id) === String(value) ? "bg-emerald-600/20 text-emerald-300" : "text-white"}`}
              >
                <span className="font-medium">{c.name}</span>
                <span className="block text-xs text-slate-400">
                  {phoneOf(c) || "Telefon yok"}{c.customerCode ? ` • ${c.customerCode}` : ""}
                </span>
              </button>
            ))
          )}
          {filtered.length > MAX_SHOWN && (
            <div className="px-3 py-2 text-xs text-slate-500">İlk {MAX_SHOWN} müşteri gösteriliyor ({filtered.length} kayıt). Aramak için yazın.</div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const NONE = "__none__"

// Tedarikçi seçimi: elle yazmak yerine kayıtlı tedarikçilerden seçilir.
// Kayıtlı olmayan eski bir değer varsa (ör. Excel'den gelen) listede "(kayıtlı değil)" ile görünür, kaybolmaz.
export function SupplierSelect({
  suppliers,
  value,
  onChange,
  placeholder = "Tedarikçi seçin",
}: {
  suppliers: { id: string; name: string }[]
  value: string
  onChange: (name: string) => void
  placeholder?: string
}) {
  const current = (value || "").trim()
  const known = suppliers.some((s) => s.name.trim().toLowerCase() === current.toLowerCase())
  return (
    <Select value={current || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-600 max-h-64">
        <SelectItem value={NONE} className="text-slate-400">— Tedarikçi yok —</SelectItem>
        {current && !known && <SelectItem value={current} className="text-amber-300">{current} (kayıtlı değil)</SelectItem>}
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

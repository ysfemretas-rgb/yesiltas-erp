"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { parseCategories, joinCategories } from "@/lib/supplierCategories"

// Çoklu kategori seçici: dokunarak aç/kapa edilen etiketler + "yeni kategori ekle" kutusu.
// value ve onChange virgülle ayrılmış metindir ("Ekran, Batarya").
export function CategoryMultiSelect({
  value,
  onChange,
  options,
  onCreate,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  onCreate?: (c: string) => void
}) {
  const [newCat, setNewCat] = useState("")
  const selected = parseCategories(value)
  // Seçili olup listede olmayan kategoriler de gösterilsin
  const all = Array.from(new Set([...options, ...selected]))

  const toggle = (c: string) => onChange(joinCategories(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]))

  const add = () => {
    const c = newCat.trim()
    if (!c) return
    onCreate?.(c)
    onChange(joinCategories([...selected, c]))
    setNewCat("")
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {all.map((c) => {
          const on = selected.includes(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${on ? "border-emerald-500 bg-emerald-600/25 text-emerald-200" : "border-slate-500 text-slate-300 hover:bg-slate-600"}`}
            >
              {on ? "✓ " : ""}{c}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder="Yeni kategori ekle (örn. Kılıf)"
          className="bg-slate-700 border-slate-600 text-white h-9"
        />
        <button type="button" onClick={add} className="shrink-0 px-3 rounded-md border border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" />Ekle
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Birden çok kategori seçebilirsiniz.{selected.length === 0 ? " (Hiçbiri seçilmezse \"Diğer\" kaydedilir.)" : ""}</p>
    </div>
  )
}

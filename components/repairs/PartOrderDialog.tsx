"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchSuppliers, Supplier } from "@/lib/suppliers"
import { Repair, updateRepair } from "@/lib/repairs"
import { openWhatsApp } from "@/lib/whatsapp"
import { localDateStr } from "@/lib/dates"
import { appendNote, partOrderMessage, partOrderNote } from "@/lib/partOrder"

// Tamirden tedarikçiye parça siparişi: WhatsApp mesajı hazırlanır, tamir "📦 Parça Bekliyor" aşamasına alınır ve
// siparişin kendisi tamir notuna yazılır. Parça gelince Alışlar'da "Bu alış bir tamir için" seçilerek tamire bağlanır.
export function PartOrderDialog({ repair, onClose, onSaved }: { repair: Repair | null; onClose: () => void; onSaved: (r: Repair, msg: string) => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [part, setPart] = useState("")
  const [qty, setQty] = useState("1")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!repair) return
    setPart(`${repair.brand} ${repair.model}`.trim() + " ")
    setQty("1")
    setNote("")
    setError("")
    fetchSuppliers().then((l) => setSuppliers(l.filter((s) => s.status !== "inactive"))).catch(() => setSuppliers([]))
  }, [repair])

  const supplier = suppliers.find((s) => s.id === supplierId)

  const submit = async (sendWhatsApp: boolean) => {
    if (!repair) return
    const q = Math.max(1, Math.floor(Number(qty) || 1))
    if (!part.trim()) return setError("Parça adını yazın.")
    if (!supplier) return setError("Tedarikçi seçin.")
    if (sendWhatsApp && !supplier.phone) return setError(`${supplier.name} için kayıtlı telefon yok; Tedarikçiler'den ekleyin ya da "WhatsApp'sız işaretle"yi kullanın.`)
    setSaving(true)
    setError("")
    try {
      const device = `${repair.brand} ${repair.model}`.trim()
      if (sendWhatsApp) openWhatsApp(supplier.phone, partOrderMessage({ contact: supplier.contactPerson || "", part, qty: q, device, note }))
      const line = partOrderNote({ part, qty: q, supplier: supplier.name, date: localDateStr() })
      const updated = await updateRepair(repair.id, { stage: "awaiting_parts", status: "waiting", notes: appendNote(repair.notes, line) })
      onSaved(updated, `Parça siparişi kaydedildi; tamir "📦 Parça Bekliyor" aşamasına alındı.`)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Kaydedilemedi.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!repair} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>📦 Parça Siparişi{repair?.repairCode ? ` • ${repair.repairCode}` : ""}</DialogTitle>
        </DialogHeader>
        {repair && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-400">{repair.customerName} — {repair.brand} {repair.model}</p>
            <div className="space-y-1">
              <Label className="text-slate-300">Tedarikçi</Label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full h-10 rounded-md bg-slate-800 border border-slate-600 text-white px-3">
                <option value="">Tedarikçi seçin</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.phone ? "" : " (telefon yok)"}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Parça</Label>
              <Input value={part} onChange={(e) => setPart(e.target.value)} placeholder="Örn: Galaxy A11 ekran (çerçeveli)" className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-slate-300">Adet</Label>
                <Input type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-slate-300">Not (isteğe bağlı)</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn: orijinal olsun, acil" className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex flex-col gap-2 pt-1">
              <Button type="button" disabled={saving} onClick={() => submit(true)} className="bg-emerald-600 hover:bg-emerald-700">💬 WhatsApp ile sipariş et</Button>
              <Button type="button" disabled={saving} variant="outline" onClick={() => submit(false)} className="border-slate-600 text-slate-300">WhatsApp'sız "Parça Bekliyor" olarak işaretle</Button>
            </div>
            <p className="text-xs text-slate-500">Parça gelince Alışlar'da "🔧 Bu alış bir tamir için" kısmından bu tamiri seçin: parça stoğa girip bu tamire eklenir ve müşteriye "parçanız geldi" mesajı hazırlanır.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

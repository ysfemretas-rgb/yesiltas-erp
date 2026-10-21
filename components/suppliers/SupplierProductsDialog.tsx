"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { Supplier } from "@/lib/suppliers"
import { InventoryItem } from "@/lib/inventory"
import { Consumable, fetchConsumables } from "@/lib/consumables"
import { FixedAsset, fetchFixedAssets } from "@/lib/fixedAssets"
import { openWhatsApp } from "@/lib/whatsapp"

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== ""

interface Row {
  key: string
  icon: string
  group: string
  name: string
  category: string
  info: string
}

// Tedarikçinin "hafızası": bu tedarikçiden aldığımız (ürün adının/kaydının tedarikçi alanı bu tedarikçi olan)
// envanter, sarf malzeme ve demirbaşlar. İstenenler seçilip tek mesajda WhatsApp'tan fiyat/stok sorulur.
export function SupplierProductsDialog({
  supplier,
  inventory,
  onClose,
}: {
  supplier: Supplier | null
  inventory: InventoryItem[]
  onClose: () => void
}) {
  const [consumables, setConsumables] = useState<Consumable[]>([])
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => {
    if (!supplier) return
    setPicked([])
    setLoading(true)
    Promise.all([fetchConsumables().catch(() => [] as Consumable[]), fetchFixedAssets().catch(() => [] as FixedAsset[])])
      .then(([c, a]) => { setConsumables(c); setAssets(a) })
      .finally(() => setLoading(false))
  }, [supplier?.id])

  const rows = useMemo<Row[]>(() => {
    if (!supplier) return []
    const n = supplier.name
    return [
      ...inventory.filter((i) => same(i.supplier || "", n)).map((i): Row => ({ key: `i-${i.id}`, icon: "📦", group: "Envanter", name: i.name, category: i.category, info: `stok ${i.quantity}` })),
      ...consumables.filter((c) => same(c.supplier || "", n)).map((c): Row => ({ key: `c-${c.id}`, icon: "🧪", group: "Sarf Malzeme", name: c.name, category: c.category, info: `stok ${c.currentStock} ${c.unit}` })),
      ...assets.filter((a) => same(a.supplier || "", n)).map((a): Row => ({ key: `a-${a.id}`, icon: "🛠️", group: "Demirbaş", name: a.name, category: a.category, info: `${a.quantity} adet` })),
    ]
  }, [supplier, inventory, consumables, assets])

  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
  const chosen = rows.filter((r) => picked.includes(r.key))

  const send = () => {
    if (!supplier || chosen.length === 0) return
    const phone = (supplier.phone || "").replace(/\D/g, "").replace(/^0/, "").replace(/^90/, "")
    const contact = supplier.contactPerson || supplier.name
    const message =
      `Merhaba ${contact},\n\n*Yeşiltaş Teknoloji*'den yazıyoruz. Daha önce sizden aldığımız şu ürünler için bilgi almak istiyoruz:\n\n` +
      chosen.map((r) => `${r.icon} ${r.name}${r.category ? ` (${r.category})` : ""}`).join("\n") +
      `\n\nLütfen şunları bildirir misiniz?\n1️⃣ Bu ürünler elinizde var mı?\n2️⃣ Birim fiyatları nedir?\n\nTeşekkür ederiz.`
    openWhatsApp(phone.length >= 10 ? "90" + phone : "", message)
  }

  const groups = Array.from(new Set(rows.map((r) => r.group)))

  return (
    <Dialog open={!!supplier} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">📦 {supplier?.name} — Aldığımız Ürünler</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-400">Yükleniyor...</p>}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-slate-500">
              Bu tedarikçiye bağlı kayıt yok. Ürünün tedarikçi alanına bu tedarikçinin adını yazdığınızda (Envanter, Sarf Malzeme veya Demirbaş sayfasında ya da Excel'de "Tedarikçi" sütununda) burada listelenir.
            </p>
          )}
          {groups.map((g) => (
            <div key={g} className="space-y-1">
              <div className="text-xs font-semibold text-slate-400">{g}</div>
              {rows.filter((r) => r.group === g).map((r) => (
                <label key={r.key} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={picked.includes(r.key)} onChange={() => toggle(r.key)} className="mt-1" />
                  <div className="min-w-0">
                    <div className="text-sm text-white">{r.icon} {r.name}</div>
                    <div className="text-xs text-slate-400">{r.category} • {r.info}</div>
                  </div>
                </label>
              ))}
            </div>
          ))}
          {rows.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => setPicked(picked.length === rows.length ? [] : rows.map((r) => r.key))}>
                {picked.length === rows.length ? "Seçimi kaldır" : "Hepsini seç"}
              </Button>
              <Button size="sm" disabled={chosen.length === 0} onClick={send} className="bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="h-3 w-3 mr-1" />WhatsApp ile fiyat iste ({chosen.length})
              </Button>
            </div>
          )}
          {supplier && !supplier.phone && rows.length > 0 && <p className="text-xs text-amber-400">Bu tedarikçinin telefonu kayıtlı değil; WhatsApp'ta kişiyi kendiniz seçeceksiniz.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/components/repairs/RepairBadges"

// "Teslim Edildi" işaretlenirken kalan bakiye varsa, sessizce teslim edilmesin:
// kullanıcı "Ödeme Al" ya da "Cariye İşle ve Teslim Et" seçeneklerinden birini
// seçmeden teslimat tamamlanmaz. Cariye işleme ayrı bir borç kaydı AÇMAZ —
// tamirin "remaining" tutarı zaten customerDebt hesaplamasında borç olarak
// sayılıyor, bu yüzden sadece bilgilendirip teslimata izin verir.
export function useDeliveryBalanceChoice() {
  const [state, setState] = useState<{ remaining: number; resolve: (v: "pay" | "credit" | null) => void } | null>(null)

  const ask = useCallback(
    (remaining: number): Promise<"pay" | "credit" | null> => new Promise((resolve) => setState({ remaining, resolve })),
    []
  )

  const close = (v: "pay" | "credit" | null) => {
    state?.resolve(v)
    setState(null)
  }

  const node = state ? (
    <Dialog open onOpenChange={(o) => { if (!o) close(null) }}>
      <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">⚠️ Ödenmemiş Bakiye Var</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-300">
          Bu cihazın <span className="text-amber-400 font-semibold">{formatCurrency(state.remaining)}</span> kalan bakiyesi var.
          Teslim etmeden önce ne yapmak istersiniz?
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <Button type="button" onClick={() => close("pay")} className="bg-emerald-600 hover:bg-emerald-700 w-full">
            💳 Ödeme Al
          </Button>
          <Button type="button" variant="outline" onClick={() => close("credit")} className="border-amber-500 text-amber-400 w-full">
            📒 Cariye İşle ve Teslim Et
          </Button>
          <Button type="button" variant="ghost" onClick={() => close(null)} className="text-slate-400 w-full">
            Vazgeç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : null

  return { ask, node }
}

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface Debt {
  id: string
  amount: number
  description: string
  date: string
  status: "paid" | "unpaid"
  source?: "repair" | "sale" | "manual"
}

interface NewDebtInput {
  amount: number
  description: string
}

interface RelatedDebtItem {
  label: string
  amount: number
  code?: string
}

interface CustomerDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string
  debts: Debt[]
  relatedDebts?: RelatedDebtItem[]
  onPayDebt: (debtId: string) => void
  newDebt: NewDebtInput
  onNewDebtChange: (debt: NewDebtInput) => void
  onAddDebt: () => void
  formatCurrency: (amount: number) => string
}

export function CustomerDebtDialog({
  open,
  onOpenChange,
  customerName,
  debts,
  relatedDebts = [],
  onPayDebt,
  newDebt,
  onNewDebtChange,
  onAddDebt,
  formatCurrency,
}: CustomerDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Borç Yönetimi - {customerName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {relatedDebts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Satış / Tamirden Gelen Bakiyeler</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {relatedDebts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                    <div>
                      <div className="text-sm text-white">{d.label}</div>
                      {d.code && <div className="text-xs text-slate-500 font-mono">{d.code}</div>}
                    </div>
                    {d.amount >= 0 ? (
                      <span className="text-amber-400 font-medium text-sm">{formatCurrency(d.amount)}</span>
                    ) : (
                      <span className="text-cyan-400 font-medium text-sm">Alacaklı: {formatCurrency(-d.amount)}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Bu bakiyeler ilgili satış/tamir kaydı düzenlenerek kapatılır, buradan ödenemez.</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Manuel Borçlar</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(debts || []).length === 0 && (
                <p className="text-sm text-slate-500 py-2">Manuel eklenmiş borç yok.</p>
              )}
              {(debts || []).map((debt) => (
                <div key={debt.id} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                  <div>
                    <div className="text-sm text-white">{debt.description}</div>
                    <div className="text-xs text-slate-400">{debt.date} • {formatCurrency(debt.amount)}</div>
                  </div>
                  {debt.status === "unpaid" ? (
                    <Button size="sm" onClick={() => onPayDebt(debt.id)} className="bg-emerald-600 hover:bg-emerald-700">
                      Öde
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-700">Ödenmiş</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-700 pt-4">
            <label className="text-sm font-medium text-slate-300">Yeni Borç Ekle</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="Tutar"
                value={newDebt.amount || ""}
                onChange={(e) => onNewDebtChange({ ...newDebt, amount: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder="Açıklama"
                value={newDebt.description}
                onChange={(e) => onNewDebtChange({ ...newDebt, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button onClick={onAddDebt} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" disabled={!newDebt.amount || !newDebt.description}>
              <Plus className="mr-2 h-4 w-4" />
              Borç Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

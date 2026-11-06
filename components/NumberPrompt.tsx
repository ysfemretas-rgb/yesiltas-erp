"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// window.prompt yerine: telefonda SAYI TUŞ TAKIMI açan uygulama içi tutar penceresi (tarayıcı prompt'unun klavyesi değiştirilemiyor).
// Kullanım: const { ask, node } = useNumberPrompt();  const v = await ask("Mesaj", "12");  (iptalde null döner)  ... return (<> ... {node} </>)
export function useNumberPrompt() {
  const [state, setState] = useState<{ message: string; value: string; resolve: (v: string | null) => void } | null>(null)

  const ask = useCallback(
    (message: string, defaultValue = ""): Promise<string | null> =>
      new Promise((resolve) => setState({ message, value: defaultValue, resolve })),
    []
  )

  const close = (v: string | null) => {
    state?.resolve(v)
    setState(null)
  }

  const node = state ? (
    <Dialog open onOpenChange={(o) => { if (!o) close(null) }}>
      <DialogContent className="max-w-sm bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">Tutar / sayı girin</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-300 whitespace-pre-line break-words">{state.message}</p>
        <Input
          type="number"
          autoFocus
          value={state.value}
          onChange={(e) => setState({ ...state, value: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") close(state.value) }}
          className="bg-slate-800 border-slate-600 text-white"
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => close(null)} className="border-slate-600 text-slate-300">İptal</Button>
          <Button type="button" onClick={() => close(state.value)} className="bg-emerald-600 hover:bg-emerald-700">Tamam</Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : null

  return { ask, node }
}

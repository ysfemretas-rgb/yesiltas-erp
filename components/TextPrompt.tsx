"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// window.prompt yerine: kısa bir metin/sebep girmek için uygulama içi pencere.
// Kullanım: const { ask, node } = useTextPrompt(); const v = await ask("Başlık", "Mesaj", "ön değer"); (iptalde null döner)
export function useTextPrompt() {
  const [state, setState] = useState<{ title: string; message: string; value: string; resolve: (v: string | null) => void } | null>(null)

  const ask = useCallback(
    (title: string, message = "", defaultValue = ""): Promise<string | null> =>
      new Promise((resolve) => setState({ title, message, value: defaultValue, resolve })),
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
          <DialogTitle className="text-lg">{state.title}</DialogTitle>
        </DialogHeader>
        {state.message && <p className="text-sm text-slate-300 whitespace-pre-line break-words">{state.message}</p>}
        <Textarea
          autoFocus
          value={state.value}
          onChange={(e) => setState({ ...state, value: e.target.value })}
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

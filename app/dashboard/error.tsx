"use client"

import { APP_VERSION } from "@/lib/version"

// Bir sayfa çökerse boş "Application error" yerine, hatanın metnini gösterir (menü yerinde kalır).
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stack = String(error?.stack || "").split("\n").slice(0, 6).join("\n")
  return (
    <div className="p-4 lg:p-6 space-y-3 max-w-2xl">
      <h2 className="text-xl font-bold text-red-400">⚠️ Bu sayfa açılırken bir hata oluştu</h2>
      <p className="text-sm text-slate-300">Verileriniz etkilenmedi. Aşağıdaki hata metninin ekran görüntüsünü gönderirseniz nedenini bulup düzeltebilirim.</p>
      <pre className="text-xs whitespace-pre-wrap break-words rounded-lg bg-slate-900 border border-slate-700 p-3 text-amber-300">{String(error?.message || "Bilinmeyen hata")}</pre>
      {stack && <pre className="text-[10px] whitespace-pre-wrap break-words rounded-lg bg-slate-900 border border-slate-800 p-3 text-slate-400">{stack}</pre>}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => reset()} className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Yeniden dene</button>
        <a href="/dashboard" className="px-3 py-2 rounded-md border border-slate-600 text-slate-300 text-sm">Ana sayfaya dön</a>
      </div>
      <p className="text-[11px] text-slate-500">Sürüm {APP_VERSION}</p>
    </div>
  )
}

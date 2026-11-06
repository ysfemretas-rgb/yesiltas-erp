"use client"

import { Input } from "@/components/ui/input"
import { Expertise, TEST_LABELS, expertiseWarnings } from "@/lib/expertise"

// İkinci el cihaz alırken doldurulan ekspertiz listesi. Sonuç alım belgesine ve cihaz satılınca satış fişine yazılır.
export function ExpertiseFields({ value, onChange }: { value: Expertise; onChange: (e: Expertise) => void }) {
  const set = (patch: Partial<Expertise>) => onChange({ ...value, ...patch })
  const chip = (active: boolean, tone: "ok" | "bad" | "neutral" = "ok") =>
    `px-2.5 py-1 rounded-full text-xs border ${active ? (tone === "bad" ? "bg-red-600 border-red-600 text-white" : tone === "neutral" ? "bg-slate-600 border-slate-500 text-white" : "bg-emerald-600 border-emerald-600 text-white") : "bg-slate-900 border-slate-600 text-slate-300"}`
  const warnings = expertiseWarnings(value)
  return (
    <div className="space-y-2 rounded-lg border border-sky-800 bg-sky-950/30 p-3 text-sm">
      <div className="font-medium text-sky-200">🔎 Ekspertiz (cihazı alırken kontrol edin)</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Pil sağlığı (%)</span>
          <Input type="number" inputMode="numeric" min={0} data-allow-empty value={value.battery} onChange={(e) => set({ battery: e.target.value })} placeholder="Örn: 87" className="bg-slate-900 border-slate-600 text-white h-9" />
        </label>
        <div className="space-y-1">
          <span className="text-xs text-slate-400">Face ID / Touch ID</span>
          <div className="flex gap-1 flex-wrap">
            <button type="button" className={chip(value.biometric === "ok")} onClick={() => set({ biometric: value.biometric === "ok" ? "" : "ok" })}>Çalışıyor</button>
            <button type="button" className={chip(value.biometric === "fail", "bad")} onClick={() => set({ biometric: value.biometric === "fail" ? "" : "fail" })}>Çalışmıyor</button>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-slate-400">Ekran</span>
        <div className="flex gap-1 flex-wrap">
          <button type="button" className={chip(value.screen === "original")} onClick={() => set({ screen: value.screen === "original" ? "" : "original" })}>Orijinal</button>
          <button type="button" className={chip(value.screen === "changed", "bad")} onClick={() => set({ screen: value.screen === "changed" ? "" : "changed" })}>Değişmiş</button>
          <button type="button" className={chip(value.screen === "unknown", "neutral")} onClick={() => set({ screen: value.screen === "unknown" ? "" : "unknown" })}>Bilinmiyor</button>
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-slate-400">iCloud / Google hesap kilidi</span>
        <div className="flex gap-1 flex-wrap">
          <button type="button" className={chip(value.accountLock === "clean")} onClick={() => set({ accountLock: value.accountLock === "clean" ? "" : "clean" })}>Yok (temiz)</button>
          <button type="button" className={chip(value.accountLock === "locked", "bad")} onClick={() => set({ accountLock: value.accountLock === "locked" ? "" : "locked" })}>VAR</button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-slate-200">
        <input type="checkbox" checked={value.imeiChecked} onChange={(e) => set({ imeiChecked: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
        IMEI sorgulandı (e-Devlet / BTK IMEI sorgulama)
      </label>
      <div className="space-y-1">
        <span className="text-xs text-slate-400">Test edildi (çalışanları işaretleyin)</span>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(TEST_LABELS) as (keyof Expertise["tests"])[]).map((k) => (
            <button key={k} type="button" className={chip(value.tests[k])} onClick={() => set({ tests: { ...value.tests, [k]: !value.tests[k] } })}>{TEST_LABELS[k]}</button>
          ))}
        </div>
      </div>
      <Input value={value.cosmetic} onChange={(e) => set({ cosmetic: e.target.value })} placeholder="Kozmetik durum (örn: kasada hafif çizik, ekran temiz)" className="bg-slate-900 border-slate-600 text-white h-9" />
      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className={`text-xs ${/kilidi VAR/.test(w) ? "text-red-400 font-semibold" : "text-amber-300"}`}>⚠️ {w}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

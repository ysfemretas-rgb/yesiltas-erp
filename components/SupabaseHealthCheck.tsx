"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { fetchSuppliers } from "@/lib/suppliers"
import { fetchWarranties } from "@/lib/warranties"
import { fetchAppointments } from "@/lib/appointments"
import { fetchCustomers } from "@/lib/customers"
import { fetchTransactions } from "@/lib/finance"
import { fetchInventory } from "@/lib/inventory"
import { fetchConsumables } from "@/lib/consumables"
import { fetchStaff } from "@/lib/staff"
import { fetchSales } from "@/lib/sales"
import { fetchRepairs } from "@/lib/repairs"

type CheckResult = {
  label: string
  status: "pending" | "ok" | "error"
  detail: string
}

const MODULES: { label: string; run: () => Promise<any[]> }[] = [
  { label: "Tedarikçiler", run: fetchSuppliers },
  { label: "Garantiler", run: fetchWarranties },
  { label: "Randevular", run: fetchAppointments },
  { label: "Müşteriler", run: fetchCustomers },
  { label: "Finans", run: fetchTransactions },
  { label: "Envanter", run: fetchInventory },
  { label: "Sarf Malzeme", run: fetchConsumables },
  { label: "Personel", run: fetchStaff },
  { label: "Satışlar", run: fetchSales },
  { label: "Teknik Servis", run: fetchRepairs },
]

export function SupabaseHealthCheck() {
  const [results, setResults] = useState<CheckResult[]>([])
  const [running, setRunning] = useState(false)
  const [authStatus, setAuthStatus] = useState<"pending" | "ok" | "error">("pending")

  const runAll = async () => {
    setRunning(true)
    setResults(MODULES.map((m) => ({ label: m.label, status: "pending", detail: "Kontrol ediliyor..." })))

    // Oturum kontrolü
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        setAuthStatus("error")
      } else {
        setAuthStatus("ok")
      }
    } catch {
      setAuthStatus("error")
    }

    const settled = await Promise.allSettled(MODULES.map((m) => m.run()))

    setResults(
      settled.map((res, i) => {
        if (res.status === "fulfilled") {
          return { label: MODULES[i].label, status: "ok", detail: `${res.value.length} kayıt bulundu` }
        }
        const message = res.reason instanceof Error ? res.reason.message : "Bilinmeyen hata"
        return { label: MODULES[i].label, status: "error", detail: message }
      })
    )
    setRunning(false)
  }

  const okCount = results.filter((r) => r.status === "ok").length
  const errorCount = results.filter((r) => r.status === "error").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-slate-400">
          {results.length === 0
            ? "Tüm modüllerin Supabase'e gerçekten bağlı olup olmadığını buradan tek seferde kontrol edebilirsin."
            : `${okCount} modül çalışıyor${errorCount > 0 ? `, ${errorCount} modülde sorun var` : ""}.`}
        </div>
        <Button onClick={runAll} disabled={running} className="bg-emerald-600 hover:bg-emerald-700">
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {running ? "Kontrol Ediliyor..." : "Bağlantıyı Test Et"}
        </Button>
      </div>

      {authStatus !== "pending" && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
            authStatus === "ok"
              ? "border-emerald-700 bg-emerald-900/20 text-emerald-300"
              : "border-red-700 bg-red-900/20 text-red-300"
          }`}
        >
          {authStatus === "ok" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {authStatus === "ok" ? "Giriş oturumu geçerli." : "Giriş oturumu bulunamadı — bu normal olmayabilir, sayfayı yenileyip tekrar dene."}
        </div>
      )}

      {results.length > 0 && (
        <div className="divide-y divide-slate-700 rounded-lg border border-slate-700 overflow-hidden">
          {results.map((r) => (
            <div key={r.label} className="flex items-center justify-between p-3 bg-slate-800/50">
              <div className="flex items-center gap-2">
                {r.status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                {r.status === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {r.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
                <span className="text-sm text-white font-medium">{r.label}</span>
              </div>
              <span className={`text-xs ${r.status === "error" ? "text-red-400" : "text-slate-400"}`}>{r.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

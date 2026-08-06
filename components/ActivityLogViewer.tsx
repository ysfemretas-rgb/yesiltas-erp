"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { fetchActivityLog, ActivityLogEntry } from "@/lib/activityLog"

const ACTION_META: Record<ActivityLogEntry["action"], { label: string; icon: any; className: string }> = {
  created: { label: "eklendi", icon: Plus, className: "text-emerald-400" },
  updated: { label: "güncellendi", icon: Pencil, className: "text-blue-400" },
  deleted: { label: "silindi", icon: Trash2, className: "text-red-400" },
}

export function ActivityLogViewer() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchActivityLog(100)
      setEntries(data)
    } catch (e) {
      console.error("Aktivite logu yüklenemedi:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("tr-TR")
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-slate-400">Son 100 işlem — kim, ne zaman, hangi modülde ne yaptı.</p>
        <Button onClick={load} disabled={loading} variant="outline" className="border-slate-600 text-slate-300">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Yenile
        </Button>
      </div>

      {loading && entries.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Yükleniyor...</p>
      ) : entries.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Henüz bir işlem kaydı yok.</p>
      ) : (
        <div className="divide-y divide-slate-700 rounded-lg border border-slate-700 overflow-hidden max-h-[500px] overflow-y-auto">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action]
            const Icon = meta.icon
            return (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-800/50">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.className}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">
                    <span className="font-medium">{entry.actor}</span>
                    <span className="text-slate-400"> — {entry.module} {meta.label}: </span>
                    {entry.description}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDate(entry.createdAt)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Smartphone, User, Phone, FileText, Wallet } from "lucide-react"
import { fetchRepairPublic, PublicRepairView } from "@/lib/repairs"
import { getRepairStatusBadge, getRepairPaymentBadge, formatCurrency } from "@/components/repairs/RepairBadges"

// Bu sayfa BİLEREK sol menüde YOK ve giriş gerektirmiyor — sadece QR
// kodu okutunca doğrudan buraya gelinir. Salt okunur: burada hiçbir
// bilgi değiştirilemez. Değişiklik yapmak için "Giriş yap ve düzenle"
// bağlantısı normal login ekranına yönlendirir.
export default function RepairStatusPage({ params }: { params: { id: string } }) {
  const [repair, setRepair] = useState<PublicRepairView | null>(null)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchRepairPublic(params.id)
      .then((data) => {
        if (!cancelled) setRepair(data)
      })
      .catch((e) => {
        console.error("Kayıt yüklenemedi:", e)
        if (!cancelled) setErrored(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [params.id])

  const editUrl = `/login?redirect=${encodeURIComponent(`/dashboard/repairs?open=${params.id}`)}`

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
            <Image src="/header-logo.png" alt="Yeşiltaş Teknoloji" width={56} height={56} priority />
          </div>
          <h1 className="text-lg font-bold text-white">Yeşiltaş Teknoloji</h1>
          <p className="text-xs text-slate-500">Cihaz Durum Görüntüleme</p>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Yükleniyor...</p>
          </div>
        )}

        {!loading && (errored || !repair) && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              Kayıt bulunamadı. QR kod geçersiz olabilir.
            </CardContent>
          </Card>
        )}

        {!loading && repair && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white font-mono text-base">{repair.repairCode || "—"}</CardTitle>
                {getRepairStatusBadge(repair.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">{repair.customerName}</div>
                  {repair.customerCode && <div className="text-xs text-slate-500 font-mono">{repair.customerCode}</div>}
                </div>
              </div>

              {repair.phone1 && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                  {repair.phone1}
                </div>
              )}

              <div className="flex items-start gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-slate-200">{repair.brand} {repair.model}</div>
                  {repair.imei && <div className="text-xs text-slate-500 font-mono">IMEI: {repair.imei}</div>}
                </div>
              </div>

              {repair.issue && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="text-slate-300">{repair.issue}</div>
                </div>
              )}

              {repair.notes && (
                <div className="rounded-md bg-slate-900/60 border border-slate-700 p-2 text-xs text-slate-400 whitespace-pre-wrap">
                  {repair.notes}
                </div>
              )}

              <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />Tutar</span>
                  <span className="text-white font-semibold">{formatCurrency(repair.cost)}</span>
                </div>
                {repair.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">İndirim</span>
                    <span className="text-emerald-400">-{formatCurrency(repair.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Ödeme</span>
                  {getRepairPaymentBadge(repair.paymentType, repair.remaining)}
                </div>
              </div>

              <div className="text-xs text-slate-500 text-center pt-1">
                Alınma Tarihi: {repair.createdAt}
                {repair.completedAt && <> • Tamamlanma: {repair.completedAt}</>}
              </div>

              <a
                href={editUrl}
                className="flex items-center justify-center gap-2 w-full rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 py-2 text-sm transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                Giriş yap ve düzenle
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

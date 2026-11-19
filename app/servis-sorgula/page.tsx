"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Smartphone, User, Phone, FileText, Wallet, RotateCcw } from "lucide-react"
import { fetchRepairPublicByCode, PublicRepairView } from "@/lib/repairs"
import { getRepairStatusBadge, getRepairPaymentBadge, formatCurrency } from "@/components/repairs/RepairBadges"

// Bu sayfa BİLEREK sol menüde YOK ve giriş gerektirmiyor. Müşteri "ne zaman hazır
// olacak" diye aramak/mesaj beklemek zorunda kalmadan, servis/tamir numarası +
// kayıtlı telefon numarasının SON 4 HANESİNİ girerek kendi cihazının durumunu
// görebilir. Salt okunur: burada hiçbir bilgi değiştirilemez.
export default function ServisSorgulaPage() {
  const [code, setCode] = useState("")
  const [last4, setLast4] = useState("")
  const [repair, setRepair] = useState<PublicRepairView | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    const c = code.trim()
    const l4 = last4.trim()
    if (!c) { setError("Servis/tamir numaranızı girin."); return }
    if (l4.length !== 4 || !/^\d{4}$/.test(l4)) { setError("Telefon numaranızın son 4 hanesini girin."); return }
    setError("")
    setLoading(true)
    setSearched(true)
    try {
      const data = await fetchRepairPublicByCode(c, l4)
      setRepair(data)
    } catch (e) {
      console.error("Sorgu başarısız:", e)
      setRepair(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRepair(null)
    setSearched(false)
    setError("")
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
            <Image src="/header-logo.png" alt="Yeşiltaş Teknoloji" width={56} height={56} priority />
          </div>
          <h1 className="text-lg font-bold text-white">Yeşiltaş Teknoloji</h1>
          <p className="text-xs text-slate-500">Servis Durumu Sorgulama</p>
        </div>

        {!searched && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Cihazınızın durumunu sorgulayın</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Servis / Tamir No</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Örn: YTT-0007"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefon Numaranızın Son 4 Hanesi</Label>
                <Input
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="Örn: 4567"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />{loading ? "Aranıyor..." : "Sorgula"}
              </Button>
              <p className="text-xs text-slate-500 text-center">Servis numaranızı teslim fişinizde veya size gönderilen WhatsApp mesajında bulabilirsiniz.</p>
            </CardContent>
          </Card>
        )}

        {searched && loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Aranıyor...</p>
          </div>
        )}

        {searched && !loading && !repair && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400 space-y-4">
              <p>Kayıt bulunamadı. Servis numarasını ve telefon numaranızın son 4 hanesini kontrol edip tekrar deneyin.</p>
              <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-2" />Tekrar Dene
              </Button>
            </CardContent>
          </Card>
        )}

        {searched && !loading && repair && (
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
                <div className="text-white font-medium">{repair.customerName}</div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="text-slate-200">{repair.brand} {repair.model}</div>
              </div>

              {repair.issue && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="text-slate-300">{repair.issue}</div>
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

              <Button onClick={reset} variant="outline" className="w-full border-slate-600 text-slate-300">
                <RotateCcw className="h-4 w-4 mr-2" />Yeni Sorgu
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

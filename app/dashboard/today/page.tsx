"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Shield, Calendar, Wallet, Wrench, RefreshCw, Loader2 } from "lucide-react"
import { Toast, useToast } from "@/components/toast"
import { fetchWarranties } from "@/lib/warranties"
import { fetchAppointments } from "@/lib/appointments"
import { fetchCustomers } from "@/lib/customers"
import { fetchRepairs } from "@/lib/repairs"

interface ReminderItem {
  id: string
  group: "warranty" | "appointment" | "debt" | "repair"
  title: string
  subtitle: string
  phone: string
  message: string
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

const GROUP_META: Record<ReminderItem["group"], { label: string; icon: any; color: string }> = {
  warranty: { label: "🛡️ Garanti Süresi", icon: Shield, color: "text-indigo-400" },
  appointment: { label: "📅 Randevu Hatırlatma", icon: Calendar, color: "text-pink-400" },
  debt: { label: "💰 Ödeme Hatırlatma", icon: Wallet, color: "text-amber-400" },
  repair: { label: "🔧 Bekleyen Tamir", icon: Wrench, color: "text-orange-400" },
}

export default function TodayPage() {
  const { toast, showToast, hideToast } = useToast()
  const [items, setItems] = useState<ReminderItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const newItems: ReminderItem[] = []

    try {
      const warranties = await fetchWarranties()
      for (const w of warranties) {
        if (!w.customerPhone || !w.endDate) continue
        const d = daysUntil(w.endDate)
        if (d < 0 || d > 7) continue
        newItems.push({
          id: `w-${w.id}`,
          group: "warranty",
          title: `${w.customerName} — ${w.deviceName}`,
          subtitle: d < 0 ? `Garanti süresi doldu` : `Garanti ${d} gün içinde bitiyor`,
          phone: w.customerPhone,
          message: `\uD83D\uDC4B Merhaba ${w.customerName},\n\n\uD83D\uDEE1\uFE0F *Yeşiltaş Teknoloji*'den garanti bilgilendirmesidir.\n\n${w.deviceName} cihazınızın garantisi ${d < 0 ? "sona ermiştir" : `${d} gün içinde sona erecektir`}.\n\nHerhangi bir sorun yaşarsanız bizimle iletişime geçebilirsiniz.\n\n\uD83C\uDFEA Yeşiltaş Teknoloji`,
        })
      }
    } catch (e) {
      console.error("Garantiler yüklenemedi:", e)
    }

    try {
      const appointments = await fetchAppointments()
      for (const a of appointments) {
        if (a.status !== "scheduled" || !a.customerPhone) continue
        const d = daysUntil(a.date)
        if (d < 0 || d > 1) continue
        newItems.push({
          id: `a-${a.id}`,
          group: "appointment",
          title: `${a.customerName} — ${a.service}`,
          subtitle: d === 0 ? `Randevu bugün, saat ${a.time}` : `Randevu yarın, saat ${a.time}`,
          phone: a.customerPhone,
          message: `\uD83D\uDC4B Merhaba ${a.customerName},\n\n\uD83D\uDCC5 *Yeşiltaş Teknoloji*'den randevu hatırlatmasıdır.\n\n${d === 0 ? "Bugünkü" : "Yarınki"} randevunuz: ${a.time} — ${a.service}\n\nGörüşmek üzere!\n\n\uD83C\uDFEA Yeşiltaş Teknoloji`,
        })
      }
    } catch (e) {
      console.error("Randevular yüklenemedi:", e)
    }

    try {
      const customers = await fetchCustomers()
      let iban = ""
      let accountName = ""
      try {
        const companyRaw = typeof window !== "undefined" ? localStorage.getItem("yt_company") : null
        if (companyRaw) {
          const companyData = JSON.parse(companyRaw)
          iban = companyData?.iban || ""
          accountName = companyData?.accountName || ""
        }
      } catch {
        // yoksay
      }
      const paymentLine = iban
        ? `\uD83C\uDFE6 IBAN ile ödeyebilir ya da cihazınızı teslim alırken nakit ödeyebilirsiniz.\n${iban}${accountName ? ` (${accountName})` : ""}\n\uD83D\uDCDD Açıklama kısmını boş bırakabilirsiniz.\n\uD83E\uDDFE Ödeme sonrası dekontu bize iletmenizi rica ederiz.`
        : `\uD83C\uDFE6 Havale/EFT ile ödeyebilir ya da cihazınızı teslim alırken nakit ödeyebilirsiniz.`
      for (const c of customers) {
        const phone = c.phone || c.phone1 || ""
        if (!phone || !c.totalDebt || c.totalDebt <= 0) continue
        newItems.push({
          id: `d-${c.id}`,
          group: "debt",
          title: c.name,
          subtitle: (() => {
            const unpaid = (c.debts || []).filter((d: any) => d.status === "unpaid" && d.date)
            if (unpaid.length > 0) {
              const oldest = unpaid.reduce((min: string, d: any) => (d.date < min ? d.date : min), unpaid[0].date)
              const days = Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000)
              if (days >= 30) return `${c.totalDebt.toLocaleString("tr-TR")} TL borcu var — ⏰ ${days} gündür ödenmedi`
            }
            return `${c.totalDebt.toLocaleString("tr-TR")} TL borcu var`
          })(),
          phone,
          message: `\uD83D\uDC4B Merhaba ${c.name},\n\n\uD83D\uDCB0 *Yeşiltaş Teknoloji*'den ödeme hatırlatmasıdır.\n\nHesabınızda ${c.totalDebt.toLocaleString("tr-TR")} TL bakiye bulunmaktadır.\n\n${paymentLine}\n\nTeşekkür ederiz.\n\n\uD83C\uDFEA Yeşiltaş Teknoloji`,
        })
      }
    } catch (e) {
      console.error("Müşteriler yüklenemedi:", e)
    }

    try {
      const repairs = await fetchRepairs()
      for (const r of repairs) {
        if (r.status !== "waiting" || !r.phone1 || !r.createdAt) continue
        const waitingDays = -daysUntil(r.createdAt)
        if (waitingDays < 2) continue
        newItems.push({
          id: `r-${r.id}`,
          group: "repair",
          title: `${r.customerName} — ${r.brand} ${r.model}`,
          subtitle: `${waitingDays} gündür bekliyor, durum bilgisi verilebilir`,
          phone: r.phone1,
          message: `\uD83D\uDC4B Merhaba ${r.customerName},\n\n\uD83D\uDD27 *Yeşiltaş Teknoloji*'den bilgilendirmedir.\n\n${r.brand} ${r.model} cihazınızla ilgileniyoruz, en kısa sürede size dönüş yapacağız.\n\nSabrınız için teşekkür ederiz.\n\n\uD83C\uDFEA Yeşiltaş Teknoloji`,
        })
      }
    } catch (e) {
      console.error("Tamir kayıtları yüklenemedi:", e)
    }

    setItems(newItems)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const sendWhatsApp = (item: ReminderItem) => {
    const phone = cleanPhone(item.phone)
    window.open(`https://wa.me/90${phone}?text=${encodeURIComponent(item.message)}`, "_blank")
  }

  const grouped = items.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item)
    return acc
  }, {} as Record<string, ReminderItem[]>)

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">📋 Bugün Kimlere Mesaj Atmam Lazım</h1>
          <p className="text-sm text-slate-400 mt-1">
            Garanti süresi yaklaşanlar, yarınki/bugünkü randevular, borcu olan müşteriler ve uzun süredir bekleyen tamirler otomatik listelenir.
          </p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" className="border-slate-600 text-slate-300">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Yenile
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center text-slate-400 py-12">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="py-12 text-center text-slate-400">
            🎉 Bugün için bekleyen bir hatırlatma yok.
          </CardContent>
        </Card>
      ) : (
        (Object.keys(GROUP_META) as ReminderItem["group"][]).map((group) => {
          const groupItems = grouped[group]
          if (!groupItems || groupItems.length === 0) return null
          const meta = GROUP_META[group]
          return (
            <Card key={group} className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className={`text-white flex items-center gap-2`}>
                  {meta.label}
                  <span className="text-sm text-slate-500 font-normal">({groupItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 flex-wrap">
                    <div>
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <div className={`text-xs ${meta.color}`}>{item.subtitle}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendWhatsApp(item)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />WhatsApp Gönder
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

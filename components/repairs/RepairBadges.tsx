import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, CheckCircle, Wallet, Banknote, CreditCard, Receipt } from "lucide-react"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
}

export function getRepairStatusBadge(status: string) {
  switch (status) {
    case "waiting":
      return <Badge variant="outline" className="border-amber-500 text-amber-400"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>
    case "in_progress":
      return <Badge variant="outline" className="border-blue-500 text-blue-400"><AlertCircle className="h-3 w-3 mr-1" />Devam Ediyor</Badge>
    case "completed":
      return <Badge variant="outline" className="border-emerald-500 text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Tamamlandı</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function getRepairPaymentBadge(type: string, remaining: number) {
  if (remaining > 0 && type !== "unpaid") {
    return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kısmi ({formatCurrency(remaining)} kaldı)</Badge>
  }
  switch (type) {
    case "cash": return <Badge className="bg-emerald-600"><Banknote className="h-3 w-3 mr-1" />Nakit</Badge>
    case "card": return <Badge className="bg-blue-600"><CreditCard className="h-3 w-3 mr-1" />Kart</Badge>
    case "transfer": return <Badge className="bg-violet-600"><Receipt className="h-3 w-3 mr-1" />Havale</Badge>
    case "partial": return <Badge className="bg-amber-600"><Wallet className="h-3 w-3 mr-1" />Kısmi</Badge>
    default: return <Badge variant="secondary">Ödenmedi</Badge>
  }
}

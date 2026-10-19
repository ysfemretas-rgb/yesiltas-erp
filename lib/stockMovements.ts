// Stok hareket geçmişi: her stok artış/azalışı (satış, iade, sayım, elle düzeltme...) kaydedilir.
// Kayıt başarısız olursa (tablo yoksa vb.) ana işlem etkilenmez.
import { supabase, fetchAllRows } from "@/lib/supabase"

export interface StockMovement {
  id: string
  productId: string
  productName: string
  delta: number
  reason: string
  userName: string
  date: string
}

function currentUserName(): string {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("yt_user") : null
    return raw ? (JSON.parse(raw)?.name || "") : ""
  } catch {
    return ""
  }
}

export async function logStockMovement(productId: string, productName: string, delta: number, reason: string): Promise<void> {
  if (!delta) return
  try {
    const { error } = await supabase.from("stock_movements").insert({
      product_id: productId,
      product_name: productName,
      delta,
      reason,
      user_name: currentUserName(),
    })
    if (error) console.error("Stok hareketi yazılamadı:", error)
  } catch (e) {
    console.error("Stok hareketi yazılamadı:", e)
  }
}

export async function fetchStockMovements(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw error
  return (data || []).map((r: any) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name ?? "",
    delta: Number(r.delta) || 0,
    reason: r.reason ?? "",
    userName: r.user_name ?? "",
    date: r.created_at ? new Date(r.created_at).toLocaleString("tr-TR") : "",
  }))
}

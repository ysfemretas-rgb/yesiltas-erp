// Gün sonu kasa özeti. Seçilen günün tüm kasa hareketlerini gelir/gider kategorilerine
// göre toplar ve tarayıcı yazdırma penceresinde açar (Türkçe karakterler doğru çıkar).
import type { Transaction } from "@/lib/finance"

function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function money(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount || 0)
}

export function printDayClose(date: string, all: Transaction[]) {
  const list = all.filter(t => t.date === date)
  const income = list.filter(t => t.type === "income")
  const expense = list.filter(t => t.type === "expense")
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0)

  const byCategory = (items: Transaction[]) => {
    const map = new Map<string, number>()
    items.forEach(t => map.set(t.category || "Diğer", (map.get(t.category || "Diğer") || 0) + t.amount))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }
  const catRows = (items: Transaction[]) => byCategory(items).map(([c, a]) => `<tr><td>${esc(c)}</td><td style="text-align:right">${money(a)}</td></tr>`).join("") || `<tr><td colspan="2" style="color:#888">Kayıt yok</td></tr>`
  const detailRows = list.map(t => `<tr><td>${t.type === "income" ? "Gelir" : "Gider"}</td><td>${esc(t.category)}</td><td>${esc(t.description)}</td><td style="text-align:right">${t.type === "income" ? "" : "-"}${money(t.amount)}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#888">Bu tarihte kasa hareketi yok</td></tr>`

  let company: { name?: string } = {}
  try { company = JSON.parse(localStorage.getItem("yt_company") || "{}") } catch { /* yoksay */ }

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Gün Sonu - ${esc(date)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 12px; line-height: 1.5; margin: 0; }
  h1 { font-size: 18px; color: #059669; margin: 0 0 2px; } h2 { font-size: 13px; margin: 16px 0 6px; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 5px 4px; border-bottom: 1px solid #e5e5e5; text-align: left; vertical-align: top; }
  .sum { display: flex; gap: 12px; margin-top: 10px; } .box { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; }
  .big { font-size: 16px; font-weight: bold; }
  .toolbar { display: flex; gap: 8px; justify-content: center; padding: 10px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; margin: -14mm -14mm 12px -14mm; }
  .toolbar button { font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; }
  .p { background: #059669; color: #fff; } .c { background: #e2e8f0; color: #334155; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
  <div class="toolbar no-print"><button class="p" onclick="window.print()">🖨️ Yazdır</button><button class="c" onclick="window.close(); setTimeout(function(){ history.back(); }, 150);">✕ Kapat</button></div>
  <h1>${esc(company.name || "Yeşiltaş Teknoloji")} — Gün Sonu Raporu</h1>
  <div>Tarih: <strong>${esc(date)}</strong></div>
  <div class="sum">
    <div class="box">Toplam Gelir<div class="big" style="color:#059669">${money(totalIncome)}</div></div>
    <div class="box">Toplam Gider<div class="big" style="color:#dc2626">${money(totalExpense)}</div></div>
    <div class="box">Net<div class="big">${money(totalIncome - totalExpense)}</div></div>
  </div>
  <h2>Gelir Kategorileri</h2><table>${catRows(income)}</table>
  <h2>Gider Kategorileri</h2><table>${catRows(expense)}</table>
  <h2>Tüm Hareketler (${list.length})</h2>
  <table><tr><th>Tür</th><th>Kategori</th><th>Açıklama</th><th style="text-align:right">Tutar</th></tr>${detailRows}</table>
  <script>window.onload = function() { var m = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); if (!m) { window.print(); } }</script>
</body></html>`

  const win = window.open("", "_blank", "width=900,height=900")
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Tarayıcınızın açılır pencere engelleyicisini kontrol edin.")
    return
  }
  win.document.write(html)
  win.document.close()
}

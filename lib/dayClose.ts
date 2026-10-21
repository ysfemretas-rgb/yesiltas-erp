// Gün sonu kasa özeti (resmi antetli). Seçilen günün tüm kasa hareketlerini gelir/gider
// kategorilerine göre toplar ve tarayıcı yazdırma penceresinde açar.
import type { Transaction } from "@/lib/finance"
import { netTotals } from "@/lib/financeTotals"
import { esc, money, readCompany, docStyles, toolbarHtml, letterheadHtml, footerHtml, openPrintWindow } from "@/lib/printTheme"

export function printDayClose(date: string, all: Transaction[]) {
  const company = readCompany()
  const list = all.filter(t => t.date === date)
  const income = list.filter(t => t.type === "income")
  const expense = list.filter(t => t.type === "expense")
  const dayTotals = netTotals(list)
  const totalIncome = dayTotals.income
  const totalExpense = dayTotals.expense

  const byCategory = (items: Transaction[]) => {
    const map = new Map<string, number>()
    items.forEach(t => map.set(t.category || "Diğer", (map.get(t.category || "Diğer") || 0) + t.amount))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }
  const catRows = (items: Transaction[]) => byCategory(items).map(([c, a]) => `<tr><td>${esc(c)}</td><td style="text-align:right">${money(a)}</td></tr>`).join("") || `<tr><td colspan="2" style="color:#6b7280">Kayıt yok</td></tr>`
  const detailRows = list.map(t => `<tr><td>${t.type === "income" ? "Gelir" : "Gider"}</td><td>${esc(t.category)}</td><td>${esc(t.description)}</td><td style="text-align:right">${t.type === "income" ? "" : "-"}${money(t.amount)}</td></tr>`).join("") || `<tr><td colspan="4" style="color:#6b7280">Bu tarihte kasa hareketi yok</td></tr>`

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8" /><title>Gün Sonu Raporu - ${esc(date)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  ${docStyles(`
  body { font-size: 12px; }
  h2 { font-size: 12px; margin: 14px 0 4px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; }
  .sum { display: flex; gap: 10px; margin: 8px 0; }
  .box { flex: 1; border: 1px solid #d1d5db; border-radius: 3px; padding: 8px 10px; font-size: 10.5px; color: #4b5563; }
  .box .big { font-size: 16px; font-weight: 700; color: #111827; margin-top: 2px; }
  `)}
</style></head><body>
  ${toolbarHtml()}
  ${letterheadHtml(company)}
  <div class="doc-title">Gün Sonu Kasa Raporu</div>
  <div class="meta"><span>Rapor Tarihi: <strong>${esc(date)}</strong></span><span>Hareket Sayısı: <strong>${list.length}</strong></span></div>
  <div class="sum">
    <div class="box">Toplam Gelir<div class="big" style="color:#047857">${money(totalIncome)}</div></div>
    <div class="box">Toplam Gider<div class="big" style="color:#b91c1c">${money(totalExpense)}</div></div>
    <div class="box">Net<div class="big">${money(totalIncome - totalExpense)}</div></div>
  </div>
  <h2>Gelir Kategorileri</h2><table class="grid">${catRows(income)}</table>
  <h2>Gider Kategorileri</h2><table class="grid">${catRows(expense)}</table>
  <h2>Tüm Hareketler</h2>
  <table class="grid"><tr><th>Tür</th><th>Kategori</th><th>Açıklama</th><th style="text-align:right">Tutar</th></tr>${detailRows}</table>
  <div class="sigs"><div class="sig"><div class="line"></div>Kasayı Hazırlayan</div><div class="sig"><div class="line"></div>Onaylayan (Yönetici)</div></div>
  ${footerHtml("Bu rapor dahili kullanım içindir.", company)}
</body></html>`
  openPrintWindow(html, 900, 900)
}

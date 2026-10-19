// Excel (.xlsx) dışa aktarma. Dosya tarayıcıda oluşturulur ve indirilir.
import { localDateStr } from "@/lib/dates"

export async function exportToExcel(fileBase: string, sheetName: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert("Dışa aktarılacak kayıt yok.")
    return
  }
  const XLSX: any = await import("xlsx")
  const sheet = XLSX.utils.json_to_sheet(rows)
  // Sütun genişliklerini içeriğe göre ayarla
  const keys = Object.keys(rows[0])
  sheet["!cols"] = keys.map(k => ({
    wch: Math.min(40, Math.max(k.length, ...rows.slice(0, 200).map(r => String(r[k] ?? "").length)) + 2),
  }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31))
  XLSX.writeFile(book, `${fileBase}-${localDateStr()}.xlsx`)
}

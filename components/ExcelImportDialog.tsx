"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"

export interface ImportField {
  key: string
  label: string
  required?: boolean
  type?: "text" | "number" | "date"
  defaultValue?: string | number
}

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fields: ImportField[]
  onImport: (rows: Record<string, any>[]) => Promise<void>
  templateHint?: string
}

// Türkçe karakterleri sadeleştirip küçük harfe çevirir — başlık eşleştirmede kullanılır.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "")
}

function guessColumn(fieldLabel: string, headers: string[]): string {
  const target = normalize(fieldLabel)
  const exact = headers.find(h => normalize(h) === target)
  if (exact) return exact
  const partial = headers.find(h => normalize(h).includes(target) || target.includes(normalize(h)))
  return partial || ""
}

export function ExcelImportDialog({ open, onOpenChange, title, fields, onImport, templateHint }: ExcelImportDialogProps) {
  const [step, setStep] = useState<"upload" | "map" | "done">("upload")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [importedCount, setImportedCount] = useState(0)

  const reset = () => {
    setStep("upload")
    setHeaders([])
    setRows([])
    setMapping({})
    setError("")
    setImportedCount(0)
  }

  const handleFile = async (file: File) => {
    setError("")
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" })
      if (data.length < 2) {
        setError("Dosyada veri bulunamadı. İlk satır başlık, ikinci satırdan itibaren veri olmalı.")
        return
      }
      const headerRow = (data[0] as any[]).map(h => String(h).trim())
      const dataRows = data.slice(1).filter(r => r.some(cell => String(cell).trim() !== ""))
      setHeaders(headerRow)
      setRows(dataRows)

      const initialMapping: Record<string, string> = {}
      fields.forEach(f => {
        initialMapping[f.key] = guessColumn(f.label, headerRow)
      })
      setMapping(initialMapping)
      setStep("map")
    } catch (e) {
      console.error(e)
      setError("Dosya okunamadı. Lütfen .xlsx, .xls veya .csv formatında bir dosya seçin.")
    }
  }

  const handleImport = async () => {
    const missingRequired = fields.filter(f => f.required && !mapping[f.key])
    if (missingRequired.length > 0) {
      setError(`Şu zorunlu alanlar için sütun seçmelisiniz: ${missingRequired.map(f => f.label).join(", ")}`)
      return
    }
    setLoading(true)
    setError("")
    try {
      const parsedRows = rows.map(row => {
        const obj: Record<string, any> = {}
        fields.forEach(f => {
          const colIndex = headers.indexOf(mapping[f.key])
          let value: any = colIndex >= 0 ? row[colIndex] : undefined
          if (value === undefined || value === "") value = f.defaultValue
          if (f.type === "number") value = Number(value) || 0
          if (f.type === "date" && value instanceof Date) value = value.toISOString().split("T")[0]
          obj[f.key] = value ?? (f.type === "number" ? 0 : "")
        })
        return obj
      }).filter(obj => fields.filter(f => f.required).every(f => obj[f.key] !== "" && obj[f.key] !== undefined))

      if (parsedRows.length === 0) {
        setError("Eşleştirilen sütunlarla hiç geçerli satır bulunamadı.")
        setLoading(false)
        return
      }

      await onImport(parsedRows)
      setImportedCount(parsedRows.length)
      setStep("done")
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "İçe aktarma sırasında bir sorun oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-400" />{title}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {templateHint && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300">
                {templateHint}
              </div>
            )}
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-600 rounded-lg py-10 cursor-pointer hover:border-emerald-500 transition-colors">
              <Upload className="h-8 w-8 text-slate-500" />
              <span className="text-slate-300">Excel (.xlsx) veya CSV dosyası seçin</span>
              <span className="text-xs text-slate-500">Tıklayın veya sürükleyip bırakın</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (file) handleFile(file)
                }}
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              {rows.length} satır bulundu. Her alanın hangi Excel sütununa karşılık geldiğini kontrol edin (otomatik tahmin edildi, gerekirse değiştirin).
            </p>
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-slate-300 shrink-0">
                    {f.label}{f.required && <span className="text-red-400"> *</span>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                  <Select value={mapping[f.key] || "__none__"} onValueChange={(v) => setMapping({ ...mapping, [f.key]: v === "__none__" ? "" : v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Sütun seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="__none__" className="text-slate-400">— Boş bırak —</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800">
                    {headers.map(h => <th key={h} className="p-2 text-left text-slate-400 whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      {row.map((cell: any, j: number) => <td key={j} className="p-2 text-slate-300 whitespace-nowrap">{String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 3 && <div className="p-2 text-xs text-slate-500 text-center">...ve {rows.length - 3} satır daha</div>}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="border-slate-600 text-slate-300">Geri</Button>
              <Button onClick={handleImport} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {loading ? "Yükleniyor..." : `${rows.length} Satırı İçe Aktar`}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-white font-medium">{importedCount} kayıt başarıyla eklendi.</p>
            <Button onClick={() => { onOpenChange(false); reset() }} className="bg-emerald-600 hover:bg-emerald-700">Kapat</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

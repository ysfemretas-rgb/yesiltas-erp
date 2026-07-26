'use client'

import { Download } from 'lucide-react'

export function ExportCSV({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(';')
    const rows = data.map(row => Object.values(row).map(v => String(v ?? '').replace(/;/g, ',')).join(';'))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
      <Download size={16}/> Excel
    </button>
  )
}

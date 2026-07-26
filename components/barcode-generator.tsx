'use client'
import { useRef } from 'react'
import Barcode from 'react-barcode'
import { Printer } from 'lucide-react'

export default function BarcodeGenerator({ value, text }: { value: string; text?: string }) {
  const barcodeRef = useRef<HTMLDivElement>(null)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !barcodeRef.current) return
    const svg = barcodeRef.current.querySelector('svg')
    if (!svg) return
    printWindow.document.write(`<html><head><title>Barkod</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial;"><div style="text-align:center;">${text ? `<p style="font-size:14px;margin-bottom:10px;font-weight:bold;">${text}</p>` : ''}${svg.outerHTML}<p style="font-size:12px;margin-top:5px;">${value}</p></div></body></html>`)
    printWindow.document.close()
    printWindow.print()
  }
  if (!value) return null
  return (
    <div className="inline-flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200">
      <div ref={barcodeRef}><Barcode value={value} format="CODE128" width={2} height={60} fontSize={14} background="#ffffff" lineColor="#000000" /></div>
      {text && <p className="text-sm font-medium text-gray-700">{text}</p>}
      <button onClick={handlePrint} className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors"><Printer size={14} /> Yazdır</button>
    </div>
  )
}
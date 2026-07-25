'use client'
import { useRef } from 'react'
import { Printer, Share2 } from 'lucide-react'

interface ReceiptData {
  title: string
  companyName?: string
  date: string
  items: { label: string; value: string }[]
  total?: string
  customerPhone?: string
  customerName?: string
}

export default function ReceiptPrint({ data }: { data: ReceiptData }) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<html><head><title>${data.title}</title><style>body{font-family:'Courier New',monospace;width:80mm;margin:0 auto;padding:10px;}.header{text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px;}.item{display:flex;justify-content:space-between;margin:5px 0;font-size:12px;}.total{border-top:1px dashed #000;margin-top:10px;padding-top:10px;font-weight:bold;font-size:14px;}.footer{text-align:center;margin-top:20px;font-size:10px;border-top:1px dashed #000;padding-top:10px;}</style></head><body>${content.innerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.print()
  }

  const handleWhatsApp = () => {
    if (!data.customerPhone) return
    const phone = data.customerPhone.replace(/\D/g, '')
    const message = encodeURIComponent(`*${data.companyName || 'Yeşiltaş Teknoloji'}*\n\n*${data.title}*\nTarih: ${data.date}\n${data.customerName ? `Müşteri: ${data.customerName}\n` : ''}\n${data.items.map(i => `${i.label}: ${i.value}`).join('\n')}${data.total ? `\n\n*Toplam: ${data.total}*` : ''}\n\nTeşekkürler!`)
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <div>
      <div ref={receiptRef} className="hidden">
        <div className="header"><h2 style={{margin:0,fontSize:'16px'}}>{data.companyName || 'Yeşiltaş Teknoloji'}</h2><p style={{margin:'5px 0',fontSize:'11px'}}>{data.title}</p><p style={{margin:0,fontSize:'10px'}}>{data.date}</p></div>
        {data.customerName && <p style={{fontSize:'12px',marginBottom:'10px'}}>Müşteri: {data.customerName}</p>}
        {data.items.map((item, i) => (<div key={i} className="item"><span>{item.label}</span><span>{item.value}</span></div>))}
        {data.total && <div className="total"><span>TOPLAM</span><span>{data.total}</span></div>}
        <div className="footer"><p>Geliştirici: Yusuf Emre TAŞ</p><p>Yeşiltaş ERP</p></div>
      </div>
      <div className="flex gap-2">
        <button onClick={handlePrint} className="flex items-center gap-2 btn-secondary text-sm"><Printer size={16} /> Yazdır</button>
        {data.customerPhone && <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Share2 size={16} /> WhatsApp</button>}
      </div>
    </div>
  )
}
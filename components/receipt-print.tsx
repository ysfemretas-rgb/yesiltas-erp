'use client'

export function ReceiptPrint({ sale }: { sale: any }) {
  if (!sale) return null
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-xs">
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
        <h2 className="text-lg font-bold">Yeşiltaş Teknoloji</h2>
        <p className="text-xs text-gray-500">{new Date().toLocaleDateString('tr-TR')}</p>
      </div>
      <div className="text-sm space-y-1 mb-3">
        <div className="flex justify-between"><span>Fiş No:</span><span className="font-mono">{sale.sale_no}</span></div>
        <div className="flex justify-between"><span>Müşteri:</span><span>{sale.customers?.full_name || 'Perakende'}</span></div>
      </div>
      <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-sm">
        {sale.sale_items?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between">
            <span>{item.quantity}x Ürün</span>
            <span>{item.total_price} ₺</span>
          </div>
        ))}
        <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-lg">
          <span>TOPLAM</span>
          <span>{sale.total_amount} ₺</span>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 mt-4 pt-2 border-t border-dashed border-gray-300">
        Teşekkür ederiz!<br/>Geliştirici: Yusuf Emre TAŞ
      </div>
      <button onClick={() => window.print()} className="mt-4 w-full btn-primary no-print">Yazdır</button>
    </div>
  )
}

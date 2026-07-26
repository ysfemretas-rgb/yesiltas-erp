'use client'

import Barcode from 'react-barcode'

export function BarcodeGenerator({ value }: { value: string }) {
  if (!value) return null
  return (
    <div className="bg-white p-4 rounded-lg">
      <Barcode value={value} format="CODE128" width={2} height={60} displayValue={true} />
    </div>
  )
}

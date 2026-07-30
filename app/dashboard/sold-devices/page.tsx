'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SoldDevicesPage() {
  const router = useRouter()
  useEffect(() => {
    router.push('/dashboard/sales')
  }, [router])
  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SoldDevicesPage() {
  const router = useRouter()
  useEffect(function() {
    router.replace("/dashboard/sales")
  }, [router])
  return (
    <div className="p-6">
      <div className="spinner"></div>
      <p className="text-center mt-4">Yonlendiriliyor</p>
    </div>
  )
}

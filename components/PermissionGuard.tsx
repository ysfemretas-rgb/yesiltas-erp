"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PermissionGuardProps {
  children: React.ReactNode
  requiredPermission: string
  pageName: string
}

export default function PermissionGuard({ children, requiredPermission, pageName }: PermissionGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("yt_user")
    if (!userData) {
      setIsAuthorized(false)
      return
    }

    try {
      const user = JSON.parse(userData)
      // Yönetici her yere erişebilir
      if (user.role === "Yönetici") {
        setIsAuthorized(true)
        return
      }
      // İzin kontrolü
      const permissions = user.permissions || []
      if (permissions.includes(requiredPermission)) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
      }
    } catch {
      setIsAuthorized(false)
    }
  }, [requiredPermission])

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <ShieldAlert className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-400 mb-6">
            <strong>{pageName}</strong> sayfasına erişim izniniz bulunmuyor.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Gerekli izin: <Badge className="bg-red-900/50 text-red-300 border-red-700">{requiredPermission}</Badge>
          </p>
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
            Dashboard'a Dön
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Badge component'i inline
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  )
}
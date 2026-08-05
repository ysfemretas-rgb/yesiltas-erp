"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = "/dashboard"
      } else {
        localStorage.removeItem("yt_user")
        window.location.href = "/login"
      }
    })()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-white">Yukleniyor...</div>
    </div>
  )
}

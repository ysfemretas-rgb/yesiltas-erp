"use client"

import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    const user = localStorage.getItem("yt_user")
    if (user) {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/login"
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-white">Yukleniyor...</div>
    </div>
  )
}
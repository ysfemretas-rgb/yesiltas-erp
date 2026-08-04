"use client"

import { useEffect, useState } from "react"

interface UserData {
  id: number
  username: string
  fullName: string
  role: "admin" | "staff"
  permissions: string[]
}

export function usePermissionGuard(requiredPermission: string) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecking(false)
      return
    }

    try {
      const userStr = localStorage.getItem("yt_user")
      if (!userStr) {
        setAuthorized(false)
        setChecking(false)
        return
      }

      const user: UserData = JSON.parse(userStr)

      // Admin always has access
      if (user.role === "admin") {
        setAuthorized(true)
        setChecking(false)
        return
      }

      // Check specific permission
      if (user.permissions && user.permissions.includes(requiredPermission)) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }
    } catch (e) {
      console.error("Permission guard error:", e)
      setAuthorized(false)
    }

    setChecking(false)
  }, [requiredPermission])

  return { authorized, checking }
}
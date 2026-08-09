"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

export function NotificationBell() {
  const { notifications, markAllSeen, unseenCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const dangerCount = notifications.filter((n) => n.severity === "danger").length

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o
      if (next) markAllSeen()
      return next
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Bildirimler"
      >
        <Bell className="h-4 w-4" />
        {unseenCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              dangerCount > 0 ? "bg-red-500" : "bg-amber-500"
            }`}
          >
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-popover shadow-lg">
          <div className="border-b px-4 py-2 text-sm font-semibold text-foreground">
            🔔 Bildirimler {notifications.length > 0 && `(${notifications.length})`}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Şu an dikkat gerektiren bir şey yok. 👍
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm hover:bg-accent ${
                    n.severity === "danger" ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {n.message}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

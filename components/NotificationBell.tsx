"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, X, Trash2 } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

export function NotificationBell() {
  const { notifications, markAllSeen, unseenCount, dismissNotification, dismissAll } = useNotifications()
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
          <div className="flex items-center justify-between border-b px-4 py-2 text-sm font-semibold text-foreground">
            <span>🔔 Bildirimler {notifications.length > 0 && `(${notifications.length})`}</span>
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-red-400"
                title="Tüm bildirimleri sil"
              >
                <Trash2 className="h-3 w-3" />Hepsini sil
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Şu an dikkat gerektiren bir şey yok. 👍
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start hover:bg-accent">
                  <Link
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className={`block flex-1 px-4 py-2.5 text-sm ${
                      n.severity === "danger" ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {n.message}
                  </Link>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="m-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-red-400"
                    title="Bu bildirimi sil"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

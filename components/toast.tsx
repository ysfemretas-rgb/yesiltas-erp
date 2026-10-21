'use client'

import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  // Hata mesajları daha uzun kalır (okunabilsin); dokununca kapanır
  const duration = type === 'error' ? 12000 : 3000
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, message, duration])

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  return (
    // z-[200]: açık pencerelerin (z-50) ÜSTÜNDE görünsün; eskiden pencerenin arkasında kalıp okunamıyordu
    <div
      role="alert"
      onClick={onClose}
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-[200] ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg animate-fade-in cursor-pointer break-words`}
    >
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
  }

  const hideToast = () => setToast(null)

  return { toast, showToast, hideToast }
}

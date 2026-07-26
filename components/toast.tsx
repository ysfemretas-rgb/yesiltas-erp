'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-80"><X size={16} /></button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }
  const hideToast = () => setToast(null)
  return { toast, showToast, hideToast, ToastComponent: toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null }
}
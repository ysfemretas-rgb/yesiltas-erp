'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export function useToast() {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const ToastComponent = toast ? (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white animate-bounce ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {toast.type === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={() => setToast(null)} className="ml-2"><X size={14}/></button>
    </div>
  ) : null

  return { showToast, ToastComponent }
}

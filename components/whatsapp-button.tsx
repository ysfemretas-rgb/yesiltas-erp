'use client'

import { MessageCircle } from 'lucide-react'

export function WhatsAppButton({ phone, message }: { phone?: string, message?: string }) {
  if (!phone) return null
  const cleanPhone = phone.replace(/\D/g, '')
  const url = `https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message || '')}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="WhatsApp">
      <MessageCircle size={16}/>
    </a>
  )
}

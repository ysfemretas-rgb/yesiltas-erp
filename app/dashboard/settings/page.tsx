'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [form, setForm] = useState({ company_name: '', logo_url: '', address: '', phone: '', email: '' })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      setSettings(data)
      setForm({
        company_name: data.company_name || '',
        logo_url: data.logo_url || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('settings').update({
      company_name: form.company_name,
      logo_url: form.logo_url,
      address: form.address,
      phone: form.phone,
      email: form.email
    }).eq('id', settings.id)
    if (error) {
      setToast({ message: 'Hata: ' + error.message, type: 'error' })
    } else {
      setToast({ message: 'Ayarlar guncellendi!', type: 'success' })
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}
      <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
      <div className="p-6 rounded-xl bg-[#1e293b] border border-[#334155] max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group"><label>Firma Adi</label><input className="input" value={form.company_name} onChange={(e) => setForm({...form, company_name: e.target.value})} /></div>
          <div className="form-group"><label>Logo URL</label><input className="input" value={form.logo_url} onChange={(e) => setForm({...form, logo_url: e.target.value})} /></div>
          <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></div>
          <div className="form-group"><label>Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
          <div className="form-group"><label>E-posta</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
          <button type="submit" className="btn btn-primary">Kaydet</button>
        </form>
      </div>
    </div>
  )
}

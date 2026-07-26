'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '', company_address: '', company_phone: '', company_email: '',
    logo_url: '', default_currency: 'TRY', vat_rate: '20'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => { loadSettings() }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      setSettings({
        company_name: data.company_name || '', company_address: data.company_address || '',
        company_phone: data.company_phone || '', company_email: data.company_email || '',
        logo_url: data.logo_url || '', default_currency: data.default_currency || 'TRY',
        vat_rate: data.vat_rate?.toString() || '20'
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('settings').update({
      company_name: settings.company_name,
      company_address: settings.company_address,
      company_phone: settings.company_phone,
      company_email: settings.company_email,
      logo_url: settings.logo_url,
      default_currency: settings.default_currency,
      vat_rate: parseFloat(settings.vat_rate) || 20
    }).eq('id', (await supabase.from('settings').select('id').single()).data?.id)
    setSaving(false)
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Ayarlar kaydedildi')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-white">Ayarlar</h1>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Preview */}
          {settings.logo_url && (
            <div className="form-group">
              <label>Logo Onizleme</label>
              <div className="p-4 bg-[#0f172a] rounded-lg border border-[#334155] inline-block">
                <img src={settings.logo_url} alt="Logo" className="h-20 w-auto object-contain" onError={() => showToast('Logo yuklenemedi, URL kontrol edin', 'error')} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Logo URL</label>
            <input className="input" value={settings.logo_url} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} placeholder="https://..." />
            <p className="text-xs text-slate-500 mt-1">Supabase Storage public URL veya Imgur linki girin</p>
          </div>

          <div className="form-group">
            <label>Sirket Adi</label>
            <input className="input" value={settings.company_name} onChange={(e) => setSettings({...settings, company_name: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Adres</label>
            <textarea className="input" rows={2} value={settings.company_address} onChange={(e) => setSettings({...settings, company_address: e.target.value})} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Telefon</label>
              <input className="input" value={settings.company_phone} onChange={(e) => setSettings({...settings, company_phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>E-posta</label>
              <input className="input" type="email" value={settings.company_email} onChange={(e) => setSettings({...settings, company_email: e.target.value})} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Varsayilan Para Birimi</label>
              <select className="select" value={settings.default_currency} onChange={(e) => setSettings({...settings, default_currency: e.target.value})}>
                <option value="TRY">Turk Lirasi (TL)</option>
                <option value="USD">Dolar (USD)</option>
              </select>
            </div>
            <div className="form-group">
              <label>KDV Orani (%)</label>
              <input className="input" type="number" value={settings.vat_rate} onChange={(e) => setSettings({...settings, vat_rate: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full py-3">
            {saving ? 'Kaydediliyor...' : 'Ayarlari Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}

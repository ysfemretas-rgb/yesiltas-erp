'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, Save, Building } from 'lucide-react'
export default function SettingsPage() {
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [companyData, setCompanyData] = useState({ company_name: '', address: '', phone: '', email: '', tax_no: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetchCompany() }, [])
  const fetchCompany = async () => {
    const { data } = await supabase.from('company_settings').select('*').single()
    if (data) setCompanyData(data)
  }
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) { setMessage('Şifreler eşleşmiyor!'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordData.new })
    if (error) setMessage('Hata: ' + error.message)
    else { setMessage('Şifre başarıyla değiştirildi!'); setPasswordData({ current: '', new: '', confirm: '' }) }
    setLoading(false)
  }
  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: existing } = await supabase.from('company_settings').select('id').single()
    if (existing) {
      await supabase.from('company_settings').update(companyData).eq('id', existing.id)
    } else {
      await supabase.from('company_settings').insert([companyData])
    }
    setMessage('Şirket bilgileri kaydedildi!')
    setLoading(false)
  }
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
      {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{message}</div>}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building size={20} className="text-blue-500" />Şirket Bilgileri</h3>
        <form onSubmit={handleCompanySave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Şirket Adı" value={companyData.company_name} onChange={e => setCompanyData({...companyData, company_name: e.target.value})} />
          <input className="input" placeholder="Telefon" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
          <input className="input" placeholder="E-posta" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
          <input className="input" placeholder="Vergi No" value={companyData.tax_no} onChange={e => setCompanyData({...companyData, tax_no: e.target.value})} />
          <input className="input md:col-span-2" placeholder="Adres" value={companyData.address} onChange={e => setCompanyData({...companyData, address: e.target.value})} />
          <div className="md:col-span-2"><button type="submit" disabled={loading} className="btn-primary flex items-center gap-2"><Save size={18} /> Kaydet</button></div>
        </form>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lock size={20} className="text-red-500" />Şifre Değiştir</h3>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="password" className="input" placeholder="Mevcut Şifre" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} />
          <input type="password" className="input" placeholder="Yeni Şifre" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} />
          <input type="password" className="input md:col-span-2" placeholder="Yeni Şifre (Tekrar)" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} />
          <div className="md:col-span-2"><button type="submit" disabled={loading} className="btn-primary flex items-center gap-2"><Lock size={18} /> Şifreyi Değiştir</button></div>
        </form>
      </div>
    </div>
  )
}
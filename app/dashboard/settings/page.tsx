'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Lock, Building2, Users, X } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'password' | 'users'>('company')
  const [company, setCompany] = useState({ company_name: '', address: '', phone: '', email: '', tax_no: '', developer_name: 'Yusuf Emre TAŞ' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: c } = await supabase.from('company_settings').select('*').single()
    if (c) setCompany(c)
    const { data: u } = await supabase.from('app_users').select('*').order('created_at', { ascending: false })
    setUsers(u || [])
    setLoading(false)
  }

  const handleCompanySave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('company_settings').upsert({ ...company, user_id: user?.id })
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Şirket bilgileri kaydedildi')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) { showToast('Şifreler uyuşmuyor', 'error'); return }
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Şifre değiştirildi'); setPasswords({ current: '', new: '', confirm: '' }) }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['company', 'password', 'users'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
            {tab === 'company' ? 'Şirket Bilgileri' : tab === 'password' ? 'Şifre Değiştir' : 'Kullanıcılar'}
          </button>
        ))}
      </div>

      {activeTab === 'company' && (
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Building2 size={18}/> Şirket Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Şirket Adı" value={company.company_name} onChange={e => setCompany({...company, company_name: e.target.value})} />
            <input className="input" placeholder="Telefon" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} />
            <input className="input" placeholder="E-posta" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} />
            <input className="input" placeholder="Vergi No" value={company.tax_no} onChange={e => setCompany({...company, tax_no: e.target.value})} />
            <input className="input md:col-span-2" placeholder="Adres" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
            <input className="input md:col-span-2 bg-gray-100" disabled value={`Geliştirici: ${company.developer_name}`} />
          </div>
          <button onClick={handleCompanySave} className="btn-primary flex items-center gap-2"><Save size={16}/> Kaydet</button>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card space-y-4 max-w-md">
          <h3 className="font-semibold flex items-center gap-2"><Lock size={18}/> Şifre Değiştir</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input type="password" className="input" placeholder="Mevcut Şifre" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
            <input type="password" className="input" placeholder="Yeni Şifre" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required minLength={6} />
            <input type="password" className="input" placeholder="Yeni Şifre (Tekrar)" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
            <button type="submit" className="btn-primary">Şifreyi Güncelle</button>
          </form>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold flex items-center gap-2 mb-4"><Users size={18}/> Sistem Kullanıcıları</h3>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr><th className="table-header">E-posta</th><th className="table-header">Rol</th><th className="table-header">Ad Soyad</th><th className="table-header">Kayıt Tarihi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell">{u.email}</td>
                  <td className="table-cell"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                  <td className="table-cell">{u.full_name || '-'}</td>
                  <td className="table-cell">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">Kullanıcı bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

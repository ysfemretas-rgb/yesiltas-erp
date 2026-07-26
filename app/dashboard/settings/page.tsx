'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Lock, Building2, Users, X } from 'lucide-react'
import { useToast } from '@/components/toast'

export default function SettingsPage() {
  const [company, setCompany] = useState({ name: '', address: '', phone: '', email: '', tax_no: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [users, setUsers] = useState<any[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'user' })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: comp } = await supabase.from('company_settings').select('*').eq('user_id', user?.id).single()
    if (comp) setCompany(comp)
    const { data: usrs } = await supabase.from('app_users').select('*').eq('owner_id', user?.id)
    setUsers(usrs || [])
  }

  const saveCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('company_settings').upsert({ ...company, user_id: user?.id })
    if (error) showToast('Hata: ' + error.message, 'error')
    else showToast('Şirket bilgileri kaydedildi')
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) { showToast('Şifreler eşleşmiyor', 'error'); return }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Şifre değiştirildi'); setPasswordForm({ current: '', new: '', confirm: '' }) }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    // Not: Gerçek kullanıcı oluşturma admin API gerektirir, burada sadece kayıt yapıyoruz
    const { error } = await supabase.from('app_users').insert([{ ...newUser, owner_id: user?.id }])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Kullanıcı eklendi'); setShowUserModal(false); setNewUser({ email: '', password: '', full_name: '', role: 'user' }); fetchData() }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {ToastComponent}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>

      {/* Şirket Bilgileri */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Building2 size={20}/> Şirket Bilgileri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Şirket Adı" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
          <input className="input" placeholder="Telefon" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} />
          <input className="input" placeholder="E-posta" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} />
          <input className="input" placeholder="Vergi No" value={company.tax_no} onChange={e => setCompany({...company, tax_no: e.target.value})} />
        </div>
        <input className="input" placeholder="Adres" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
        <button onClick={saveCompany} className="btn-primary flex items-center gap-2">
          <Save size={16}/> Kaydet
        </button>
      </div>

      {/* Şifre Değiştir */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Lock size={20}/> Şifre Değiştir</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <input className="input" type="password" placeholder="Yeni Şifre" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} required />
          <input className="input" type="password" placeholder="Yeni Şifre (Tekrar)" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} required />
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Lock size={16}/> Şifreyi Güncelle
          </button>
        </form>
      </div>

      {/* Kullanıcılar */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2"><Users size={20}/> Kullanıcılar</h2>
          <button onClick={() => setShowUserModal(true)} className="btn-primary text-sm flex items-center gap-1"><Plus size={14}/> Ekle</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad</th><th className="table-header">E-posta</th><th className="table-header">Rol</th></tr></thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id}><td className="table-cell">{u.full_name}</td><td className="table-cell">{u.email}</td><td className="table-cell"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{u.role}</span></td></tr>
              ))}
              {users.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-500">Kullanıcı bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Yeni Kullanıcı</h2>
              <button onClick={() => setShowUserModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
            </div>
            <form onSubmit={addUser} className="space-y-3">
              <input className="input" placeholder="Ad Soyad *" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required />
              <input className="input" type="email" placeholder="E-posta *" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
              <input className="input" type="password" placeholder="Şifre *" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              <select className="input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">İptal</button>
                <button type="submit" className="btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

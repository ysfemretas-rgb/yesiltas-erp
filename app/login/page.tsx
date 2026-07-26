'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-posta veya şifre hatalı!')
    else window.location.href = '/dashboard'
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="card space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="Yeşiltaş" className="w-24 h-24 mx-auto object-contain" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeşiltaş ERP</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Teknoloji Yönetim Sistemi</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="admin@yesiltas.com" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder="••••••" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : 'Giriş Yap'}</button>
          </form>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-4 border-t border-gray-100 dark:border-gray-700">Geliştirici: Yusuf Emre TAŞ</p>
        </div>
      </div>
    </div>
  )
}
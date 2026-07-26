'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('Yeşiltaş Teknoloji')
  const [darkMode, setDarkMode] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSettings()
    checkSession()
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') setDarkMode(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('logo_url, company_name').single()
    if (data) {
      if (data.logo_url) setLogoUrl(data.logo_url)
      if (data.company_name) setCompanyName(data.company_name)
    }
  }

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) router.push('/dashboard')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert('Giriş başarısız: ' + error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-900'} border ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-20 w-auto mx-auto object-contain mb-4" />
          ) : (
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
              YT
            </div>
          )}
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{companyName}</h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>ERP Sistemine Giriş</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className={`text-center text-sm mt-6 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          © 2026 {companyName}. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}

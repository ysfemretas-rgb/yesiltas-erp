"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Monitor, Eye, EyeOff, Lock, User, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Kullanıcılar artık kod içinde değil, Supabase Auth'ta saklanıyor.
// Kurulum talimatı için: supabase-auth-migration.sql dosyasına bakın.
const EMAIL_DOMAIN = "@yesiltas.local"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard"
    }
  }, [shouldRedirect])

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifre girin!")
      setSuccess("")
      return
    }

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Kullanıcı adı, Supabase Auth'ta e-posta olarak saklanıyor
      // (örn: "admin" -> "admin@yesiltas.local")
      const email = username.includes("@") ? username : `${username}${EMAIL_DOMAIN}`

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !authData.user) {
        setError("Kullanıcı adı veya şifre hatalı!")
        setLoading(false)
        return
      }

      // Profil bilgisini (rol, yetkiler) veritabanından çek
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, full_name, role, permissions, is_active")
        .eq("id", authData.user.id)
        .single()

      if (profileError || !profile) {
        setError("Kullanıcı profili bulunamadı. Yöneticinize başvurun.")
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!profile.is_active) {
        setError("Bu hesap devre dışı bırakılmış.")
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      // Arayüzün geri kalanının (sidebar, sayfa yetkileri) kullandığı
      // önbellek. Gerçek erişim kontrolü artık RLS ile veritabanı
      // seviyesinde yapılıyor; bu sadece UI görünürlüğü içindir.
      localStorage.setItem("yt_user", JSON.stringify({
        username: profile.username,
        name: profile.full_name,
        role: profile.role,
        permissions: profile.permissions,
        loginTime: new Date().toISOString()
      }))

      setSuccess(`Giriş başarılı! Hoş geldiniz, ${profile.role} ${profile.full_name}. Yönlendiriliyorsunuz...`)
      setLoading(false)

      setTimeout(() => {
        setShouldRedirect(true)
      }, 800)
    } catch (err) {
      console.error("Giriş hatası:", err)
      setError("Giriş sırasında bir hata oluştu. Tekrar deneyin.")
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl text-white">Giriş Yap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-300">Kullanıcı Adı</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              id="username"
              type="text"
              placeholder="Kullanıcı adınız"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Şifre</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="border-slate-700 bg-slate-800 pl-10 pr-10 text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-900/20 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </CardContent>
    </Card>
  )
}

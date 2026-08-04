"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Monitor, Eye, EyeOff, Lock, User, CheckCircle2, XCircle } from "lucide-react"

interface UserAccount {
  username: string
  password: string
  name: string
  role: string
  permissions: string[]
}

// Varsayılan kullanıcılar (fallback)
const defaultUsers: UserAccount[] = [
  { username: "admin", password: "admin123", name: "Emre", role: "Yönetici", permissions: ["Tamir", "Finans", "Envanter", "Personel", "Raporlar", "Ayarlar", "Satış", "Müşteriler", "Randevular", "Tedarikçiler"] },
  { username: "teknisyen", password: "tek123", name: "Ahmet", role: "Teknisyen", permissions: ["Tamir", "Randevular", "Envanter", "Sarf Malzemeler"] },
  { username: "kasa", password: "kasa123", name: "Ayşe", role: "Kasiyer", permissions: ["Satış", "Finans", "Müşteriler"] },
]

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard"
    }
  }, [shouldRedirect])

  const getUsers = (): UserAccount[] => {
    try {
      const saved = localStorage.getItem("yt_app_users")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            username: u.username,
            password: u.password || "123456",
            name: u.name,
            role: u.role,
            permissions: u.permissions || [],
          }))
        }
      }
    } catch {
      // fallback
    }
    return defaultUsers
  }

  const handleLogin = () => {
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifre girin!")
      setSuccess("")
      return
    }

    setError("")
    setSuccess("")

    const allUsers = getUsers()
    const user = allUsers.find(
      (u) => u.username === username && u.password === password
    )

    if (user) {
      localStorage.setItem("yt_user", JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        loginTime: new Date().toISOString()
      }))

      // Giriş kaydı ekle
      try {
        const records = JSON.parse(localStorage.getItem("yt_login_records") || "[]")
        records.unshift({
          id: Date.now(),
          userId: user.username,
          username: user.username,
          name: user.name,
          action: "login",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          ip: "local"
        })
        localStorage.setItem("yt_login_records", JSON.stringify(records.slice(0, 100)))
      } catch {
        // ignore
      }

      setSuccess(`Giriş başarılı! Hoş geldiniz, ${user.role} ${user.name}. Yönlendiriliyorsunuz...`)

      setTimeout(() => {
        setShouldRedirect(true)
      }, 1000)
    } else {
      setError("Kullanıcı adı veya şifre hatalı!")
      setSuccess("")
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
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Giriş Yap
        </button>

        <div className="border-t border-slate-800 pt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">Demo Hesaplar:</p>
          <div className="space-y-1 text-xs text-slate-400">
            <div 
              className="flex justify-between rounded bg-slate-800/50 px-2 py-1 cursor-pointer hover:bg-slate-800"
              onClick={() => { setUsername("admin"); setPassword("admin123"); setError(""); setSuccess(""); }}
            >
              <span>admin / admin123</span>
              <span className="text-blue-400">Yönetici</span>
            </div>
            <div 
              className="flex justify-between rounded bg-slate-800/50 px-2 py-1 cursor-pointer hover:bg-slate-800"
              onClick={() => { setUsername("teknisyen"); setPassword("tek123"); setError(""); setSuccess(""); }}
            >
              <span>teknisyen / tek123</span>
              <span className="text-emerald-400">Teknisyen</span>
            </div>
            <div 
              className="flex justify-between rounded bg-slate-800/50 px-2 py-1 cursor-pointer hover:bg-slate-800"
              onClick={() => { setUsername("kasa"); setPassword("kasa123"); setError(""); setSuccess(""); }}
            >
              <span>kasa / kasa123</span>
              <span className="text-purple-400">Kasiyer</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
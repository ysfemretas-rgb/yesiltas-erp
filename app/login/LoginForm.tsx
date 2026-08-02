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
}

const users: UserAccount[] = [
  { username: "admin", password: "admin123", name: "Emre", role: "Yonetici" },
  { username: "teknisyen", password: "tek123", name: "Ahmet", role: "Teknisyen" },
  { username: "kasa", password: "kasa123", name: "Ayse", role: "Kasiyer" },
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

  const handleLogin = () => {
    if (!username || !password) {
      setError("Lutfen kullanici adi ve sifre girin!")
      setSuccess("")
      return
    }

    setError("")
    setSuccess("")

    const user = users.find(
      (u) => u.username === username && u.password === password
    )

    if (user) {
      localStorage.setItem("yt_user", JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString()
      }))
      
      setSuccess(`Giris basarili! Hos geldiniz, ${user.role} ${user.name}. Yonlendiriliyorsunuz...`)
      
      setTimeout(() => {
        setShouldRedirect(true)
      }, 1000)
    } else {
      setError("Kullanici adi veya sifre hatali!")
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
        <CardTitle className="text-center text-xl text-white">Giris Yap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-300">Kullanici Adi</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              id="username"
              type="text"
              placeholder="Kullanici adiniz"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Sifre</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Sifreniz"
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
          <div className="flex items-center gap-2 rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-300">
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
          Giris Yap
        </button>

        <div className="border-t border-slate-800 pt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">Demo Hesaplar:</p>
          <div className="space-y-1 text-xs text-slate-400">
            <div 
              className="flex justify-between rounded bg-slate-800/50 px-2 py-1 cursor-pointer hover:bg-slate-800"
              onClick={() => { setUsername("admin"); setPassword("admin123"); setError(""); setSuccess(""); }}
            >
              <span>admin / admin123</span>
              <span className="text-blue-400">Yonetici</span>
            </div>
            <div 
              className="flex justify-between rounded bg-slate-800/50 px-2 py-1 cursor-pointer hover:bg-slate-800"
              onClick={() => { setUsername("teknisyen"); setPassword("tek123"); setError(""); setSuccess(""); }}
            >
              <span>teknisyen / tek123</span>
              <span className="text-green-400">Teknisyen</span>
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
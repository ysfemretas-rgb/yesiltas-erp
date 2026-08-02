"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Monitor, Eye, EyeOff, Lock, User } from "lucide-react"

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

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

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
      // Use window.location for hard redirect instead of router.push
      window.location.href = "/dashboard"
    } else {
      setError("Kullanici adi veya sifre hatali!")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Yesiltas Teknoloji</h1>
          <p className="mt-1 text-sm text-slate-400">Teknik Servis Yonetim Sistemi</p>
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl text-white">Giris Yap</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                    className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                    required
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
                    className="border-slate-700 bg-slate-800 pl-10 pr-10 text-white placeholder:text-slate-500"
                    required
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

              {error && (
                <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username || !password}
              >
                {loading ? "Giris yapiliyor..." : "Giris Yap"}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Demo Hesaplar:</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between rounded bg-slate-800/50 px-2 py-1">
                  <span>admin / admin123</span>
                  <span className="text-blue-400">Yonetici</span>
                </div>
                <div className="flex justify-between rounded bg-slate-800/50 px-2 py-1">
                  <span>teknisyen / tek123</span>
                  <span className="text-green-400">Teknisyen</span>
                </div>
                <div className="flex justify-between rounded bg-slate-800/50 px-2 py-1">
                  <span>kasa / kasa123</span>
                  <span className="text-purple-400">Kasiyer</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-600">
          Yesiltas Teknoloji &copy; 2026 - Tum haklari saklidir.
        </p>
      </div>
    </div>
  )
}
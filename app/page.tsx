"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Lock, User, Eye, EyeOff, Wrench } from "lucide-react"

interface UserAccount {
  username: string
  password: string
  name: string
  role: string
  permissions: string[]
}

const users: UserAccount[] = [
  {
    username: "admin",
    password: "admin123",
    name: "Yönetici",
    role: "Yönetici",
    permissions: ["dashboard", "pos", "service", "customers", "appointments", "inventory", "consumables", "finance", "warranties", "staff", "reports", "suppliers", "settings"]
  },
  {
    username: "teknisyen",
    password: "tek123",
    name: "Teknisyen",
    role: "Teknisyen",
    permissions: ["dashboard", "service", "customers", "appointments", "inventory", "consumables", "warranties"]
  },
  {
    username: "kasa",
    password: "kasa123",
    name: "Kasiyer",
    role: "Kasiyer",
    permissions: ["dashboard", "pos", "customers", "finance", "appointments"]
  }
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setError("")
    setLoading(true)

    const user = users.find(u => u.username === username && u.password === password)

    if (user) {
      localStorage.setItem("yt_user", JSON.stringify({
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }))
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } else {
      setLoading(false)
      setError("Kullanıcı adı veya şifre hatalı!")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white">Yeşiltaş ERP</h1>
          <p className="text-slate-400 mt-2">Teknik Servis Yönetim Sistemi</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full" 
              on
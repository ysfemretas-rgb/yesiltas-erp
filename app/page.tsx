"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Lock, User, Eye, EyeOff, Wrench, ArrowLeft, Mail, KeyRound } from "lucide-react"

interface UserAccount {
  username: string
  password: string
  name: string
  role: string
  permissions: string[]
  email: string
}

const users: UserAccount[] = [
  {
    username: "admin",
    password: "admin123",
    name: "Yonetici",
    role: "Yonetici",
    permissions: ["dashboard", "pos", "service", "customers", "appointments", "inventory", "consumables", "finance", "warranties", "staff", "reports", "suppliers", "settings"],
    email: "admin@yesiltas.com"
  },
  {
    username: "teknisyen",
    password: "tek123",
    name: "Teknisyen",
    role: "Teknisyen",
    permissions: ["dashboard", "service", "customers", "appointments", "inventory", "consumables", "warranties"],
    email: "teknik@yesiltas.com"
  },
  {
    username: "kasa",
    password: "kasa123",
    name: "Kasiyer",
    role: "Kasiyer",
    permissions: ["dashboard", "pos", "customers", "finance", "appointments"],
    email: "kasa@yesiltas.com"
  }
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotStep, setForgotStep] = useState<"email" | "code" | "reset">("email")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

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
      setError("Kullanici adi veya sifre hatali!")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  const handleForgotSubmit = () => {
    setError("")
    
    if (forgotStep === "email") {
      const user = users.find(u => u.email === forgotEmail)
      if (!user) {
        setError("Bu e-posta adresiyle kayitli kullanici bulunamadi!")
        return
      }
      setSuccessMsg("Sifre sifirlama kodu e-posta adresinize gonderildi! (Demo: 123456)")
      setForgotStep("code")
    } else if (forgotStep === "code") {
      if (resetCode !== "123456") {
        setError("Girdiginiz kod hatali!")
        return
      }
      setSuccessMsg("Kod dogrulandi. Yeni sifrenizi olusturun.")
      setForgotStep("reset")
    } else if (forgotStep === "reset") {
      if (newPassword.length < 6) {
        setError("Sifre en az 6 karakter olmali!")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Sifreler eslesmiyor!")
        return
      }
      setSuccessMsg("Sifreniz basariyla degistirildi! Giris yapabilirsiniz.")
      setTimeout(() => {
        setShowForgot(false)
        setForgotStep("email")
        setForgotEmail("")
        setResetCode("")
        setNewPassword("")
        setConfirmPassword("")
        setSuccessMsg("")
      }, 2000)
    }
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Sifre Sifirlama</h1>
            <p className="text-slate-400 mt-2">Hesabiniza tekrar erismek icin sifrenizi sifirlayin</p>
          </div>

          <Card className="border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center text-white">
                {forgotStep === "email" && "E-posta Adresinizi Girin"}
                {forgotStep === "code" && "Dogrulama Kodunu Girin"}
                {forgotStep === "reset" && "Yeni Sifre Olusturun"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-900/50 border border-green-700 text-green-200 p-3 rounded-lg text-sm text-center">
                  {successMsg}
                </div>
              )}

              {forgotStep === "email" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      placeholder="ornek@yesiltas.com"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Kayitli e-posta adresinizi girin</p>
                </div>
              )}

              {forgotStep === "code" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Dogrulama Kodu</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      placeholder="6 haneli kod"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-slate-500">E-postaniza gelen 6 haneli kodu girin (Demo: 123456)</p>
                </div>
              )}

              {forgotStep === "reset" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Yeni Sifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        type="password"
                        placeholder="Yeni sifrenizi girin"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Sifre Tekrar</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        type="password"
                        placeholder="Sifrenizi tekrar girin"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={handleForgotSubmit}
              >
                {forgotStep === "email" && "Kod Gonder"}
                {forgotStep === "code" && "Dogrula"}
                {forgotStep === "reset" && "Sifreyi Degistir"}
              </Button>

              <Button 
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white"
                onClick={() => {
                  setShowForgot(false)
                  setForgotStep("email")
                  setError("")
                  setSuccessMsg("")
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Giris Sayfasina Don
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Yesiltas ERP</h1>
          <p className="text-slate-400 mt-2">Teknik Servis Yonetim Sistemi</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Giris Yap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Kullanici Adi</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  placeholder="Kullanici adinizi girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  className="pl-9 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div></div>
              <button 
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sifremi Unuttum?
              </button>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Giris yapiliyor..." : "Giris Yap"}
            </Button>

            <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-800">
              <p className="font-medium mb-2 text-slate-400">Demo Hesaplar:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">admin / admin123</Badge>
                  <span className="text-xs text-slate-500">(Yonetici)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">teknisyen / tek123</Badge>
                  <span className="text-xs text-slate-500">(Teknisyen)</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-400">kasa / kasa123</Badge>
                  <span className="text-xs text-slate-500">(Kasiyer)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-sm mt-8">
          2024 Yesiltas Teknik Servis. Tum haklari saklidir.
        </p>
      </div>
    </div>
  )
}
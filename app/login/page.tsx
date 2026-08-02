import { Monitor } from "lucide-react"
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Yesiltas Teknoloji</h1>
          <p className="mt-1 text-sm text-slate-400">Teknik Servis Yonetim Sistemi</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-slate-600">
          Yesiltas Teknoloji &copy; 2026 - Tum haklari saklidir.
        </p>
      </div>
    </div>
  )
}
import Image from "next/image"
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image src="/header-logo.png" alt="Yeşiltaş Teknoloji" width={80} height={80} priority />
          </div>
          <h1 className="text-2xl font-bold text-white">Yeşiltaş Teknoloji</h1>
          <p className="mt-1 text-sm text-slate-400">Teknik Servis Yönetim Sistemi</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-slate-600">
          Yeşiltaş Teknoloji &copy; 2026 - Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}

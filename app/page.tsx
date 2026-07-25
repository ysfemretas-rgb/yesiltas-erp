"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/dashboard");
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError("Lütfen e-posta adresinizi girin"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin + "/dashboard/settings" : "",
    });
    if (error) setError(error.message);
    else setResetSent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-48 items-center justify-center">
            <img src="/logo.png" alt="Yeşiltaş Teknoloji" className="h-full w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">Yeşiltaş ERP</CardTitle>
          <CardDescription>Teknik Servis ve Stok Yönetim Sistemi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {resetSent && <p className="text-sm text-green-600">Şifre sıfırlama bağlantısı e-postanıza gönderildi.</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={handleReset} className="text-sm text-primary hover:underline">
              Şifremi unuttum
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(""); setError("");
    if (newPassword !== confirmPassword) { setError("Yeni şifreler eşleşmiyor"); return; }
    if (newPassword.length < 6) { setError("Şifre en az 6 karakter olmalı"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setMessage("Şifreniz başarıyla değiştirildi!"); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
        <p className="text-muted-foreground">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Şifre Değiştir</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2"><Label>Yeni Şifre</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Yeni Şifre (Tekrar)</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sistem Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Uygulama:</strong> Yeşiltaş ERP v1.0</p>
            <p><strong>Geliştirici:</strong> Kimi AI</p>
            <p><strong>Lisans:</strong> Yeşiltaş Teknoloji</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

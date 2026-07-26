"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Settings {
  id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  default_currency: string;
  tax_rate: number;
  logo_url: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("settings").select("*").single();
    if (error) {
      showToast("Ayarlar yüklenirken hata: " + error.message, "error");
    } else {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        company_name: settings.company_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        default_currency: settings.default_currency,
        tax_rate: settings.tax_rate,
        logo_url: settings.logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast("Ayarlar başarıyla kaydedildi!", "success");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner text-emerald-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚙️</div>
        <p>Ayarlar bulunamadı</p>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <h2 className="section-title">⚙️ Sistem Ayarları</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Şirket Bilgileri */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🏢 Şirket Bilgileri
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Şirket Adı</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Adres</label>
              <textarea
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Telefon</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">E-posta</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Finans Ayarları */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            💰 Finans Ayarları
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Varsayılan Para Birimi</label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                className="input-field"
              >
                <option value="TRY">Türk Lirası (TL)</option>
                <option value="USD">Amerikan Doları (USD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">KDV Oranı (%)</label>
              <input
                type="number"
                value={settings.tax_rate}
                onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                className="input-field"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Logo URL</label>
              <input
                type="text"
                value={settings.logo_url || ""}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <span className="spinner" /> : "💾"}
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface UsdRate {
  buying: number;
  selling: number;
  date: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    waitingDevices: 0,
    readyDevices: 0,
    todaySales: 0,
    lowStock: 0,
    lowConsumables: 0,
    todayAppointments: 0,
    totalCustomers: 0,
  });
  const [usdRate, setUsdRate] = useState<UsdRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUsdRate();
    const interval = setInterval(fetchUsdRate, 300000); // Her 5 dakikada güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [
      devicesRes,
      waitingRes,
      readyRes,
      salesRes,
      stockRes,
      consumablesRes,
      appointmentsRes,
      customersRes,
    ] = await Promise.all([
      supabase.from("devices").select("*", { count: "exact", head: true }),
      supabase.from("devices").select("*", { count: "exact", head: true }).eq("status", "bekliyor"),
      supabase.from("devices").select("*", { count: "exact", head: true }).eq("status", "hazir"),
      supabase.from("sales").select("total_amount").gte("created_at", today + "T00:00:00"),
      supabase.from("inventory").select("*").lte("quantity", 5),
      supabase.from("consumables").select("*").lte("quantity", 5),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
      supabase.from("customers").select("*", { count: "exact", head: true }),
    ]);

    const todaySalesTotal = salesRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

    setStats({
      totalDevices: devicesRes.count || 0,
      waitingDevices: waitingRes.count || 0,
      readyDevices: readyRes.count || 0,
      todaySales: todaySalesTotal,
      lowStock: stockRes.data?.length || 0,
      lowConsumables: consumablesRes.data?.length || 0,
      todayAppointments: appointmentsRes.count || 0,
      totalCustomers: customersRes.count || 0,
    });
    setLoading(false);
  };

  const fetchUsdRate = async () => {
    setRateLoading(true);
    try {
      // TCMB günlük kur XML'den çekelim
      const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const usd = xml.querySelector('Currency[CurrencyCode="USD"]');
      if (usd) {
        const buying = parseFloat(usd.querySelector("ForexBuying")?.textContent || "0");
        const selling = parseFloat(usd.querySelector("ForexSelling")?.textContent || "0");
        const date = xml.querySelector("Tarih_Date")?.getAttribute("Tarih") || "";
        setUsdRate({ buying, selling, date });
      }
    } catch (err) {
      console.error("Dolar kuru çekilemedi:", err);
      // Yedek: Sabit değer göster
      setUsdRate({ buying: 47.16, selling: 47.25, date: new Date().toLocaleDateString("tr-TR") });
    }
    setRateLoading(false);
  };

  const statCards = [
    {
      title: "Bekleyen Cihaz",
      value: stats.waitingDevices,
      icon: "⏳",
      color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      link: "/dashboard/devices",
    },
    {
      title: "Hazır Cihaz",
      value: stats.readyDevices,
      icon: "✅",
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      link: "/dashboard/devices",
    },
    {
      title: "Bugün Satış",
      value: stats.todaySales.toLocaleString("tr-TR") + " TL",
      icon: "💰",
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      link: "/dashboard/sales",
    },
    {
      title: "Kritik Stok",
      value: stats.lowStock,
      icon: "📦",
      color: "bg-red-500/10 border-red-500/20 text-red-400",
      link: "/dashboard/inventory",
    },
    {
      title: "Kritik Sarf Malzeme",
      value: stats.lowConsumables,
      icon: "🔧",
      color: "bg-orange-500/10 border-orange-500/20 text-orange-400",
      link: "/dashboard/consumables",
    },
    {
      title: "Bugün Randevu",
      value: stats.todayAppointments,
      icon: "📅",
      color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      link: "/dashboard/appointments",
    },
    {
      title: "Toplam Cihaz",
      value: stats.totalDevices,
      icon: "📱",
      color: "bg-slate-500/10 border-slate-500/20 text-slate-400",
      link: "/dashboard/devices",
    },
    {
      title: "Toplam Müşteri",
      value: stats.totalCustomers,
      icon: "👥",
      color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      link: "/dashboard/customers",
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">🏠 Ana Sayfa</h2>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Canlı Dolar Kuru */}
      <div className="card bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💵</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Canlı Dolar Kuru (TCMB)</h3>
              <p className="text-xs text-slate-400">
                {rateLoading ? "Yükleniyor..." : `Güncelleme: ${usdRate?.date || "-"}`}
              </p>
            </div>
          </div>
          {rateLoading ? (
            <div className="flex items-center gap-2">
              <div className="spinner text-emerald-400" />
              <span className="text-sm text-slate-400">Yükleniyor...</span>
            </div>
          ) : usdRate ? (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400">Alış</p>
                <p className="text-xl font-bold text-emerald-400">{usdRate.buying.toFixed(4)} TL</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Satış</p>
                <p className="text-xl font-bold text-blue-400">{usdRate.selling.toFixed(4)} TL</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* İstatistik Kartları */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <Link key={card.title} href={card.link} className="block">
              <div className={`card ${card.color} hover:scale-[1.02] transition-transform cursor-pointer`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className="text-xs opacity-80">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Hızlı Erişim */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">⚡ Hızlı Erişim</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { href: "/dashboard/devices", label: "Yeni Cihaz", icon: "📱", color: "bg-blue-500/10 text-blue-400" },
            { href: "/dashboard/sales", label: "Yeni Satış", icon: "💰", color: "bg-emerald-500/10 text-emerald-400" },
            { href: "/dashboard/customers", label: "Yeni Müşteri", icon: "👤", color: "bg-purple-500/10 text-purple-400" },
            { href: "/dashboard/consumables", label: "Sarf Malzeme", icon: "🔧", color: "bg-orange-500/10 text-orange-400" },
            { href: "/dashboard/appointments", label: "Randevu", icon: "📅", color: "bg-amber-500/10 text-amber-400" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors ${item.color}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

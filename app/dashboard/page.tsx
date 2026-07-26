"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    devicesWaiting: 0,
    devicesReady: 0,
    todaySales: 0,
    lowStock: 0,
  });
  const [recentDevices, setRecentDevices] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentDevices();
  }, []);

  const fetchStats = async () => {
    const { count: waiting } = await supabase.from("devices").select("*", { count: "exact", head: true }).eq("status", "Bekliyor");
    const { count: ready } = await supabase.from("devices").select("*", { count: "exact", head: true }).eq("status", "Hazir");
    const { count: low } = await supabase.from("inventory").select("*", { count: "exact", head: true }).lte("quantity", "min_stock");

    const today = new Date().toISOString().split("T")[0];
    const { data: sales } = await supabase.from("sales").select("amount").gte("created_at", today);
    const todaySales = sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    setStats({
      devicesWaiting: waiting || 0,
      devicesReady: ready || 0,
      todaySales: todaySales,
      lowStock: low || 0,
    });
  };

  const fetchRecentDevices = async () => {
    const { data } = await supabase
      .from("devices")
      .select("*, customers(name)")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentDevices(data || []);
  };

  const statusColors: Record<string, string> = {
    "Bekliyor": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Tamirde": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Hazir": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Teslim Edildi": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Iptal": "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const cards = [
    { label: "Bekleyen Cihaz", value: stats.devicesWaiting, href: "/dashboard/devices", icon: "📱", color: "text-amber-400" },
    { label: "Hazir Cihaz", value: stats.devicesReady, href: "/dashboard/devices", icon: "✅", color: "text-emerald-400" },
    { label: "Bugun Satis", value: stats.todaySales.toLocaleString("tr-TR") + " TL", href: "/dashboard/sales", icon: "💰", color: "text-emerald-400" },
    { label: "Kritik Stok", value: stats.lowStock, href: "/dashboard/inventory", icon: "⚠️", color: "text-red-400" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Ana Sayfa</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.href + card.label} href={card.href}>
            <div className="card-hover">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{card.icon}</div>
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Son Cihazlar</h3>
          <Link href="/dashboard/devices" className="text-sm text-emerald-400 hover:text-emerald-300">Tumunu Gor →</Link>
        </div>
        {recentDevices.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Henüz cihaz kaydi yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="table-header">Musteri</th>
                  <th className="table-header">Cihaz</th>
                  <th className="table-header">Sikayet</th>
                  <th className="table-header">Durum</th>
                  <th className="table-header">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-700/30">
                    <td className="table-cell font-medium">{d.customers?.name || "-"}</td>
                    <td className="table-cell">{d.brand} {d.model}</td>
                    <td className="table-cell max-w-xs truncate">{d.complaint}</td>
                    <td className="table-cell">
                      <span className={`badge border ${statusColors[d.status] || "bg-slate-700 text-slate-300"}`}>{d.status}</span>
                    </td>
                    <td className="table-cell text-slate-500">{new Date(d.created_at).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

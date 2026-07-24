"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { title: "Bugünkü Servis", value: "12", icon: Wrench, trend: "+2" },
  { title: "Aktif Müşteri", value: "248", icon: Users, trend: "+5" },
  { title: "Düşük Stok", value: "8", icon: Package, trend: "-3" },
  { title: "Günlük Ciro", value: "₺4,250", icon: DollarSign, trend: "+12%" },
];

const recentServices = [
  { id: "SR-2026-0001", customer: "Ahmet Yılmaz", device: "iPhone 14 Pro", status: "Tamir Ediliyor", statusColor: "secondary" },
  { id: "SR-2026-0002", customer: "Mehmet Kaya", device: "Samsung S23", status: "Hazır", statusColor: "default" },
  { id: "SR-2026-0003", customer: "Ayşe Demir", device: "Xiaomi 13", status: "Bekliyor", statusColor: "outline" },
  { id: "SR-2026-0004", customer: "Fatma Şahin", device: "iPhone 13", status: "Teslim Edildi", statusColor: "default" },
];

const lowStock = [
  { name: "iPhone 14 Pro Ekran", stock: 2, min: 5 },
  { name: "Samsung S23 Batarya", stock: 1, min: 3 },
  { name: "Xiaomi 13 Arka Kapak", stock: 0, min: 5 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ana Sayfa</h2>
        <p className="text-muted-foreground">İşletmenizin günlük özeti</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend} son 24 saat
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Servis Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{s.customer}</p>
                  <p className="text-sm text-muted-foreground">{s.device} — {s.id}</p>
                </div>
                <Badge variant={s.statusColor as any}>{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Düşük Stok Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Min: {item.min} adet</p>
                </div>
                <Badge variant={item.stock === 0 ? "destructive" : "secondary"}>
                  {item.stock} adet
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-bold tracking-tight">Raporlar</h2><p className="text-muted-foreground">Detaylı raporlar ve analizler</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Günlük Satış Raporu", desc: "Bugünkü satış ve gelir özeti" },
          { title: "Aylık Servis Raporu", desc: "Bu ay yapılan tamirler" },
          { title: "Stok Durum Raporu", desc: "Mevcut stok ve eksikler" },
          { title: "Müşteri Raporu", desc: "Aktif müşteri ve cihazlar" },
          { title: "Finansal Özet", desc: "Gelir, gider ve kar marjı" },
          { title: "Ortaklık Raporu", desc: "Harcama dağılımı" },
        ].map((r, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{r.title}</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
              <Button variant="outline" size="sm" className="w-full"><Download className="h-4 w-4 mr-2" /> İndir (PDF)</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

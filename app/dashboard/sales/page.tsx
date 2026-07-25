"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ShoppingCart } from "lucide-react";

export default function SalesPage() {
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState([
    { id: "SAT-2026-0001", customer: "Ahmet Yılmaz", items: "iPhone 14 Pro Ekran", total: 3200, status: "Tamamlandı" },
    { id: "SAT-2026-0002", customer: "Mehmet Kaya", items: "Samsung S23 Batarya", total: 850, status: "Bekliyor" },
  ]);
  const [form, setForm] = useState({ customer: "", items: "", total: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSales([...sales, { id: `SAT-2026-${String(sales.length + 1).padStart(4, "0")}`, customer: form.customer, items: form.items, total: Number(form.total) || 0, status: "Bekliyor" }]);
    setOpen(false); setForm({ customer: "", items: "", total: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Satış</h2><p className="text-muted-foreground">Satış işlemlerini yönetin</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni Satış</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Satış</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Müşteri</Label><Input value={form.customer} onChange={(e) => setForm({...form, customer: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Ürünler</Label><Input value={form.items} onChange={(e) => setForm({...form, items: e.target.value})} placeholder="iPhone 14 Pro Ekran x1" required /></div>
              <div className="space-y-2"><Label>Toplam Tutar (₺)</Label><Input type="number" value={form.total} onChange={(e) => setForm({...form, total: e.target.value})} required /></div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {sales.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium">{s.customer}</p><p className="text-sm text-muted-foreground">{s.items} — {s.id}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className="font-medium">₺{s.total.toLocaleString()}</p></div>
                <Badge variant={s.status === "Tamamlandı" ? "default" : "outline"}>{s.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

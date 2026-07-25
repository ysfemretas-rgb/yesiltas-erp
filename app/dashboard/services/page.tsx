"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wrench, Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  "Bekliyor": "outline", "İnceleniyor": "secondary", "Onay Bekliyor": "default",
  "Tamir Ediliyor": "destructive", "Kalite Kontrol": "secondary", "Hazır": "default", "Teslim Edildi": "default",
};

export default function ServicesPage() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([
    { id: "SR-2026-0001", customer: "Ahmet Yılmaz", device: "iPhone 14 Pro", status: "Tamir Ediliyor", price: 3500, paid: 1000 },
    { id: "SR-2026-0002", customer: "Mehmet Kaya", device: "Samsung S23", status: "Hazır", price: 1200, paid: 1200 },
    { id: "SR-2026-0003", customer: "Ayşe Demir", device: "Xiaomi 13", status: "Bekliyor", price: 800, paid: 0 },
  ]);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", device_brand: "", device_model: "", device_imei: "", problem: "", estimated_price: "", advance_payment: "", warranty_months: "3" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServices([{ id: `SR-2026-${String(services.length + 1).padStart(4, "0")}`, customer: form.customer_name, device: `${form.device_brand} ${form.device_model}`, status: "Bekliyor", price: Number(form.estimated_price) || 0, paid: Number(form.advance_payment) || 0 }, ...services]);
    setOpen(false);
    setForm({ customer_name: "", customer_phone: "", device_brand: "", device_model: "", device_imei: "", problem: "", estimated_price: "", advance_payment: "", warranty_months: "3" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Teknik Servis</h2><p className="text-muted-foreground">Servis kayıtlarını yönetin</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni Servis</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Yeni Servis Kaydı</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Müşteri Adı</Label><Input value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})} placeholder="05XX XXX XX XX" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Marka</Label><Input value={form.device_brand} onChange={(e) => setForm({...form, device_brand: e.target.value})} placeholder="Apple" required /></div>
                <div className="space-y-2"><Label>Model</Label><Input value={form.device_model} onChange={(e) => setForm({...form, device_model: e.target.value})} placeholder="iPhone 14 Pro" required /></div>
              </div>
              <div className="space-y-2"><Label>IMEI / Seri No</Label><Input value={form.device_imei} onChange={(e) => setForm({...form, device_imei: e.target.value})} /></div>
              <div className="space-y-2"><Label>Arıza Açıklaması</Label><Input value={form.problem} onChange={(e) => setForm({...form, problem: e.target.value})} placeholder="Ekran kırık..." /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Tahmini Fiyat (₺)</Label><Input type="number" value={form.estimated_price} onChange={(e) => setForm({...form, estimated_price: e.target.value})} /></div>
                <div className="space-y-2"><Label>Kapora (₺)</Label><Input type="number" value={form.advance_payment} onChange={(e) => setForm({...form, advance_payment: e.target.value})} /></div>
                <div className="space-y-2"><Label>Garanti (Ay)</Label><Input type="number" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} /></div>
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Wrench className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium">{s.customer}</p><p className="text-sm text-muted-foreground">{s.device} — {s.id}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className="font-medium">₺{s.price.toLocaleString()}</p><p className="text-xs text-muted-foreground">Alınan: ₺{s.paid.toLocaleString()}</p></div>
                <Badge variant={statusColors[s.status] as any || "outline"}>{s.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

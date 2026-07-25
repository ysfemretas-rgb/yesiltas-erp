"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Phone, Mail } from "lucide-react";

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([
    { id: 1, name: "Ahmet Yılmaz", phone: "0532 123 45 67", email: "ahmet@email.com", devices: 2 },
    { id: 2, name: "Mehmet Kaya", phone: "0533 987 65 43", email: "", devices: 1 },
    { id: 3, name: "Ayşe Demir", phone: "0535 456 78 90", email: "ayse@email.com", devices: 3 },
  ]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomers([...customers, { id: customers.length + 1, ...form, devices: 0 }]);
    setOpen(false); setForm({ name: "", phone: "", email: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Müşteriler</h2><p className="text-muted-foreground">Müşteri kayıtlarını yönetin</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni Müşteri</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Müşteri</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Ad Soyad</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="05XX XXX XX XX" required /></div>
              <div className="space-y-2"><Label>E-posta (isteğe bağlı)</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {customers.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-lg">{c.name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                </div>
              </div>
              <div className="text-right"><p className="text-2xl font-bold">{c.devices}</p><p className="text-xs text-muted-foreground">Cihaz</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Briefcase } from "lucide-react";

export default function PartnersPage() {
  const [open, setOpen] = useState(false);
  const [investments, setInvestments] = useState([
    { id: 1, partner: "Yusuf", item: "Lehim İstasyonu", amount: 2500, date: "15.07.2026" },
    { id: 2, partner: "Ortağınız", item: "Masa ve Sandalye", amount: 800, date: "10.07.2026" },
    { id: 3, partner: "Yusuf", item: "Bilgisayar Monitörü", amount: 1200, date: "20.07.2026" },
  ]);
  const [form, setForm] = useState({ partner: "", item: "", amount: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInvestments([...investments, { id: investments.length + 1, partner: form.partner, item: form.item, amount: Number(form.amount) || 0, date: new Date().toLocaleDateString("tr-TR") }]);
    setOpen(false); setForm({ partner: "", item: "", amount: "" });
  };

  const totalYusuf = investments.filter(i => i.partner === "Yusuf").reduce((a, b) => a + b.amount, 0);
  const totalPartner = investments.filter(i => i.partner !== "Yusuf").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Ortaklık</h2><p className="text-muted-foreground">Ortaklık ve demirbaş takibi</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni Harcama</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Ortak Harcaması</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Ortak Adı</Label><Input value={form.partner} onChange={(e) => setForm({...form, partner: e.target.value})} placeholder="Yusuf veya Ortağınız" required /></div>
              <div className="space-y-2"><Label>Alınan Ürün / Hizmet</Label><Input value={form.item} onChange={(e) => setForm({...form, item: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Tutar (₺)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required /></div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Yusuf Toplam</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₺{totalYusuf.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Ortağınız Toplam</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₺{totalPartner.toLocaleString()}</div></CardContent></Card>
      </div>
      <div className="grid gap-4">
        {investments.map((i) => (
          <Card key={i.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Briefcase className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium">{i.item}</p><p className="text-sm text-muted-foreground">{i.partner} — {i.date}</p></div>
              </div>
              <div className="text-right"><p className="font-bold">₺{i.amount.toLocaleString()}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

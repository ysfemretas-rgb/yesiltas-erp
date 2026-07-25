"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function FinancePage() {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 1, desc: "Servis geliri - Ahmet Yılmaz", amount: 3500, type: "income", date: "25.07.2026" },
    { id: 2, desc: "Parça alımı - Alibaba", amount: 1200, type: "expense", date: "24.07.2026" },
    { id: 3, desc: "Satış - Samsung S23 Batarya", amount: 850, type: "income", date: "24.07.2026" },
  ]);
  const [form, setForm] = useState({ desc: "", amount: "", type: "income" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactions([...transactions, { id: transactions.length + 1, desc: form.desc, amount: Number(form.amount) || 0, type: form.type, date: new Date().toLocaleDateString("tr-TR") }]);
    setOpen(false); setForm({ desc: "", amount: "", type: "income" });
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Finans</h2><p className="text-muted-foreground">Kasa ve finansal işlemler</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni İşlem</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Finansal İşlem</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Açıklama</Label><Input value={form.desc} onChange={(e) => setForm({...form, desc: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Tutar (₺)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required /></div>
              <div className="space-y-2"><Label>İşlem Tipi</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="income">Gelir</option><option value="expense">Gider</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle><ArrowUpRight className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₺{totalIncome.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Toplam Gider</CardTitle><ArrowDownRight className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">₺{totalExpense.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Kasa Bakiye</CardTitle><DollarSign className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{balance.toLocaleString()}</div></CardContent></Card>
      </div>
      <div className="grid gap-4">
        {transactions.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="font-medium">{t.desc}</p><p className="text-sm text-muted-foreground">{t.date}</p></div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>{t.type === "income" ? "+" : "-"}₺{t.amount.toLocaleString()}</span>
                <Badge variant={t.type === "income" ? "default" : "destructive"}>{t.type === "income" ? "Gelir" : "Gider"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

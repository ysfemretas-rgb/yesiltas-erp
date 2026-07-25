"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package, AlertTriangle } from "lucide-react";

export default function InventoryPage() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { id: 1, name: "iPhone 14 Pro Ekran", sku: "YST-0001", stock: 2, min: 5, price: 3200 },
    { id: 2, name: "Samsung S23 Batarya", sku: "YST-0002", stock: 1, min: 3, price: 850 },
    { id: 3, name: "Xiaomi 13 Arka Kapak", sku: "YST-0003", stock: 0, min: 5, price: 450 },
    { id: 4, name: "iPhone 13 Batarya", sku: "YST-0004", stock: 12, min: 5, price: 700 },
  ]);
  const [form, setForm] = useState({ name: "", sku: "", stock: "", min: "", price: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setItems([...items, { id: items.length + 1, name: form.name, sku: form.sku || `YST-${String(items.length + 1).padStart(4, "0")}`, stock: Number(form.stock) || 0, min: Number(form.min) || 5, price: Number(form.price) || 0 }]);
    setOpen(false); setForm({ name: "", sku: "", stock: "", min: "", price: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Stok Yönetimi</h2><p className="text-muted-foreground">Ürün ve stok takibi</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Yeni Ürün</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Ürün Ekle</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Ürün Adı</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>SKU / Barkod</Label><Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} placeholder="Otomatik oluşturulur" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Min. Stok</Label><Input type="number" value={form.min} onChange={(e) => setForm({...form, min: e.target.value})} /></div>
                <div className="space-y-2"><Label>Fiyat (₺)</Label><Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} /></div>
              </div>
              <Button type="submit" className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.stock <= item.min ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  {item.stock <= item.min ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Package className="h-5 w-5 text-primary" />}
                </div>
                <div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.sku} — ₺{item.price.toLocaleString()}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><p className={`text-2xl font-bold ${item.stock <= item.min ? 'text-destructive' : ''}`}>{item.stock}</p><p className="text-xs text-muted-foreground">adet</p></div>
                {item.stock <= item.min && <Badge variant="destructive">Düşük</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

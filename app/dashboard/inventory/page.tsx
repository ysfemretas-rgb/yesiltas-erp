"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Item {
  id: string;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  created_at: string;
}

const categories = ["Ekran", "Batarya", "Sarj Soketi", "Kasa", "Kamera", "Aksesuar", "Diger"];
const brands = ["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Realme", "General Mobile", "Genel", "Diger"];

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({ name: "", category: "Ekran", brand: "Apple", quantity: "", unit: "adet", purchase_price: "", sale_price: "", min_stock: "5" });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("inventory").select("*").order("created_at", { ascending: false });
    if (error) showToast("Stok yuklenirken hata", "error");
    else setItems(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, quantity: parseInt(formData.quantity) || 0, purchase_price: parseFloat(formData.purchase_price) || 0, sale_price: parseFloat(formData.sale_price) || 0, min_stock: parseInt(formData.min_stock) || 5 };
    if (editingItem) {
      const { error } = await supabase.from("inventory").update(payload).eq("id", editingItem.id);
      if (error) showToast("Guncelleme basarisiz", "error");
      else { showToast("Urun guncellendi", "success"); resetForm(); setShowForm(false); fetchItems(); }
    } else {
      const { error } = await supabase.from("inventory").insert([payload]);
      if (error) showToast("Ekleme basarisiz: " + error.message, "error");
      else { showToast("Urun eklendi", "success"); resetForm(); setShowForm(false); fetchItems(); }
    }
  };

  const resetForm = () => { setFormData({ name: "", category: "Ekran", brand: "Apple", quantity: "", unit: "adet", purchase_price: "", sale_price: "", min_stock: "5" }); setEditingItem(null); };
  const handleEdit = (item: Item) => { setEditingItem(item); setFormData({ name: item.name, category: item.category, brand: item.brand, quantity: item.quantity.toString(), unit: item.unit, purchase_price: item.purchase_price.toString(), sale_price: item.sale_price.toString(), min_stock: item.min_stock.toString() }); setShowForm(true); };
  const handleDelete = async (id: string) => { if (!confirm("Silmek istediginize emin misiniz?")) return; const { error } = await supabase.from("inventory").delete().eq("id", id); if (error) showToast("Silme basarisiz", "error"); else { showToast("Silindi", "success"); fetchItems(); } };

  const filtered = items.filter(i => (i.name + i.brand + i.category).toLowerCase().includes(searchTerm.toLowerCase()));
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const lowStock = items.filter(i => i.quantity <= i.min_stock);

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Stok</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">{showForm ? "Iptal" : "+ Yeni Urun"}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-amber-500/10 border-amber-500/30"><p className="text-sm text-amber-400">Toplam Stok Degeri</p><p className="text-2xl font-bold text-amber-300">{totalValue.toLocaleString("tr-TR")} TL</p></div>
        <div className="card bg-blue-500/10 border-blue-500/30"><p className="text-sm text-blue-400">Urun Cesidi</p><p className="text-2xl font-bold text-blue-300">{items.length}</p></div>
        <div className="card bg-red-500/10 border-red-500/30"><p className="text-sm text-red-400">Kritik Stok</p><p className="text-2xl font-bold text-red-300">{lowStock.length}</p></div>
      </div>

      {lowStock.length > 0 && (
        <div className="card border-red-500/30 bg-red-500/5 mb-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">⚠️ Kritik Stok Uyari</h3>
          <div className="flex flex-wrap gap-2">{lowStock.map(i => <span key={i.id} className="badge bg-red-500/20 text-red-300 border border-red-500/30">{i.name} ({i.quantity} {i.unit})</span>)}</div>
        </div>
      )}

      <input type="text" placeholder="Ara (urun adi, marka, kategori)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field mb-6" />

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingItem ? "Urun Duzenle" : "Yeni Urun"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Urun Adi *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="iPhone 15 Pro Ekran" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Marka</label><select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="input-field">{brands.map(b => <option key={b}>{b}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Miktar *</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" placeholder="10" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Alis Fiyati (TL)</label><input type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="input-field" placeholder="8000" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Satis Fiyati (TL)</label><input type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} className="input-field" placeholder="12000" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Kritik Stok Seviyesi</label><input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} className="input-field" placeholder="5" /></div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">{editingItem ? "Guncelle" : "Kaydet"}</button><button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary">Iptal</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-slate-500">Yukleniyor...</div> :
       filtered.length === 0 ? <div className="card text-center py-12 text-slate-500"><div className="text-4xl mb-3">📦</div><p>Henüz urun bulunmuyor.</p></div> :
       <div className="card overflow-x-auto">
         <table className="w-full min-w-[700px]">
           <thead><tr className="border-b border-slate-700"><th className="table-header">Urun</th><th className="table-header">Kategori</th><th className="table-header">Marka</th><th className="table-header">Miktar</th><th className="table-header">Alis</th><th className="table-header">Satis</th><th className="table-header">Islem</th></tr></thead>
           <tbody>{filtered.map((item) => (<tr key={item.id} className="hover:bg-slate-700/30"><td className="table-cell font-medium text-white">{item.name}</td><td className="table-cell"><span className="badge bg-slate-700 text-slate-300">{item.category}</span></td><td className="table-cell">{item.brand}</td><td className="table-cell"><span className={`font-bold ${item.quantity <= item.min_stock ? "text-red-400" : "text-emerald-400"}`}>{item.quantity}</span> <span className="text-slate-500">{item.unit}</span></td><td className="table-cell">{item.purchase_price.toLocaleString("tr-TR")} TL</td><td className="table-cell text-emerald-400">{item.sale_price.toLocaleString("tr-TR")} TL</td><td className="table-cell"><div className="flex gap-2"><button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 text-sm">Duzenle</button><button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm">Sil</button></div></td></tr>))}</tbody>
         </table>
       </div>}
    </div>
  );
}

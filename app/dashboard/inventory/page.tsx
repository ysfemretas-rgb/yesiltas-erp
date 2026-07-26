"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  category: string;
  created_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "adet",
    unit_price: "",
    category: "",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Stok yuklenirken hata olustu", "error");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      quantity: parseInt(formData.quantity) || 0,
      unit_price: parseFloat(formData.unit_price) || 0,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("inventory")
        .update(payload)
        .eq("id", editingItem.id);

      if (error) {
        showToast("Guncelleme basarisiz", "error");
      } else {
        showToast("Urun guncellendi", "success");
        setEditingItem(null);
        resetForm();
        setShowForm(false);
        fetchItems();
      }
    } else {
      const { error } = await supabase.from("inventory").insert([payload]);

      if (error) {
        showToast("Ekleme basarisiz", "error");
      } else {
        showToast("Urun eklendi", "success");
        resetForm();
        setShowForm(false);
        fetchItems();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", quantity: "", unit: "adet", unit_price: "", category: "" });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      unit_price: item.unit_price.toString(),
      category: item.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu urunu silmek istediginize emin misiniz?")) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      showToast("Silme basarisiz", "error");
    } else {
      showToast("Urun silindi", "success");
      fetchItems();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div>
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Stok</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Iptal" : "+ Yeni Urun"}
        </button>
      </div>

      <div className="card bg-amber-50 border-amber-200 mb-6">
        <p className="text-sm text-amber-600">Toplam Stok Degeri</p>
        <p className="text-2xl font-bold text-amber-700">{totalValue.toLocaleString("tr-TR")} TL</p>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? "Urun Duzenle" : "Yeni Urun"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Urun Adi</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Cimento" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Miktar</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" placeholder="100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birim</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input-field">
                <option>adet</option>
                <option>kg</option>
                <option>ton</option>
                <option>metre</option>
                <option>m2</option>
                <option>m3</option>
                <option>litre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birim Fiyat (TL)</label>
              <input type="number" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} className="input-field" placeholder="250" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" placeholder="Insaat Malzemesi" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editingItem ? "Guncelle" : "Kaydet"}</button>
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Iptal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">Henüz urun bulunmuyor.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header">Urun Adi</th>
                <th className="table-header">Miktar</th>
                <th className="table-header">Birim</th>
                <th className="table-header">Birim Fiyat</th>
                <th className="table-header">Toplam Deger</th>
                <th className="table-header">Kategori</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell">{item.quantity}</td>
                  <td className="table-cell">{item.unit}</td>
                  <td className="table-cell">{item.unit_price.toLocaleString("tr-TR")} TL</td>
                  <td className="table-cell font-medium">{(item.quantity * item.unit_price).toLocaleString("tr-TR")} TL</td>
                  <td className="table-cell">{item.category}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Duzenle</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

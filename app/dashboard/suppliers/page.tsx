"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Supplier { id: string; name: string; phone: string; email: string; address: string; created_at: string; }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { showToast, ToastContainer } = useToast();
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) showToast("Tedarikciler yuklenirken hata", "error");
    else setSuppliers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      const { error } = await supabase.from("suppliers").update(formData).eq("id", editingSupplier.id);
      if (error) showToast("Guncelleme basarisiz", "error");
      else { showToast("Tedarikci guncellendi", "success"); resetForm(); setShowForm(false); fetchSuppliers(); }
    } else {
      const { error } = await supabase.from("suppliers").insert([formData]);
      if (error) showToast("Ekleme basarisiz: " + error.message, "error");
      else { showToast("Tedarikci eklendi", "success"); resetForm(); setShowForm(false); fetchSuppliers(); }
    }
  };

  const resetForm = () => { setFormData({ name: "", phone: "", email: "", address: "" }); setEditingSupplier(null); };
  const handleEdit = (s: Supplier) => { setEditingSupplier(s); setFormData({ name: s.name, phone: s.phone, email: s.email, address: s.address }); setShowForm(true); };
  const handleDelete = async (id: string) => { if (!confirm("Silmek istediginize emin misiniz?")) return; const { error } = await supabase.from("suppliers").delete().eq("id", id); if (error) showToast("Silme basarisiz", "error"); else { showToast("Silindi", "success"); fetchSuppliers(); } };

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Tedarikciler</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">{showForm ? "Iptal" : "+ Yeni Tedarikci"}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingSupplier ? "Tedarikci Duzenle" : "Yeni Tedarikci"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Firma Adi *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Tekno Parca Toptan" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Telefon</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="0212 123 45 67" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">E-posta</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="info@firma.com" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Adres</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" placeholder="Istanbul, Merter" /></div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">{editingSupplier ? "Guncelle" : "Kaydet"}</button><button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary">Iptal</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="text-center py-12 text-slate-500">Yukleniyor...</div> :
       suppliers.length === 0 ? <div className="card text-center py-12 text-slate-500"><div className="text-4xl mb-3">🏭</div><p>Henüz tedarikci bulunmuyor.</p></div> :
       <div className="card overflow-x-auto">
         <table className="w-full min-w-[600px]">
           <thead><tr className="border-b border-slate-700"><th className="table-header">Firma Adi</th><th className="table-header">Telefon</th><th className="table-header">E-posta</th><th className="table-header">Adres</th><th className="table-header">Islemler</th></tr></thead>
           <tbody>{suppliers.map((s) => (<tr key={s.id} className="hover:bg-slate-700/30"><td className="table-cell font-medium text-white">{s.name}</td><td className="table-cell">{s.phone}</td><td className="table-cell">{s.email}</td><td className="table-cell">{s.address}</td><td className="table-cell"><div className="flex gap-2"><button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 text-sm">Duzenle</button><button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-sm">Sil</button></div></td></tr>))}</tbody>
         </table>
       </div>}
    </div>
  );
}

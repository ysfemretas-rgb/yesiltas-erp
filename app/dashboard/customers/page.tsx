"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Customer { id: string; name: string; phone: string; email: string; address: string; created_at: string; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast, ToastContainer } = useToast();
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) showToast("Musteriler yuklenirken hata: " + error.message, "error");
    else setCustomers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      const { error } = await supabase.from("customers").update(formData).eq("id", editingCustomer.id);
      if (error) showToast("Guncelleme basarisiz: " + error.message, "error");
      else { showToast("Musteri guncellendi", "success"); resetForm(); setShowForm(false); fetchCustomers(); }
    } else {
      const { error } = await supabase.from("customers").insert([formData]);
      if (error) showToast("Ekleme basarisiz: " + error.message, "error");
      else { showToast("Musteri eklendi", "success"); resetForm(); setShowForm(false); fetchCustomers(); }
    }
  };

  const resetForm = () => { setFormData({ name: "", phone: "", email: "", address: "" }); setEditingCustomer(null); };
  const handleEdit = (c: Customer) => { setEditingCustomer(c); setFormData({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setShowForm(true); };
  const handleDelete = async (id: string) => { if (!confirm("Bu musteriyi silmek istediginize emin misiniz?")) return; const { error } = await supabase.from("customers").delete().eq("id", id); if (error) showToast("Silme basarisiz: " + error.message, "error"); else { showToast("Musteri silindi", "success"); fetchCustomers(); } };
  const filtered = customers.filter(c => (c.name + c.phone + c.email).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Musteriler</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">{showForm ? "Iptal" : "+ Yeni Musteri"}</button>
      </div>
      <input type="text" placeholder="Ara (ad, telefon, e-posta)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field mb-6" />
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingCustomer ? "Musteri Duzenle" : "Yeni Musteri"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Ad Soyad *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Ahmet Yilmaz" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Telefon *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="05XX XXX XX XX" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">E-posta</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="ornek@email.com" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1">Adres</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" placeholder="Istanbul, Kadikoy" /></div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">{editingCustomer ? "Guncelle" : "Kaydet"}</button><button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary">Iptal</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="text-center py-12 text-slate-500">Yukleniyor...</div> : filtered.length === 0 ? <div className="card text-center py-12 text-slate-500"><div className="text-4xl mb-3">👥</div><p>Henüz musteri bulunmuyor.</p></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-slate-700"><th className="table-header">Ad Soyad</th><th className="table-header">Telefon</th><th className="table-header">E-posta</th><th className="table-header">Adres</th><th className="table-header">Islemler</th></tr></thead>
            <tbody>{filtered.map((c) => (<tr key={c.id} className="hover:bg-slate-700/30"><td className="table-cell font-medium text-white">{c.name}</td><td className="table-cell">{c.phone}</td><td className="table-cell">{c.email}</td><td className="table-cell">{c.address}</td><td className="table-cell"><div className="flex gap-2"><button onClick={() => handleEdit(c)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Duzenle</button><button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Sil</button></div></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Transaction {
  id: string;
  type: "gelir" | "gider";
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

const incomeCategories = ["Satis", "Servis", "Diger"];
const expenseCategories = ["Kira", "Elektrik", "Su", "Internet", "Maas", "Malzeme", "Tedarik", "Vergi", "Diger"];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({ type: "gelir" as "gelir" | "gider", category: "Satis", description: "", amount: "", date: "" });

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    if (error) showToast("Islemler yuklenirken hata", "error");
    else setTransactions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, amount: parseFloat(formData.amount) || 0, date: formData.date || new Date().toISOString().split("T")[0] };
    const { error } = await supabase.from("transactions").insert([payload]);
    if (error) showToast("Ekleme basarisiz: " + error.message, "error");
    else { showToast("Islem kaydedildi", "success"); setFormData({ type: "gelir", category: "Satis", description: "", amount: "", date: "" }); setShowForm(false); fetchTransactions(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediginize emin misiniz?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) showToast("Silme basarisiz", "error");
    else { showToast("Silindi", "success"); fetchTransactions(); }
  };

  const totalIncome = transactions.filter(t => t.type === "gelir").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "gider").reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = filterType === "Tumu" ? transactions : transactions.filter(t => t.type === filterType.toLowerCase());

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Kasa</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Iptal" : "+ Yeni Islem"}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-emerald-500/10 border-emerald-500/30"><p className="text-sm text-emerald-400">Toplam Gelir</p><p className="text-2xl font-bold text-emerald-300">{totalIncome.toLocaleString("tr-TR")} TL</p></div>
        <div className="card bg-red-500/10 border-red-500/30"><p className="text-sm text-red-400">Toplam Gider</p><p className="text-2xl font-bold text-red-300">{totalExpense.toLocaleString("tr-TR")} TL</p></div>
        <div className="card bg-blue-500/10 border-blue-500/30"><p className="text-sm text-blue-400">Bakiye</p><p className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>{balance.toLocaleString("tr-TR")} TL</p></div>
      </div>

      <div className="flex gap-2 mb-6">
        {["Tumu", "Gelir", "Gider"].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === t ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>{t}</button>
        ))}
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Yeni Islem</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tip</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "gelir" | "gider", category: e.target.value === "gelir" ? "Satis" : "Kira" })} className="input-field">
                <option value="gelir">Gelir</option><option value="gider">Gider</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                {(formData.type === "gelir" ? incomeCategories : expenseCategories).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Aciklama *</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" placeholder="Aylik kira odemesi" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (TL) *</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" placeholder="5000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tarih</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Iptal</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-slate-500">Yukleniyor...</div> :
       filtered.length === 0 ? <div className="card text-center py-12 text-slate-500"><div className="text-4xl mb-3">💳</div><p>Henüz islem bulunmuyor.</p></div> :
       <div className="card overflow-x-auto">
         <table className="w-full min-w-[600px]">
           <thead><tr className="border-b border-slate-700"><th className="table-header">Tarih</th><th className="table-header">Tip</th><th className="table-header">Kategori</th><th className="table-header">Aciklama</th><th className="table-header">Tutar</th><th className="table-header">Islem</th></tr></thead>
           <tbody>{filtered.map((t) => (<tr key={t.id} className="hover:bg-slate-700/30"><td className="table-cell text-slate-500">{new Date(t.date).toLocaleDateString("tr-TR")}</td><td className="table-cell"><span className={`badge ${t.type === "gelir" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>{t.type === "gelir" ? "Gelir" : "Gider"}</span></td><td className="table-cell">{t.category}</td><td className="table-cell">{t.description}</td><td className={`table-cell font-medium ${t.type === "gelir" ? "text-emerald-400" : "text-red-400"}`}>{t.amount.toLocaleString("tr-TR")} TL</td><td className="table-cell"><button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 text-sm">Sil</button></td></tr>))}</tbody>
         </table>
       </div>}
    </div>
  );
}

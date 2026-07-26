"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Transaction {
  id: string;
  type: "gelir" | "gider";
  description: string;
  amount: number;
  date: string;
  category: string;
  created_at: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    type: "gelir" as "gelir" | "gider",
    description: "",
    amount: "",
    date: "",
    category: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      showToast("Islemler yuklenirken hata olustu", "error");
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };

    const { error } = await supabase.from("transactions").insert([payload]);

    if (error) {
      showToast("Ekleme basarisiz", "error");
    } else {
      showToast("Islem eklendi", "success");
      setFormData({ type: "gelir", description: "", amount: "", date: "", category: "" });
      setShowForm(false);
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu islemi silmek istediginize emin misiniz?")) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      showToast("Silme basarisiz", "error");
    } else {
      showToast("Islem silindi", "success");
      fetchTransactions();
    }
  };

  const totalIncome = transactions.filter((t) => t.type === "gelir").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "gider").reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Finans</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Iptal" : "+ Yeni Islem"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-600">Toplam Gelir</p>
          <p className="text-2xl font-bold text-green-700">{totalIncome.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-sm text-red-600">Toplam Gider</p>
          <p className="text-2xl font-bold text-red-700">{totalExpense.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-600">Bakiye</p>
          <p className="text-2xl font-bold text-blue-700">{balance.toLocaleString("tr-TR")} TL</p>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Yeni Islem</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "gelir" | "gider" })} className="input-field">
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" placeholder="5000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aciklama</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" placeholder="Malzeme alimi" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" placeholder="Malzeme" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Kaydet</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Iptal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">Henüz islem bulunmuyor.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header">Tarih</th>
                <th className="table-header">Tip</th>
                <th className="table-header">Aciklama</th>
                <th className="table-header">Kategori</th>
                <th className="table-header">Tutar</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="table-cell">{t.date}</td>
                  <td className="table-cell"><span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === "gelir" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.type === "gelir" ? "Gelir" : "Gider"}</span></td>
                  <td className="table-cell">{t.description}</td>
                  <td className="table-cell">{t.category}</td>
                  <td className="table-cell font-medium">{t.amount.toLocaleString("tr-TR")} TL</td>
                  <td className="table-cell">
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Sil</button>
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

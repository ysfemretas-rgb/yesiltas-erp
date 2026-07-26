"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  created_by: string;
  created_at: string;
}

const incomeCategories = [
  { value: "cihaz_satis", label: "📱 Cihaz Satışı" },
  { value: "aksesuar_satis", label: "🎧 Aksesuar Satışı" },
  { value: "parca_satis", label: "🔧 Parça Satışı" },
  { value: "servis", label: "🛠️ Servis Ücreti" },
  { value: "diger_gelir", label: "📦 Diğer Gelir" },
];

const expenseCategories = [
  { value: "malzeme", label: "🔧 Malzeme Alımı" },
  { value: "sarf_malzeme", label: "🧪 Sarf Malzeme" },
  { value: "kira", label: "🏢 Kira" },
  { value: "elektrik", label: "⚡ Elektrik" },
  { value: "internet", label: "🌐 İnternet" },
  { value: "personel", label: "👤 Personel Maaşı" },
  { value: "diger_gider", label: "📦 Diğer Gider" },
];

const paymentMethods = [
  { value: "nakit", label: "💵 Nakit" },
  { value: "kredi_karti", label: "💳 Kredi Kartı" },
  { value: "havale", label: "🏦 Havale/EFT" },
];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    type: "gelir",
    category: "cihaz_satis",
    amount: 0,
    description: "",
    payment_method: "nakit",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (error) {
      showToast("İşlemler yüklenirken hata: " + error.message, "error");
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (form.amount <= 0) {
      showToast("Tutar 0'dan büyük olmalı!", "error");
      return;
    }

    const { error } = await supabase.from("transactions").insert([{
      type: form.type,
      category: form.category,
      amount: form.amount,
      description: form.description,
      payment_method: form.payment_method,
    }]);

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast("İşlem kaydedildi!", "success");
      setShowModal(false);
      resetForm();
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchTransactions();
    }
  };

  const resetForm = () => {
    setForm({ type: "gelir", category: "cihaz_satis", amount: 0, description: "", payment_method: "nakit" });
  };

  const totalIncome = transactions.filter((t) => t.type === "gelir").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter((t) => t.type === "gider").reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const todayIncome = transactions
    .filter((t) => t.type === "gelir" && t.created_at?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const todayExpense = transactions
    .filter((t) => t.type === "gider" && t.created_at?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filtered = filterType === "Tumu" ? transactions : transactions.filter((t) => t.type === filterType);

  const getCategoryLabel = (cat: string, type: string) => {
    const list = type === "gelir" ? incomeCategories : expenseCategories;
    return list.find((c) => c.value === cat)?.label || cat;
  };

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">💳 Kasa / Finans</h2>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
          ➕ Yeni İşlem
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card bg-emerald-500/10 border-emerald-500/20">
          <p className="text-xs text-emerald-400">Toplam Gelir</p>
          <p className="text-2xl font-bold text-emerald-300">{totalIncome.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-xs text-red-400">Toplam Gider</p>
          <p className="text-2xl font-bold text-red-300">{totalExpense.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className={`card ${balance >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          <p className={`text-xs ${balance >= 0 ? "text-blue-400" : "text-red-400"}`}>Bakiye</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-300" : "text-red-300"}`}>{balance.toLocaleString("tr-TR")} TL</p>
        </div>
        <div className="card bg-amber-500/10 border-amber-500/20">
          <p className="text-xs text-amber-400">Bugün Gelir/Gider</p>
          <p className="text-lg font-bold text-amber-300">+{todayIncome.toLocaleString("tr-TR")} / -{todayExpense.toLocaleString("tr-TR")}</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-3 mb-6">
        {["Tumu", "gelir", "gider"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === type
                ? type === "gelir" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  type === "gider" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  "bg-slate-700 text-white border border-slate-600"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            {type === "Tumu" ? "Tümü" : type === "gelir" ? "Gelirler" : "Giderler"}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <p>Henüz işlem kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tip</th>
                <th>Kategori</th>
                <th>Tutar</th>
                <th>Açıklama</th>
                <th>Ödeme</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="text-slate-400 text-xs">{new Date(item.created_at).toLocaleDateString("tr-TR")}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === "gelir" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {item.type === "gelir" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="text-slate-300">{getCategoryLabel(item.category, item.type)}</td>
                  <td className={`font-semibold ${item.type === "gelir" ? "text-emerald-400" : "text-red-400"}`}>
                    {item.type === "gelir" ? "+" : "-"}{item.amount.toLocaleString("tr-TR")} TL
                  </td>
                  <td className="max-w-xs truncate">{item.description || "-"}</td>
                  <td className="text-slate-400 text-xs">{paymentMethods.find((p) => p.value === item.payment_method)?.label || item.payment_method}</td>
                  <td>
                    <button onClick={() => handleDelete(item.id)} className="btn-danger text-xs">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">➕ Yeni İşlem</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">İşlem Tipi</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, type: "gelir", category: "cihaz_satis" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === "gelir" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    Gelir
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: "gider", category: "malzeme" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === "gider" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    Gider
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  {(form.type === "gelir" ? incomeCategories : expenseCategories).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tutar (TL)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input-field" min={0.01} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ödeme Şekli</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-field">
                  {paymentMethods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSave} className="btn-primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

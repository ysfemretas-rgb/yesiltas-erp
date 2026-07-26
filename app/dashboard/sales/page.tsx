"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Sale {
  id: string;
  customer_id: string;
  customer_name: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  installment_count: number;
  paid_amount: number;
  remaining_amount: number;
  warranty_months: number;
  notes: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
}

const itemTypes = [
  { value: "cihaz", label: "📱 Cihaz" },
  { value: "aksesuar", label: "🎧 Aksesuar" },
  { value: "parca", label: "🔧 Parça" },
  { value: "servis", label: "🛠️ Servis" },
  { value: "diger", label: "📦 Diğer" },
];

const paymentMethods = [
  { value: "nakit", label: "💵 Nakit" },
  { value: "kredi_karti", label: "💳 Kredi Kartı" },
  { value: "taksit", label: "📅 Taksit" },
  { value: "havale", label: "🏦 Havale/EFT" },
  { value: "borc", label: "📋 Borç" },
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    customer_id: "",
    item_type: "cihaz",
    item_name: "",
    quantity: 1,
    unit_price: 0,
    payment_method: "nakit",
    installment_count: 1,
    warranty_months: 12,
    notes: "",
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
    if (error) {
      showToast("Satışlar yüklenirken hata: " + error.message, "error");
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name").order("name");
    setCustomers(data || []);
  };

  const handleSave = async () => {
    if (!form.item_name.trim()) {
      showToast("Ürün adı zorunlu!", "error");
      return;
    }

    const customer = customers.find((c) => c.id === form.customer_id);
    const total = form.quantity * form.unit_price;
    const remaining = form.payment_method === "taksit" || form.payment_method === "borc" ? total : 0;

    const payload = {
      customer_id: form.customer_id || null,
      customer_name: customer?.name || "Bilinmiyor",
      item_type: form.item_type,
      item_name: form.item_name,
      quantity: form.quantity,
      unit_price: form.unit_price,
      total_amount: total,
      payment_method: form.payment_method,
      installment_count: form.installment_count,
      paid_amount: form.payment_method === "nakit" || form.payment_method === "kredi_karti" || form.payment_method === "havale" ? total : 0,
      remaining_amount: remaining,
      warranty_months: form.warranty_months,
      notes: form.notes,
    };

    const { error } = await supabase.from("sales").insert([payload]);

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      // Otomatik kasa kaydı
      if (total > 0) {
        await supabase.from("transactions").insert([
          {
            type: "gelir",
            category: form.item_type + "_satis",
            amount: total,
            description: `${form.item_name} satışı - ${customer?.name || "Bilinmiyor"}`,
            related_table: "sales",
            payment_method: form.payment_method,
          },
        ]);
      }
      showToast("Satış kaydedildi! Kasa'ya gelir eklendi.", "success");
      setShowModal(false);
      resetForm();
      fetchSales();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchSales();
    }
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      item_type: "cihaz",
      item_name: "",
      quantity: 1,
      unit_price: 0,
      payment_method: "nakit",
      installment_count: 1,
      warranty_months: 12,
      notes: "",
    });
  };

  const filtered = sales.filter((s) =>
    s.item_name.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const todayTotal = sales
    .filter((s) => s.created_at?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((sum, s) => sum + (s.total_amount || 0), 0);

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">💰 Satış (POS)</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            Bugün: <span className="text-emerald-400 font-medium">{todayTotal.toLocaleString("tr-TR")} TL</span>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
            ➕ Yeni Satış
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Satış ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-72"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <p>Henüz satış kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Müşteri</th>
                <th>Ürün</th>
                <th>Tip</th>
                <th>Adet</th>
                <th>Birim Fiyat</th>
                <th>Toplam</th>
                <th>Ödeme</th>
                <th>Garanti</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="text-slate-400 text-xs">{new Date(item.created_at).toLocaleDateString("tr-TR")}</td>
                  <td className="font-medium text-white">{item.customer_name || "-"}</td>
                  <td className="font-medium text-white">{item.item_name}</td>
                  <td>{itemTypes.find((t) => t.value === item.item_type)?.label || item.item_type}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price.toLocaleString("tr-TR")} TL</td>
                  <td className="font-semibold text-emerald-400">{item.total_amount.toLocaleString("tr-TR")} TL</td>
                  <td>
                    <span className="text-xs">{paymentMethods.find((p) => p.value === item.payment_method)?.label || item.payment_method}</span>
                    {item.installment_count > 1 && <span className="text-xs text-slate-500"> ({item.installment_count}x)</span>}
                  </td>
                  <td className="text-slate-400">{item.warranty_months} ay</td>
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
            <h3 className="text-lg font-semibold text-white mb-4">➕ Yeni Satış</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Müşteri</label>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="input-field">
                  <option value="">Müşteri Seçin</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ürün Tipi</label>
                <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} className="input-field">
                  {itemTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ürün Adı *</label>
                <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="input-field" placeholder="Örn: iPhone 14 Pro 128GB" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Adet</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} className="input-field" min={1} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Birim Fiyat</label>
                  <input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Toplam</label>
                  <div className="input-field bg-slate-800 text-emerald-400 font-semibold">
                    {(form.quantity * form.unit_price).toLocaleString("tr-TR")} TL
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ödeme Şekli</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-field">
                    {paymentMethods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Taksit Sayısı</label>
                  <input type="number" value={form.installment_count} onChange={(e) => setForm({ ...form, installment_count: parseInt(e.target.value) || 1 })} className="input-field" min={1} max={24} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Garanti Süresi (Ay)</label>
                <input type="number" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: parseInt(e.target.value) || 12 })} className="input-field" min={0} max={60} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Not</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSave} className="btn-primary">Satışı Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

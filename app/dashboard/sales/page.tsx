"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Customer { id: string; name: string; }

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    customer_id: "" as string | null,
    device_name: "",
    imei: "",
    sale_type: "cihaz",
    amount: "",
    payment_method: "Nakit",
    installment_count: "1",
  });

  useEffect(() => { fetchSales(); fetchCustomers(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sales").select("*, customers(name)").order("created_at", { ascending: false });
    if (error) showToast("Satislar yuklenirken hata", "error");
    else setSales(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name").order("name");
    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // DUZELTME: Bos customer_id null yap, yoksa UUID hatasi verir
    const customerId = formData.customer_id === "" ? null : formData.customer_id;
    const payload = {
      customer_id: customerId,
      device_name: formData.device_name,
      imei: formData.imei,
      sale_type: formData.sale_type,
      amount: parseFloat(formData.amount) || 0,
      payment_method: formData.payment_method,
      installment_count: parseInt(formData.installment_count) || 1,
    };
    const { error } = await supabase.from("sales").insert([payload]);
    if (error) showToast("Satis basarisiz: " + error.message, "error");
    else {
      showToast("Satis kaydedildi", "success");
      await supabase.from("transactions").insert([{
        type: "gelir",
        category: "Satis",
        description: `${formData.sale_type}: ${formData.device_name}`,
        amount: payload.amount,
      }]);
      setFormData({ customer_id: "", device_name: "", imei: "", sale_type: "cihaz", amount: "", payment_method: "Nakit", installment_count: "1" });
      setShowForm(false); fetchSales();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu satisi silmek istediginize emin misiniz?")) return;
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) showToast("Silme basarisiz", "error");
    else { showToast("Satis silindi", "success"); fetchSales(); }
  };

  const totalSales = sales.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Satis</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Iptal" : "+ Yeni Satis"}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-emerald-500/10 border-emerald-500/30"><p className="text-sm text-emerald-400">Toplam Satis</p><p className="text-2xl font-bold text-emerald-300">{totalSales.toLocaleString("tr-TR")} TL</p></div>
        <div className="card bg-blue-500/10 border-blue-500/30"><p className="text-sm text-blue-400">Islem Sayisi</p><p className="text-2xl font-bold text-blue-300">{sales.length}</p></div>
        <div className="card bg-amber-500/10 border-amber-500/30"><p className="text-sm text-amber-400">Bugun</p><p className="text-2xl font-bold text-amber-300">{sales.filter(s => s.created_at?.startsWith(new Date().toISOString().split("T")[0])).length}</p></div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Yeni Satis</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Musteri</label>
              <select value={formData.customer_id || ""} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} className="input-field">
                <option value="">Musteri secin (opsiyonel)</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Satis Tipi</label>
              <select value={formData.sale_type} onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })} className="input-field">
                <option value="cihaz">Cihaz</option><option value="aksesuar">Aksesuar</option><option value="parca">Parca</option><option value="servis">Servis</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Urun / Cihaz Adi *</label>
              <input type="text" value={formData.device_name} onChange={(e) => setFormData({ ...formData, device_name: e.target.value })} className="input-field" placeholder="iPhone 15 Pro 128GB" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">IMEI / Seri No</label>
              <input type="text" value={formData.imei} onChange={(e) => setFormData({ ...formData, imei: e.target.value })} className="input-field" placeholder="35..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tutar (TL) *</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" placeholder="45000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Odeme Sekli</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="input-field">
                <option>Nakit</option><option>Kredi Karti</option><option>Taksit</option><option>Havale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Taksit Sayisi</label>
              <input type="number" value={formData.installment_count} onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })} className="input-field" placeholder="1" />
            </div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Iptal</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-slate-500">Yukleniyor...</div> :
       sales.length === 0 ? <div className="card text-center py-12 text-slate-500"><div className="text-4xl mb-3">💰</div><p>Henüz satis kaydi yok.</p></div> :
       <div className="card overflow-x-auto">
         <table className="w-full min-w-[700px]">
           <thead><tr className="border-b border-slate-700"><th className="table-header">Tarih</th><th className="table-header">Musteri</th><th className="table-header">Urun</th><th className="table-header">Tip</th><th className="table-header">Tutar</th><th className="table-header">Odeme</th><th className="table-header">Islem</th></tr></thead>
           <tbody>{sales.map((s) => (<tr key={s.id} className="hover:bg-slate-700/30"><td className="table-cell text-slate-500">{new Date(s.created_at).toLocaleDateString("tr-TR")}</td><td className="table-cell">{s.customers?.name || "-"}</td><td className="table-cell font-medium">{s.device_name}</td><td className="table-cell"><span className="badge bg-slate-700 text-slate-300">{s.sale_type}</span></td><td className="table-cell font-medium text-emerald-400">{s.amount.toLocaleString("tr-TR")} TL</td><td className="table-cell">{s.payment_method} {s.installment_count > 1 && `(${s.installment_count} taksit)`}</td><td className="table-cell"><button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Sil</button></td></tr>))}</tbody>
         </table>
       </div>}
    </div>
  );
}

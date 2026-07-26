"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  tc_no: string;
  notes: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    tc_no: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("name");
    if (error) {
      showToast("Müşteriler yüklenirken hata: " + error.message, "error");
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Müşteri adı zorunlu!", "error");
      return;
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      tc_no: form.tc_no,
      notes: form.notes,
    };

    let error;
    if (editing) {
      const { error: e } = await supabase.from("customers").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("customers").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Müşteri eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchCustomers();
    }
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", tc_no: "", notes: "" });
  };

  const openEdit = (item: Customer) => {
    setEditing(item);
    setForm({
      name: item.name,
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      tc_no: item.tc_no || "",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">👥 Müşteriler</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
          ➕ Yeni Müşteri
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Müşteri ara..."
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
          <div className="empty-state-icon">👥</div>
          <p>Henüz müşteri kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Adres</th>
                <th>TC No</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-white">{item.name}</td>
                  <td className="text-slate-400">{item.phone || "-"}</td>
                  <td className="text-slate-400">{item.email || "-"}</td>
                  <td className="text-slate-400 max-w-xs truncate">{item.address || "-"}</td>
                  <td className="text-slate-400">{item.tc_no || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="btn-success">Düzenle</button>
                      <button onClick={() => handleDelete(item.id)} className="btn-danger">Sil</button>
                    </div>
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
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "✏️ Müşteri Düzenle" : "➕ Yeni Müşteri"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ad Soyad *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Telefon</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">E-posta</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Adres</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">TC Kimlik No</label>
                <input type="text" value={form.tc_no} onChange={(e) => setForm({ ...form, tc_no: e.target.value })} className="input-field" maxLength={11} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notlar</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSave} className="btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

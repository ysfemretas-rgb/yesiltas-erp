"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_no: string;
  notes: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_no: "",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) {
      showToast("Tedarikçiler yüklenirken hata: " + error.message, "error");
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Tedarikçi adı zorunlu!", "error");
      return;
    }

    const payload = {
      name: form.name,
      contact_person: form.contact_person,
      phone: form.phone,
      email: form.email,
      address: form.address,
      tax_no: form.tax_no,
      notes: form.notes,
    };

    let error;
    if (editing) {
      const { error: e } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("suppliers").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Tedarikçi eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchSuppliers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchSuppliers();
    }
  };

  const resetForm = () => {
    setForm({ name: "", contact_person: "", phone: "", email: "", address: "", tax_no: "", notes: "" });
  };

  const openEdit = (item: Supplier) => {
    setEditing(item);
    setForm({
      name: item.name,
      contact_person: item.contact_person || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      tax_no: item.tax_no || "",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">🏭 Tedarikçiler</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
          ➕ Yeni Tedarikçi
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Tedarikçi ara..."
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
          <div className="empty-state-icon">🏭</div>
          <p>Henüz tedarikçi kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Firma Adı</th>
                <th>Yetkili</th>
                <th>Telefon</th>
                <th>E-posta</th>
                <th>Adres</th>
                <th>Vergi No</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-white">{item.name}</td>
                  <td className="text-slate-400">{item.contact_person || "-"}</td>
                  <td className="text-slate-400">{item.phone || "-"}</td>
                  <td className="text-slate-400">{item.email || "-"}</td>
                  <td className="text-slate-400 max-w-xs truncate">{item.address || "-"}</td>
                  <td className="text-slate-400">{item.tax_no || "-"}</td>
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
              {editing ? "✏️ Tedarikçi Düzenle" : "➕ Yeni Tedarikçi"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Firma Adı *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Yetkili Kişi</label>
                  <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Telefon</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-posta</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Adres</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vergi No</label>
                <input type="text" value={form.tax_no} onChange={(e) => setForm({ ...form, tax_no: e.target.value })} className="input-field" />
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

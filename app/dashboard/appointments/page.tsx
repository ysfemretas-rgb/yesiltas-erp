"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description: string;
  status: string;
  notes: string;
  created_at: string;
}

const serviceTypes = [
  { value: "tamir", label: "🔧 Tamir" },
  { value: "satis", label: "💰 Satış" },
  { value: "danisma", label: "💬 Danışma" },
  { value: "garanti", label: "🛡️ Garanti" },
];

const statusTypes = [
  { value: "beklemede", label: "⏳ Beklemede", color: "bg-amber-500/20 text-amber-400" },
  { value: "tamamlandi", label: "✅ Tamamlandı", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "iptal", label: "❌ İptal", color: "bg-red-500/20 text-red-400" },
  { value: "gelmedi", label: "🚫 Gelmedi", color: "bg-slate-500/20 text-slate-400" },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    appointment_date: "",
    appointment_time: "",
    service_type: "tamir",
    description: "",
    status: "beklemede",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    if (error) {
      showToast("Randevular yüklenirken hata: " + error.message, "error");
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.appointment_date || !form.appointment_time) {
      showToast("Müşteri adı, tarih ve saat zorunlu!", "error");
      return;
    }

    const payload = {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      service_type: form.service_type,
      description: form.description,
      status: form.status,
      notes: form.notes,
    };

    let error;
    if (editing) {
      const { error: e } = await supabase.from("appointments").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("appointments").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Randevu eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchAppointments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchAppointments();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    if (error) {
      showToast("Durum güncellenirken hata: " + error.message, "error");
    } else {
      showToast("Durum güncellendi!", "success");
      fetchAppointments();
    }
  };

  const resetForm = () => {
    setForm({
      customer_name: "",
      customer_phone: "",
      appointment_date: "",
      appointment_time: "",
      service_type: "tamir",
      description: "",
      status: "beklemede",
      notes: "",
    });
  };

  const openEdit = (item: Appointment) => {
    setEditing(item);
    setForm({
      customer_name: item.customer_name,
      customer_phone: item.customer_phone || "",
      appointment_date: item.appointment_date,
      appointment_time: item.appointment_time,
      service_type: item.service_type,
      description: item.description || "",
      status: item.status,
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const filtered = appointments.filter((a) => {
    const matchSearch = a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                       a.customer_phone?.includes(search);
    const matchDate = !filterDate || a.appointment_date === filterDate;
    const matchStatus = filterStatus === "Tumu" || a.status === filterStatus;
    return matchSearch && matchDate && matchStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.appointment_date === today);
  const upcomingAppointments = appointments.filter((a) => a.appointment_date >= today && a.status === "beklemede");

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">📅 Randevu Sistemi</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
          ➕ Yeni Randevu
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card bg-amber-500/10 border-amber-500/20">
          <p className="text-xs text-amber-400">Bugünkü Randevular</p>
          <p className="text-2xl font-bold text-amber-300">{todayAppointments.length}</p>
        </div>
        <div className="card bg-blue-500/10 border-blue-500/20">
          <p className="text-xs text-blue-400">Bekleyen</p>
          <p className="text-2xl font-bold text-blue-300">
            {appointments.filter((a) => a.status === "beklemede").length}
          </p>
        </div>
        <div className="card bg-emerald-500/10 border-emerald-500/20">
          <p className="text-xs text-emerald-400">Tamamlanan</p>
          <p className="text-2xl font-bold text-emerald-300">
            {appointments.filter((a) => a.status === "tamamlandi").length}
          </p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-xs text-red-400">İptal/Gelmedi</p>
          <p className="text-2xl font-bold text-red-300">
            {appointments.filter((a) => a.status === "iptal" || a.status === "gelmedi").length}
          </p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-48"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-field sm:w-40"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field sm:w-40">
          <option value="Tumu">Tüm Durumlar</option>
          {statusTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>Henüz randevu kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih / Saat</th>
                <th>Müşteri</th>
                <th>Telefon</th>
                <th>Servis</th>
                <th>Açıklama</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const statusInfo = statusTypes.find((s) => s.value === item.status);
                const isToday = item.appointment_date === today;
                return (
                  <tr key={item.id} className={isToday ? "bg-amber-500/5" : ""}>
                    <td>
                      <div className={`font-medium ${isToday ? "text-amber-400" : "text-white"}`}>
                        {new Date(item.appointment_date).toLocaleDateString("tr-TR")}
                        {isToday && " (BUGÜN)"}
                      </div>
                      <div className="text-xs text-slate-500">{item.appointment_time}</div>
                    </td>
                    <td className="font-medium text-white">{item.customer_name}</td>
                    <td className="text-slate-400">{item.customer_phone || "-"}</td>
                    <td>
                      {serviceTypes.find((s) => s.value === item.service_type)?.label || item.service_type}
                    </td>
                    <td className="max-w-xs truncate">{item.description || "-"}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border ${statusInfo?.color || ""} bg-transparent`}
                      >
                        {statusTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="btn-success">Düzenle</button>
                        <button onClick={() => handleDelete(item.id)} className="btn-danger">Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "✏️ Randevu Düzenle" : "➕ Yeni Randevu"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Müşteri Adı *</label>
                <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefon</label>
                <input type="text" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tarih *</label>
                  <input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Saat *</label>
                  <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Servis Türü</label>
                <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="input-field">
                  {serviceTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Durum</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  {statusTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Not</label>
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

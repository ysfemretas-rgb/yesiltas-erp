"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Customer { id: string; name: string; phone: string; }
interface Device {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  imei: string;
  color: string;
  complaint: string;
  diagnosis: string;
  status: string;
  estimated_cost: number;
  final_cost: number;
  received_at: string;
  customers: { name: string; phone: string };
}

const statusOptions = ["Bekliyor", "Tamirde", "Hazir", "Teslim Edildi", "Iptal"];
const brandOptions = ["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Realme", "General Mobile", "Diger"];

const statusColors: Record<string, string> = {
  "Bekliyor": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Tamirde": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Hazir": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Teslim Edildi": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Iptal": "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    customer_id: "",
    brand: "Apple",
    model: "",
    imei: "",
    color: "",
    complaint: "",
    diagnosis: "",
    status: "Bekliyor",
    estimated_cost: "",
    final_cost: "",
  });

  useEffect(() => { fetchDevices(); fetchCustomers(); }, []);

  const fetchDevices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("devices")
      .select("*, customers(name, phone)")
      .order("created_at", { ascending: false });
    if (error) showToast("Cihazlar yuklenirken hata", "error");
    else setDevices(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name, phone").order("name");
    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      final_cost: parseFloat(formData.final_cost) || 0,
    };

    if (editingDevice) {
      const { error } = await supabase.from("devices").update(payload).eq("id", editingDevice.id);
      if (error) showToast("Guncelleme basarisiz", "error");
      else {
        showToast("Cihaz guncellendi", "success");
        if (payload.status === "Hazir" && editingDevice.status !== "Hazir") {
          await supabase.from("service_logs").insert([{
            device_id: editingDevice.id,
            action: "Cihaz hazirlandi",
            description: `Tahmini: ${payload.estimated_cost}TL, Gercek: ${payload.final_cost}TL`,
          }]);
        }
        resetForm(); setShowForm(false); fetchDevices();
      }
    } else {
      const { data, error } = await supabase.from("devices").insert([payload]).select();
      if (error) showToast("Ekleme basarisiz: " + error.message, "error");
      else {
        showToast("Cihaz kaydedildi", "success");
        if (data && data[0]) {
          await supabase.from("service_logs").insert([{
            device_id: data[0].id,
            action: "Teslim alindi",
            description: payload.complaint,
          }]);
        }
        resetForm(); setShowForm(false); fetchDevices();
      }
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: "", brand: "Apple", model: "", imei: "", color: "", complaint: "", diagnosis: "", status: "Bekliyor", estimated_cost: "", final_cost: "" });
    setEditingDevice(null);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      customer_id: device.customer_id,
      brand: device.brand,
      model: device.model,
      imei: device.imei || "",
      color: device.color || "",
      complaint: device.complaint,
      diagnosis: device.diagnosis || "",
      status: device.status,
      estimated_cost: device.estimated_cost?.toString() || "",
      final_cost: device.final_cost?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu cihazi silmek istediginize emin misiniz?")) return;
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) showToast("Silme basarisiz", "error");
    else { showToast("Cihaz silindi", "success"); fetchDevices(); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("devices").update({ status: newStatus }).eq("id", id);
    if (error) showToast("Durum degistirilemedi", "error");
    else {
      showToast(`Durum: ${newStatus}`, "success");
      await supabase.from("service_logs").insert([{ device_id: id, action: `Durum degisti: ${newStatus}` }]);
      fetchDevices();
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch = (d.customers?.name + " " + d.brand + " " + d.model + " " + d.imei).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Tumu" || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Cihazlar</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
          {showForm ? "Iptal" : "+ Yeni Cihaz"}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Ara (musteri, marka, model, IMEI)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field flex-1"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-full sm:w-48">
          <option value="Tumu">Tum Durumlar</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingDevice ? "Cihaz Duzenle" : "Yeni Cihaz Kaydi"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">Musteri *</label>
              <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} className="input-field" required>
                <option value="">Musteri secin...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Marka *</label>
              <select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="input-field" required>
                {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model *</label>
              <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="input-field" placeholder="iPhone 15 Pro" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">IMEI</label>
              <input type="text" value={formData.imei} onChange={(e) => setFormData({ ...formData, imei: e.target.value })} className="input-field" placeholder="35..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Renk</label>
              <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="input-field" placeholder="Siyah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tahmini Maliyet (TL)</label>
              <input type="number" value={formData.estimated_cost} onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Gercek Maliyet (TL)</label>
              <input type="number" value={formData.final_cost} onChange={(e) => setFormData({ ...formData, final_cost: e.target.value })} className="input-field" placeholder="0" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">Sikayet *</label>
              <textarea value={formData.complaint} onChange={(e) => setFormData({ ...formData, complaint: e.target.value })} className="input-field h-20 resize-none" placeholder="Ekran kirildi, sarj olmuyor..." required />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">Teshis / Not</label>
              <textarea value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} className="input-field h-20 resize-none" placeholder="Ekran degisimi gerekli..." />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editingDevice ? "Guncelle" : "Kaydet"}</button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary">Iptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : filteredDevices.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">📱</div>
          <p>Henüz cihaz kaydi yok.</p>
          <p className="text-sm mt-1">Yukaridaki butondan yeni cihaz ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="table-header">Musteri</th>
                <th className="table-header">Cihaz</th>
                <th className="table-header">Sikayet</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Maliyet</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-700/30">
                  <td className="table-cell">
                    <div className="font-medium text-white">{device.customers?.name || "-"}</div>
                    <div className="text-xs text-slate-500">{device.customers?.phone}</div>
                  </td>
                  <td className="table-cell">
                    <div className="font-medium">{device.brand} {device.model}</div>
                    <div className="text-xs text-slate-500">{device.imei} {device.color && `| ${device.color}`}</div>
                  </td>
                  <td className="table-cell max-w-xs">
                    <div className="truncate" title={device.complaint}>{device.complaint}</div>
                    {device.diagnosis && <div className="text-xs text-emerald-400 truncate" title={device.diagnosis}>{device.diagnosis}</div>}
                  </td>
                  <td className="table-cell">
                    <select
                      value={device.status}
                      onChange={(e) => handleStatusChange(device.id, e.target.value)}
                      className={`badge border ${statusColors[device.status]} bg-transparent cursor-pointer`}
                    >
                      {statusOptions.map((s) => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                    </select>
                  </td>
                  <td className="table-cell">
                    <div className="text-emerald-400 font-medium">{device.final_cost || device.estimated_cost || 0} TL</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(device)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Duzenle</button>
                      <button onClick={() => handleDelete(device.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Sil</button>
                    </div>
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

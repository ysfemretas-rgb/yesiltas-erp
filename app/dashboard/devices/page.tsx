"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Device {
  id: string;
  customer_id: string;
  customer_name: string;
  brand: string;
  model: string;
  imei: string;
  serial_number: string;
  complaint: string;
  diagnosis: string;
  status: string;
  received_at: string;
  started_at: string;
  completed_at: string;
  delivered_at: string;
  estimated_cost: number;
  final_cost: number;
  paid_amount: number;
  payment_status: string;
  technician: string;
  notes: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const statusOptions = [
  { value: "bekliyor", label: "⏳ Bekliyor", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "tamirde", label: "🔧 Tamirde", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "hazir", label: "✅ Hazır", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "teslim_edildi", label: "📦 Teslim Edildi", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "iptal", label: "❌ İptal", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const paymentStatusOptions = [
  { value: "beklemede", label: "Beklemede" },
  { value: "kismi", label: "Kısmi Ödeme" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "ucretsiz", label: "Ücretsiz" },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    customer_id: "",
    brand: "",
    model: "",
    imei: "",
    serial_number: "",
    complaint: "",
    diagnosis: "",
    status: "bekliyor",
    estimated_cost: 0,
    final_cost: 0,
    paid_amount: 0,
    payment_status: "beklemede",
    technician: "",
    notes: "",
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchDevices();
    fetchCustomers();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("devices").select("*").order("received_at", { ascending: false });
    if (error) {
      showToast("Cihazlar yüklenirken hata: " + error.message, "error");
    } else {
      setDevices(data || []);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name, phone").order("name");
    setCustomers(data || []);
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      showToast("Müşteri adı zorunlu!", "error");
      return;
    }

    const { data, error } = await supabase.from("customers").insert([
      {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        address: customerForm.address,
      },
    ]).select();

    if (error) {
      showToast("Müşteri kaydedilirken hata: " + error.message, "error");
      return;
    }

    if (data && data[0]) {
      showToast("Müşteri kaydedildi!", "success");
      setForm({ ...form, customer_id: data[0].id });
      setCustomers([...customers, { id: data[0].id, name: data[0].name, phone: data[0].phone }]);
      setShowCustomerModal(false);
      setCustomerForm({ name: "", phone: "", email: "", address: "" });
    }
  };

  const handleSave = async () => {
    if (!form.brand.trim() || !form.model.trim() || !form.complaint.trim()) {
      showToast("Marka, model ve şikayet zorunlu!", "error");
      return;
    }

    const customer = customers.find((c) => c.id === form.customer_id);

    const payload: any = {
      customer_id: form.customer_id || null,
      customer_name: customer?.name || "Bilinmiyor",
      brand: form.brand,
      model: form.model,
      imei: form.imei,
      serial_number: form.serial_number,
      complaint: form.complaint,
      diagnosis: form.diagnosis,
      status: form.status,
      estimated_cost: form.estimated_cost,
      final_cost: form.final_cost,
      paid_amount: form.paid_amount,
      payment_status: form.payment_status,
      technician: form.technician,
      notes: form.notes,
    };

    if (!editing) {
      payload.received_at = new Date().toISOString();
    }

    let error;
    if (editing) {
      const { error: e } = await supabase.from("devices").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("devices").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Cihaz eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchDevices();
    }
  };

  const handleStatusChange = async (device: Device, newStatus: string) => {
    const updates: any = { status: newStatus };
    const now = new Date().toISOString();

    // Tarih alanlarını güncelle
    if (newStatus === "tamirde" && !device.started_at) {
      updates.started_at = now;
    }
    if (newStatus === "hazir" && !device.completed_at) {
      updates.completed_at = now;
    }
    if (newStatus === "teslim_edildi" && !device.delivered_at) {
      updates.delivered_at = now;
      // Teslim edildiyse ödeme durumunu kontrol et
      // Eğer ödeme tamamlanmamışsa kısmi veya beklemede kalabilir
      if (device.payment_status === "beklemede" && device.final_cost > 0) {
        // Ödeme beklemedeyse ve ücret varsa, kullanıcıya sor
        // Ama şimdilik mevcut ödeme durumunu koru, sadece teslim tarihi ekle
      }
    }

    const { error } = await supabase.from("devices").update(updates).eq("id", device.id);

    if (error) {
      showToast("Durum güncellenirken hata: " + error.message, "error");
      return;
    }

    // TESLİM EDİLDİ → OTOMATİK KASA (sadece ödeme tamamlanmışsa veya ücretsizse)
    if (newStatus === "teslim_edildi") {
      if (device.payment_status === "tamamlandi" && device.final_cost > 0) {
        // Ödeme tamamlanmışsa kasaya ekle
        const { error: transError } = await supabase.from("transactions").insert([
          {
            type: "gelir",
            category: "servis",
            amount: device.final_cost,
            description: `${device.brand} ${device.model} servis ücreti - ${device.customer_name} (IMEI: ${device.imei || "-"})`,
            related_table: "devices",
            related_id: device.id,
            payment_method: "nakit",
          },
        ]);

        if (transError) {
          showToast("Kasa kaydı oluşturulurken hata: " + transError.message, "error");
        } else {
          showToast(`Cihaz teslim edildi! Kasa'ya ${device.final_cost.toLocaleString("tr-TR")} TL gelir kaydedildi.`, "success");
        }
      } else if (device.payment_status === "ucretsiz") {
        showToast("Cihaz ücretsiz olarak teslim edildi.", "success");
      } else if (device.payment_status === "kismi") {
        showToast(`Cihaz kısmi ödeme ile teslim edildi. Kalan: ${(device.final_cost - device.paid_amount).toLocaleString("tr-TR")} TL`, "info");
      } else {
        showToast("Cihaz teslim edildi. Ödeme henüz tamamlanmamış!", "info");
      }
    } else {
      showToast("Durum güncellendi!", "success");
    }

    fetchDevices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchDevices();
    }
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      brand: "",
      model: "",
      imei: "",
      serial_number: "",
      complaint: "",
      diagnosis: "",
      status: "bekliyor",
      estimated_cost: 0,
      final_cost: 0,
      paid_amount: 0,
      payment_status: "beklemede",
      technician: "",
      notes: "",
    });
  };

  const openEdit = (item: Device) => {
    setEditing(item);
    setForm({
      customer_id: item.customer_id || "",
      brand: item.brand,
      model: item.model,
      imei: item.imei || "",
      serial_number: item.serial_number || "",
      complaint: item.complaint,
      diagnosis: item.diagnosis || "",
      status: item.status,
      estimated_cost: item.estimated_cost || 0,
      final_cost: item.final_cost || 0,
      paid_amount: item.paid_amount || 0,
      payment_status: item.payment_status,
      technician: item.technician || "",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const openDetail = (item: Device) => {
    setSelectedDevice(item);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getPaymentStatusDisplay = (device: Device) => {
    const remaining = (device.final_cost || 0) - (device.paid_amount || 0);
    if (device.payment_status === "ucretsiz") return { text: "Ücretsiz", color: "text-slate-400" };
    if (device.payment_status === "tamamlandi") return { text: "Tamamlandı", color: "text-emerald-400" };
    if (device.payment_status === "kismi") return { text: `Kısmi (Kalan: ${remaining.toLocaleString("tr-TR")} TL)`, color: "text-blue-400" };
    return { text: "Beklemede", color: "text-amber-400" };
  };

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.imei?.includes(search);
    const matchStatus = filterStatus === "Tumu" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">📱 Cihaz Servis Takibi</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
          ➕ Yeni Cihaz
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Cihaz, müşteri veya IMEI ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-72"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field sm:w-48">
          <option value="Tumu">Tüm Durumlar</option>
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📱</div>
          <p>Henüz cihaz kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Müşteri</th>
                <th>Cihaz</th>
                <th>IMEI</th>
                <th>Şikayet</th>
                <th>Durum</th>
                <th>Alınma</th>
                <th>Teslim</th>
                <th>Ücret</th>
                <th>Ödeme</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const statusInfo = statusOptions.find((s) => s.value === item.status);
                const paymentDisplay = getPaymentStatusDisplay(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium text-white">{item.customer_name || "-"}</div>
                    </td>
                    <td>
                      <div className="font-medium text-white">{item.brand} {item.model}</div>
                      {item.technician && <div className="text-xs text-slate-500">Teknisyen: {item.technician}</div>}
                    </td>
                    <td className="text-slate-400 text-xs">{item.imei || "-"}</td>
                    <td className="max-w-xs truncate">{item.complaint}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer ${statusInfo?.color || ""}`}
                      >
                        {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="text-slate-400 text-xs">{formatDate(item.received_at)}</td>
                    <td className="text-slate-400 text-xs">{formatDate(item.delivered_at)}</td>
                    <td>
                      <div className="text-white font-medium">{item.final_cost?.toLocaleString("tr-TR") || 0} TL</div>
                    </td>
                    <td>
                      <div className={`text-xs font-medium ${paymentDisplay.color}`}>{paymentDisplay.text}</div>
                      {item.paid_amount > 0 && item.payment_status !== "tamamlandi" && (
                        <div className="text-xs text-slate-500">
                          Ödenen: {item.paid_amount.toLocaleString("tr-TR")} TL
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openDetail(item)} className="btn-success text-xs">Detay</button>
                        <button onClick={() => openEdit(item)} className="btn-success text-xs">Düzenle</button>
                        <button onClick={() => handleDelete(item.id)} className="btn-danger text-xs">Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cihaz Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "✏️ Cihaz Düzenle" : "➕ Yeni Cihaz"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-slate-400">Müşteri</label>
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                  >
                    ➕ Yeni Müşteri Ekle
                  </button>
                </div>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="input-field">
                  <option value="">Müşteri Seçin</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Marka *</label>
                  <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Model *</label>
                  <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">IMEI</label>
                <input type="text" value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Seri No</label>
                <input type="text" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Şikayet *</label>
                <textarea value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Teşhis</label>
                <textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tahmini Maliyet</label>
                <input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Son Maliyet</label>
                <input type="number" value={form.final_cost} onChange={(e) => setForm({ ...form, final_cost: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ödenen</label>
                <input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ödeme Durumu</label>
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} className="input-field">
                  {paymentStatusOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Teknisyen</label>
                <input type="text" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Durum</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
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

      {/* Hızlı Müşteri Ekleme Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">➕ Yeni Müşteri Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Ad Soyad *</label>
                <input type="text" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="input-field" placeholder="Müşteri adı" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefon</label>
                <input type="text" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="input-field" placeholder="0555 000 00 00" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-posta</label>
                <input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="input-field" placeholder="ornek@mail.com" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Adres</label>
                <textarea value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} className="input-field" rows={2} placeholder="Adres" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCustomerModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSaveCustomer} className="btn-primary">Müşteriyi Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modal */}
      {showDetailModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">📱 Cihaz Detayı</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Müşteri</p>
                  <p className="text-white font-medium">{selectedDevice.customer_name || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cihaz</p>
                  <p className="text-white font-medium">{selectedDevice.brand} {selectedDevice.model}</p>
                </div>
                <div>
                  <p className="text-slate-500">IMEI</p>
                  <p className="text-white font-medium">{selectedDevice.imei || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Seri No</p>
                  <p className="text-white font-medium">{selectedDevice.serial_number || "-"}</p>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-slate-500 mb-1">Tarih Takibi</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Alınma Tarihi</p>
                    <p className="text-emerald-400 font-medium">{formatDate(selectedDevice.received_at)}</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Tamire Başlama</p>
                    <p className="text-blue-400 font-medium">{formatDate(selectedDevice.started_at)}</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Tamamlanma</p>
                    <p className="text-emerald-400 font-medium">{formatDate(selectedDevice.completed_at)}</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Teslim Tarihi</p>
                    <p className="text-purple-400 font-medium">{formatDate(selectedDevice.delivered_at)}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-slate-500 mb-1">Finans</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Tahmini</p>
                    <p className="text-white font-medium">{selectedDevice.estimated_cost?.toLocaleString("tr-TR") || 0} TL</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Son Fiyat</p>
                    <p className="text-white font-medium">{selectedDevice.final_cost?.toLocaleString("tr-TR") || 0} TL</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <p className="text-slate-500">Ödenen</p>
                    <p className="text-white font-medium">{selectedDevice.paid_amount?.toLocaleString("tr-TR") || 0} TL</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-slate-500">Ödeme Durumu</p>
                  <p className={`font-medium ${getPaymentStatusDisplay(selectedDevice).color}`}>
                    {getPaymentStatusDisplay(selectedDevice).text}
                  </p>
                  {(selectedDevice.final_cost || 0) > (selectedDevice.paid_amount || 0) && selectedDevice.payment_status !== "ucretsiz" && (
                    <p className="text-red-400 text-xs mt-1">
                      Kalan: {((selectedDevice.final_cost || 0) - (selectedDevice.paid_amount || 0)).toLocaleString("tr-TR")} TL
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Şikayet</p>
                <p className="text-white">{selectedDevice.complaint}</p>
              </div>
              {selectedDevice.diagnosis && (
                <div>
                  <p className="text-slate-500">Teşhis</p>
                  <p className="text-white">{selectedDevice.diagnosis}</p>
                </div>
              )}
              {selectedDevice.notes && (
                <div>
                  <p className="text-slate-500">Notlar</p>
                  <p className="text-white">{selectedDevice.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

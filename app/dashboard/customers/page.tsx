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

interface Device {
  id: string;
  brand: string;
  model: string;
  status: string;
  complaint: string;
  final_cost: number;
  paid_amount: number;
  payment_status: string;
  received_at: string;
}

interface Sale {
  id: string;
  item_name: string;
  item_type: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: string;
  next_payment_date: string;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description: string;
  status: string;
}

interface DebtInfo {
  totalDebt: number;
  overdueDebt: number;
  nextPaymentDate: string | null;
  hasOverdue: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDevices, setCustomerDevices] = useState<Device[]>([]);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [customerDebt, setCustomerDebt] = useState<DebtInfo>({ totalDebt: 0, overdueDebt: 0, nextPaymentDate: null, hasOverdue: false });
  const [historyLoading, setHistoryLoading] = useState(false);
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

  const fetchCustomerHistory = async (customer: Customer) => {
    setHistoryLoading(true);
    setSelectedCustomer(customer);

    const [devicesRes, salesRes, appointmentsRes] = await Promise.all([
      supabase.from("devices").select("*").eq("customer_id", customer.id).order("received_at", { ascending: false }),
      supabase.from("sales").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }),
      supabase.from("appointments").select("*").eq("customer_id", customer.id).order("appointment_date", { ascending: false }),
    ]);

    const devices = devicesRes.data || [];
    const sales = salesRes.data || [];

    setCustomerDevices(devices);
    setCustomerSales(sales);
    setCustomerAppointments(appointmentsRes.data || []);

    // Borç hesaplama
    const deviceDebts = devices
      .filter((d) => d.payment_status !== "tamamlandi" && d.payment_status !== "ucretsiz")
      .reduce((sum, d) => sum + ((d.final_cost || 0) - (d.paid_amount || 0)), 0);

    const saleDebts = sales
      .filter((s) => s.remaining_amount > 0)
      .reduce((sum, s) => sum + (s.remaining_amount || 0), 0);

    const totalDebt = deviceDebts + saleDebts;

    // Tarihi geçen borçları hesapla
    const today = new Date().toISOString().split("T")[0];
    const overdueSales = sales.filter((s) => s.remaining_amount > 0 && s.next_payment_date && s.next_payment_date < today);
    const overdueDebt = overdueSales.reduce((sum, s) => sum + (s.remaining_amount || 0), 0);

    // En yakın ödeme tarihi
    const futurePayments = sales
      .filter((s) => s.remaining_amount > 0 && s.next_payment_date && s.next_payment_date >= today)
      .map((s) => s.next_payment_date);
    const nextPaymentDate = futurePayments.length > 0 ? futurePayments.sort()[0] : null;

    setCustomerDebt({
      totalDebt,
      overdueDebt,
      nextPaymentDate,
      hasOverdue: overdueDebt > 0,
    });

    setHistoryLoading(false);
    setShowHistoryModal(true);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      bekliyor: "text-amber-400",
      tamirde: "text-blue-400",
      hazir: "text-emerald-400",
      teslim_edildi: "text-purple-400",
      iptal: "text-red-400",
    };
    return colors[status] || "text-slate-400";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      bekliyor: "Bekliyor",
      tamirde: "Tamirde",
      hazir: "Hazır",
      teslim_edildi: "Teslim Edildi",
      iptal: "İptal",
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      beklemede: "Beklemede",
      kismi: "Kısmi Ödeme",
      tamamlandi: "Tamamlandı",
      ucretsiz: "Ücretsiz",
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      beklemede: "text-amber-400",
      kismi: "text-blue-400",
      tamamlandi: "text-emerald-400",
      ucretsiz: "text-slate-400",
    };
    return colors[status] || "text-slate-400";
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
                  <td>
                    <button
                      onClick={() => fetchCustomerHistory(item)}
                      className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer text-left"
                    >
                      {item.name}
                    </button>
                  </td>
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

      {/* Müşteri Ekleme/Düzenleme Modal */}
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

      {/* İşlem Geçmişi Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">
              📋 {selectedCustomer.name} - İşlem Geçmişi
            </h3>
            <p className="text-sm text-slate-400 mb-4">{selectedCustomer.phone} | {selectedCustomer.email}</p>

            {/* Borç Özeti */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className={`card ${customerDebt.hasOverdue ? "bg-red-500/10 border-red-500/20" : "bg-slate-800/50"}`}>
                <p className={`text-xs ${customerDebt.hasOverdue ? "text-red-400" : "text-slate-400"}`}>Toplam Borç</p>
                <p className={`text-xl font-bold ${customerDebt.hasOverdue ? "text-red-300" : "text-white"}`}>
                  {customerDebt.totalDebt.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className={`card ${customerDebt.hasOverdue ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                <p className={`text-xs ${customerDebt.hasOverdue ? "text-red-400" : "text-emerald-400"}`}>
                  {customerDebt.hasOverdue ? "⚠️ Tarihi Geçen" : "Durum"}
                </p>
                <p className={`text-xl font-bold ${customerDebt.hasOverdue ? "text-red-300" : "text-emerald-300"}`}>
                  {customerDebt.hasOverdue
                    ? `${customerDebt.overdueDebt.toLocaleString("tr-TR")} TL`
                    : customerDebt.totalDebt > 0 ? "Borçlu" : "Borç Yok"
                  }
                </p>
              </div>
              <div className="card bg-blue-500/10 border-blue-500/20">
                <p className="text-xs text-blue-400">Son Ödeme Tarihi</p>
                <p className="text-xl font-bold text-blue-300">
                  {customerDebt.nextPaymentDate
                    ? new Date(customerDebt.nextPaymentDate).toLocaleDateString("tr-TR")
                    : "-"
                  }
                </p>
              </div>
            </div>

            {customerDebt.hasOverdue && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                ⚠️ <strong>Dikkat!</strong> Bu müşterinin {customerDebt.overdueDebt.toLocaleString("tr-TR")} TL tutarında tarihi geçen ödemesi bulunmaktadır.
              </div>
            )}

            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="spinner text-emerald-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cihaz Geçmişi */}
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                    📱 Cihaz Servis Geçmişi ({customerDevices.length})
                  </h4>
                  {customerDevices.length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz cihaz kaydı yok</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Cihaz</th>
                            <th>Şikayet</th>
                            <th>Durum</th>
                            <th>Ödeme</th>
                            <th>Ücret</th>
                            <th>Tarih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDevices.map((d) => (
                            <tr key={d.id}>
                              <td className="font-medium text-white">{d.brand} {d.model}</td>
                              <td className="text-slate-400 text-xs max-w-xs truncate">{d.complaint}</td>
                              <td className={getStatusColor(d.status)}>{getStatusLabel(d.status)}</td>
                              <td className={getPaymentStatusColor(d.payment_status)}>{getPaymentStatusLabel(d.payment_status)}</td>
                              <td className="text-emerald-400">{(d.final_cost || 0).toLocaleString("tr-TR")} TL</td>
                              <td className="text-slate-400 text-xs">{new Date(d.received_at).toLocaleDateString("tr-TR")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Satış Geçmişi */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    💰 Satış Geçmişi ({customerSales.length})
                  </h4>
                  {customerSales.length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz satış kaydı yok</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ürün</th>
                            <th>Tip</th>
                            <th>Tutar</th>
                            <th>Ödenen</th>
                            <th>Kalan</th>
                            <th>Son Ödeme</th>
                            <th>Tarih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerSales.map((s) => {
                            const isOverdue = s.remaining_amount > 0 && s.next_payment_date && s.next_payment_date < new Date().toISOString().split("T")[0];
                            return (
                              <tr key={s.id}>
                                <td className="font-medium text-white">{s.item_name}</td>
                                <td className="text-slate-400 text-xs">{s.item_type}</td>
                                <td className="text-emerald-400 font-medium">{s.total_amount.toLocaleString("tr-TR")} TL</td>
                                <td className="text-emerald-400">{s.paid_amount?.toLocaleString("tr-TR") || 0} TL</td>
                                <td className={`font-medium ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
                                  {s.remaining_amount?.toLocaleString("tr-TR") || 0} TL
                                  {isOverdue && " ⚠️"}
                                </td>
                                <td className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-slate-400"}`}>
                                  {s.next_payment_date
                                    ? new Date(s.next_payment_date).toLocaleDateString("tr-TR")
                                    : "-"
                                  }
                                </td>
                                <td className="text-slate-400 text-xs">{new Date(s.created_at).toLocaleDateString("tr-TR")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Randevu Geçmişi */}
                <div>
                  <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    📅 Randevu Geçmişi ({customerAppointments.length})
                  </h4>
                  {customerAppointments.length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz randevu kaydı yok</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tarih</th>
                            <th>Saat</th>
                            <th>Servis</th>
                            <th>Açıklama</th>
                            <th>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerAppointments.map((a) => (
                            <tr key={a.id}>
                              <td className="text-white">{new Date(a.appointment_date).toLocaleDateString("tr-TR")}</td>
                              <td className="text-slate-400">{a.appointment_time}</td>
                              <td className="text-slate-400 text-xs">{a.service_type}</td>
                              <td className="text-slate-400 text-xs max-w-xs truncate">{a.description || "-"}</td>
                              <td className="text-slate-400 text-xs">{a.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

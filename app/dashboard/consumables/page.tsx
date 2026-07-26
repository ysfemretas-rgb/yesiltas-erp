"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Consumable {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  alert_enabled: boolean;
  created_at: string;
}

interface ConsumableUsage {
  id: string;
  consumable_id: string;
  consumables: { name: string; unit: string };
  quantity_used: number;
  total_cost: number;
  used_by: string;
  notes: string;
  created_at: string;
}

const categories = [
  { value: "lehim", label: "🔥 Lehim" },
  { value: "alkol", label: "🧴 Alkol / Temizlik" },
  { value: "flux", label: "🧪 Flux / Pasta" },
  { value: "bant", label: "📏 Bant / Yapıştırıcı" },
  { value: "temizlik", label: "🧽 Temizlik" },
  { value: "diger", label: "📦 Diğer" },
];

const units = [
  { value: "adet", label: "Adet" },
  { value: "metre", label: "Metre" },
  { value: "gram", label: "Gram" },
  { value: "mililitre", label: "Mililitre" },
  { value: "paket", label: "Paket" },
];

export default function ConsumablesPage() {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [usageHistory, setUsageHistory] = useState<ConsumableUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [editing, setEditing] = useState<Consumable | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    name: "",
    category: "lehim",
    unit: "adet",
    quantity: 0,
    min_stock: 5,
    max_stock: 100,
    unit_cost: 0,
    alert_enabled: true,
  });

  const [usageForm, setUsageForm] = useState({
    consumable_id: "",
    quantity_used: 0,
    used_by: "",
    notes: "",
  });

  useEffect(() => {
    fetchConsumables();
    fetchUsageHistory();
  }, []);

  const fetchConsumables = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("consumables").select("*").order("name");
    if (error) {
      showToast("Sarf malzemeleri yüklenirken hata: " + error.message, "error");
    } else {
      setConsumables(data || []);
    }
    setLoading(false);
  };

  const fetchUsageHistory = async () => {
    const { data, error } = await supabase
      .from("consumable_usage")
      .select(`*, consumables(name, unit)`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setUsageHistory(data || []);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Malzeme adı zorunlu!", "error");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      quantity: form.quantity,
      min_stock: form.min_stock,
      max_stock: form.max_stock,
      unit_cost: form.unit_cost,
      alert_enabled: form.alert_enabled,
    };

    let error;
    if (editing) {
      const { error: e } = await supabase.from("consumables").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("consumables").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchConsumables();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("consumables").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchConsumables();
    }
  };

  const handleUsage = async () => {
    if (!usageForm.consumable_id || usageForm.quantity_used <= 0) {
      showToast("Malzeme ve miktar zorunlu!", "error");
      return;
    }

    const consumable = consumables.find((c) => c.id === usageForm.consumable_id);
    if (!consumable) return;

    if (consumable.quantity < usageForm.quantity_used) {
      showToast("Stokta yeterli malzeme yok! Mevcut: " + consumable.quantity + " " + consumable.unit, "error");
      return;
    }

    const totalCost = usageForm.quantity_used * consumable.unit_cost;

    // 1. Kullanım kaydı oluştur
    const { error: usageError } = await supabase.from("consumable_usage").insert([
      {
        consumable_id: usageForm.consumable_id,
        quantity_used: usageForm.quantity_used,
        unit_cost_at_time: consumable.unit_cost,
        total_cost: totalCost,
        used_by: usageForm.used_by,
        notes: usageForm.notes,
      },
    ]);

    if (usageError) {
      showToast("Kullanım kaydedilirken hata: " + usageError.message, "error");
      return;
    }

    // 2. Stoktan düş
    const { error: stockError } = await supabase
      .from("consumables")
      .update({ quantity: consumable.quantity - usageForm.quantity_used })
      .eq("id", usageForm.consumable_id);

    if (stockError) {
      showToast("Stok güncellenirken hata: " + stockError.message, "error");
      return;
    }

    // 3. KASADAN OTOMATİK DÜŞÜŞ (Gider kaydı)
    const { error: transError } = await supabase.from("transactions").insert([
      {
        type: "gider",
        category: "sarf_malzeme",
        amount: totalCost,
        description: `${consumable.name} - ${usageForm.quantity_used} ${consumable.unit} kullanımı (${usageForm.used_by})`,
        related_table: "consumables",
        related_id: usageForm.consumable_id,
        payment_method: "nakit",
      },
    ]);

    if (transError) {
      showToast("Kasa kaydı oluşturulurken hata: " + transError.message, "error");
    } else {
      showToast(`${consumable.name} - ${usageForm.quantity_used} ${consumable.unit} kullanıldı. Kasa'dan ${totalCost.toLocaleString("tr-TR")} TL düşüldü.`, "success");
    }

    setShowUsageModal(false);
    resetUsageForm();
    fetchConsumables();
    fetchUsageHistory();
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "lehim",
      unit: "adet",
      quantity: 0,
      min_stock: 5,
      max_stock: 100,
      unit_cost: 0,
      alert_enabled: true,
    });
  };

  const resetUsageForm = () => {
    setUsageForm({ consumable_id: "", quantity_used: 0, used_by: "", notes: "" });
  };

  const openEdit = (item: Consumable) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      min_stock: item.min_stock,
      max_stock: item.max_stock,
      unit_cost: item.unit_cost,
      alert_enabled: item.alert_enabled,
    });
    setShowModal(true);
  };

  const getStockStatus = (item: Consumable) => {
    if (item.quantity <= 0) return { text: "STOK YOK", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (item.quantity <= item.min_stock) return { text: "KRİTİK", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    if (item.quantity >= item.max_stock) return { text: "TAM", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    return { text: "YETERLİ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  };

  const filtered = consumables.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "Tumu" || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">🔧 Sarf Malzeme Takibi</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowUsageModal(true)} className="btn-secondary">
            ➖ Kullanım Kaydet
          </button>
          <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
            ➕ Yeni Malzeme
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Malzeme ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-64"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field sm:w-48">
          <option value="Tumu">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card bg-slate-800/50">
          <p className="text-xs text-slate-400">Toplam Malzeme</p>
          <p className="text-2xl font-bold text-white">{consumables.length}</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-xs text-red-400">Kritik Stok</p>
          <p className="text-2xl font-bold text-red-300">
            {consumables.filter((c) => c.quantity <= c.min_stock && c.quantity > 0).length}
          </p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-xs text-red-400">Stok Bitti</p>
          <p className="text-2xl font-bold text-red-300">
            {consumables.filter((c) => c.quantity <= 0).length}
          </p>
        </div>
        <div className="card bg-emerald-500/10 border-emerald-500/20">
          <p className="text-xs text-emerald-400">Toplam Değer</p>
          <p className="text-2xl font-bold text-emerald-300">
            {consumables.reduce((sum, c) => sum + c.quantity * c.unit_cost, 0).toLocaleString("tr-TR")} TL
          </p>
        </div>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔧</div>
          <p>Henüz sarf malzeme kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Malzeme</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Min/Max</th>
                <th>Birim Maliyet</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.unit}</div>
                    </td>
                    <td>
                      {categories.find((c) => c.value === item.category)?.label || item.category}
                    </td>
                    <td className="font-semibold">{item.quantity} {item.unit}</td>
                    <td className="text-slate-400">{item.min_stock} / {item.max_stock}</td>
                    <td>{item.unit_cost.toLocaleString("tr-TR")} TL</td>
                    <td>
                      <span className={`badge ${status.color}`}>{status.text}</span>
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

      {/* Kullanım Geçmişi */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Son Kullanımlar</h3>
        {usageHistory.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz kullanım kaydı yok</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Malzeme</th>
                  <th>Miktar</th>
                  <th>Maliyet</th>
                  <th>Kullanan</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {usageHistory.map((u) => (
                  <tr key={u.id}>
                    <td>{new Date(u.created_at).toLocaleDateString("tr-TR")}</td>
                    <td>{u.consumables?.name}</td>
                    <td>{u.quantity_used} {u.consumables?.unit}</td>
                    <td>{u.total_cost.toLocaleString("tr-TR")} TL</td>
                    <td>{u.used_by || "-"}</td>
                    <td className="max-w-xs truncate">{u.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Malzeme Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "✏️ Malzeme Düzenle" : "➕ Yeni Sarf Malzeme"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Malzeme Adı *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Birim</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field">
                    {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Mevcut Stok</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Min. Stok</label>
                  <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Max. Stok</label>
                  <input type="number" value={form.max_stock} onChange={(e) => setForm({ ...form, max_stock: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Birim Maliyet (TL)</label>
                <input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.alert_enabled}
                  onChange={(e) => setForm({ ...form, alert_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
                />
                <label className="text-sm text-slate-400">Kritik stok uyarısı aktif</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSave} className="btn-primary">{editing ? "Güncelle" : "Kaydet"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Kullanım Modal */}
      {showUsageModal && (
        <div className="modal-overlay" onClick={() => setShowUsageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">➖ Kullanım Kaydet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Malzeme *</label>
                <select value={usageForm.consumable_id} onChange={(e) => setUsageForm({ ...usageForm, consumable_id: e.target.value })} className="input-field">
                  <option value="">Seçiniz</option>
                  {consumables.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Stok: {c.quantity} {c.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Kullanılan Miktar *</label>
                <input type="number" value={usageForm.quantity_used} onChange={(e) => setUsageForm({ ...usageForm, quantity_used: parseFloat(e.target.value) || 0 })} className="input-field" min={0.01} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Kullanan Teknisyen</label>
                <input type="text" value={usageForm.used_by} onChange={(e) => setUsageForm({ ...usageForm, used_by: e.target.value })} className="input-field" placeholder="Örn: Teknisyen Ahmet" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Not</label>
                <textarea value={usageForm.notes} onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })} className="input-field" rows={2} placeholder="Hangi cihazda kullanıldı?" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowUsageModal(false)} className="btn-secondary">İptal</button>
              <button onClick={handleUsage} className="btn-primary">Kullanımı Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

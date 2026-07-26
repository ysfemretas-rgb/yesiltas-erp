"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  min_stock: number;
  purchase_currency: string;
  purchase_price_usd: number;
  purchase_price_try: number;
  usd_rate_at_purchase: number;
  sale_price: number;
  supplier_id: string;
  alert_enabled: boolean;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
}

const categories = [
  { value: "ekran", label: "📱 Ekran" },
  { value: "batarya", label: "🔋 Batarya" },
  { value: "soket", label: "🔌 Soket / Şarj" },
  { value: "kamera", label: "📷 Kamera" },
  { value: "hoparlor", label: "🔊 Hoparlör" },
  { value: "mikrofon", label: "🎤 Mikrofon" },
  { value: "kaset", label: "📦 Kasa / Kapak" },
  { value: "aksesuar", label: "🎧 Aksesuar" },
  { value: "diger", label: "📦 Diğer" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [usdRate, setUsdRate] = useState<number>(47.25);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tumu");
  const { showToast, ToastContainer } = useToast();

  const [form, setForm] = useState({
    name: "",
    category: "ekran",
    brand: "",
    model: "",
    quantity: 0,
    min_stock: 5,
    purchase_currency: "TRY",
    purchase_price_usd: 0,
    purchase_price_try: 0,
    usd_rate_at_purchase: 47.25,
    sale_price: 0,
    supplier_id: "",
    alert_enabled: true,
  });

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
    fetchUsdRate();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("inventory").select("*").order("name");
    if (error) {
      showToast("Stok yüklenirken hata: " + error.message, "error");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").order("name");
    setSuppliers(data || []);
  };

  const fetchUsdRate = async () => {
    try {
      const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const usd = xml.querySelector('Currency[CurrencyCode="USD"]');
      if (usd) {
        const selling = parseFloat(usd.querySelector("ForexSelling")?.textContent || "47.25");
        setUsdRate(selling);
      }
    } catch {
      setUsdRate(47.25);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Ürün adı zorunlu!", "error");
      return;
    }

    // TL çevrimi hesapla
    let purchasePriceTry = form.purchase_price_try;
    let purchasePriceUsd = form.purchase_price_usd;
    let usdRateAtPurchase = form.usd_rate_at_purchase;

    if (form.purchase_currency === "USD" && form.purchase_price_usd > 0) {
      purchasePriceTry = form.purchase_price_usd * form.usd_rate_at_purchase;
    } else if (form.purchase_currency === "TRY" && form.purchase_price_try > 0) {
      purchasePriceUsd = form.purchase_price_try / form.usd_rate_at_purchase;
    }

    const payload = {
      name: form.name,
      category: form.category,
      brand: form.brand,
      model: form.model,
      quantity: form.quantity,
      min_stock: form.min_stock,
      purchase_currency: form.purchase_currency,
      purchase_price_usd: purchasePriceUsd,
      purchase_price_try: purchasePriceTry,
      usd_rate_at_purchase: usdRateAtPurchase,
      sale_price: form.sale_price,
      supplier_id: form.supplier_id || null,
      alert_enabled: form.alert_enabled,
    };

    let error;
    if (editing) {
      const { error: e } = await supabase.from("inventory").update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("inventory").insert([payload]);
      error = e;
    }

    if (error) {
      showToast("Kaydedilirken hata: " + error.message, "error");
    } else {
      showToast(editing ? "Güncellendi!" : "Eklendi!", "success");
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchInventory();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) {
      showToast("Silinirken hata: " + error.message, "error");
    } else {
      showToast("Silindi!", "success");
      fetchInventory();
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "ekran",
      brand: "",
      model: "",
      quantity: 0,
      min_stock: 5,
      purchase_currency: "TRY",
      purchase_price_usd: 0,
      purchase_price_try: 0,
      usd_rate_at_purchase: usdRate,
      sale_price: 0,
      supplier_id: "",
      alert_enabled: true,
    });
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand || "",
      model: item.model || "",
      quantity: item.quantity,
      min_stock: item.min_stock,
      purchase_currency: item.purchase_currency,
      purchase_price_usd: item.purchase_price_usd || 0,
      purchase_price_try: item.purchase_price_try || 0,
      usd_rate_at_purchase: item.usd_rate_at_purchase || usdRate,
      sale_price: item.sale_price,
      supplier_id: item.supplier_id || "",
      alert_enabled: item.alert_enabled,
    });
    setShowModal(true);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { text: "STOK YOK", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (item.quantity <= item.min_stock) return { text: "KRİTİK", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { text: "YETERLİ", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  };

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                       i.brand?.toLowerCase().includes(search.toLowerCase()) ||
                       i.model?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "Tumu" || i.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title">📦 Stok Yönetimi</h2>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            💵 Güncel Kur: <span className="text-emerald-400 font-medium">{usdRate.toFixed(2)} TL</span>
          </div>
          <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary">
            ➕ Yeni Ürün
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-64"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field sm:w-48">
          <option value="Tumu">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card bg-slate-800/50">
          <p className="text-xs text-slate-400">Toplam Ürün</p>
          <p className="text-2xl font-bold text-white">{items.length}</p>
        </div>
        <div className="card bg-red-500/10 border-red-500/20">
          <p className="text-xs text-red-400">Kritik Stok</p>
          <p className="text-2xl font-bold text-red-300">{items.filter((i) => i.quantity <= i.min_stock && i.quantity > 0).length}</p>
        </div>
        <div className="card bg-emerald-500/10 border-emerald-500/20">
          <p className="text-xs text-emerald-400">Toplam Değer (TRY)</p>
          <p className="text-2xl font-bold text-emerald-300">
            {items.reduce((sum, i) => sum + (i.purchase_price_try || 0) * i.quantity, 0).toLocaleString("tr-TR")} TL
          </p>
        </div>
        <div className="card bg-blue-500/10 border-blue-500/20">
          <p className="text-xs text-blue-400">Toplam Değer (USD)</p>
          <p className="text-2xl font-bold text-blue-300">
            {items.reduce((sum, i) => sum + (i.purchase_price_usd || 0) * i.quantity, 0).toLocaleString("tr-TR")} $
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
          <div className="empty-state-icon">📦</div>
          <p>Henüz stok kaydı yok</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Alış (Para Birimi)</th>
                <th>Alış (USD)</th>
                <th>Alış (TRY)</th>
                <th>Satış</th>
                <th>Kar</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStockStatus(item);
                const profit = (item.sale_price - (item.purchase_price_try || 0));
                const profitPercent = item.purchase_price_try > 0 ? ((profit / item.purchase_price_try) * 100).toFixed(1) : 0;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.brand} {item.model}</div>
                    </td>
                    <td>{categories.find((c) => c.value === item.category)?.label || item.category}</td>
                    <td className="font-semibold">{item.quantity} adet</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.purchase_currency === 'USD' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {item.purchase_currency}
                      </span>
                    </td>
                    <td className="text-blue-400">
                      {item.purchase_price_usd > 0 ? `$${item.purchase_price_usd.toFixed(2)}` : "-"}
                    </td>
                    <td className="text-emerald-400">
                      {item.purchase_price_try > 0 ? `${item.purchase_price_try.toLocaleString("tr-TR")} TL` : "-"}
                    </td>
                    <td className="text-white font-medium">{item.sale_price.toLocaleString("tr-TR")} TL</td>
                    <td>
                      <div className={`text-xs font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString("tr-TR")} TL ({profitPercent}%)
                      </div>
                    </td>
                    <td><span className={`badge ${status.color}`}>{status.text}</span></td>
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
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "✏️ Ürün Düzenle" : "➕ Yeni Stok Ürünü"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Ürün Adı *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tedarikçi</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="input-field">
                  <option value="">Seçiniz</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Marka</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Model</label>
                <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Stok</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="input-field" min={0} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Min. Stok</label>
                  <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })} className="input-field" min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Satış Fiyatı (TL)</label>
                <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} className="input-field" min={0} step={0.01} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Para Birimi</label>
                <select
                  value={form.purchase_currency}
                  onChange={(e) => setForm({ ...form, purchase_currency: e.target.value })}
                  className="input-field"
                >
                  <option value="TRY">🇹🇷 Türk Lirası (TRY)</option>
                  <option value="USD">🇺🇸 Amerikan Doları (USD)</option>
                </select>
              </div>
              {form.purchase_currency === "USD" ? (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Alış Fiyatı (USD)</label>
                    <input
                      type="number"
                      value={form.purchase_price_usd}
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setForm({
                          ...form,
                          purchase_price_usd: usd,
                          purchase_price_try: usd * form.usd_rate_at_purchase,
                        });
                      }}
                      className="input-field"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Alış Kuru (USD/TRY)</label>
                    <input
                      type="number"
                      value={form.usd_rate_at_purchase}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || usdRate;
                        setForm({
                          ...form,
                          usd_rate_at_purchase: rate,
                          purchase_price_try: form.purchase_price_usd * rate,
                        });
                      }}
                      className="input-field"
                      min={0}
                      step={0.0001}
                    />
                  </div>
                  <div className="sm:col-span-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400">Otomatik Hesaplanan TRY Değeri:</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {(form.purchase_price_usd * form.usd_rate_at_purchase).toLocaleString("tr-TR")} TL
                    </p>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Alış Fiyatı (TRY)</label>
                  <input
                    type="number"
                    value={form.purchase_price_try}
                    onChange={(e) => setForm({ ...form, purchase_price_try: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 sm:col-span-2">
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
    </div>
  );
}

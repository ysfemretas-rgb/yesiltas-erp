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
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Musteriler yuklenirken hata olustu", "error");
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update(formData)
        .eq("id", editingCustomer.id);

      if (error) {
        showToast("Guncelleme basarisiz", "error");
      } else {
        showToast("Musteri guncellendi", "success");
        setEditingCustomer(null);
        setFormData({ name: "", phone: "", email: "", address: "" });
        setShowForm(false);
        fetchCustomers();
      }
    } else {
      const { error } = await supabase.from("customers").insert([formData]);

      if (error) {
        showToast("Ekleme basarisiz", "error");
      } else {
        showToast("Musteri eklendi", "success");
        setFormData({ name: "", phone: "", email: "", address: "" });
        setShowForm(false);
        fetchCustomers();
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu musteriyi silmek istediginize emin misiniz?")) return;

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      showToast("Silme basarisiz", "error");
    } else {
      showToast("Musteri silindi", "success");
      fetchCustomers();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", address: "" });
  };

  return (
    <div>
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Musteriler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? "Iptal" : "+ Yeni Musteri"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCustomer ? "Musteri Duzenle" : "Yeni Musteri"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ahmet Yilmaz"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="05XX XXX XX XX"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adres
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                placeholder="Istanbul, Turkiye"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingCustomer ? "Guncelle" : "Kaydet"}
              </button>
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Iptal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          Henüz musteri bulunmuyor. Yukaridaki butondan ekleyebilirsiniz.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header">Ad Soyad</th>
                <th className="table-header">Telefon</th>
                <th className="table-header">E-posta</th>
                <th className="table-header">Adres</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{customer.name}</td>
                  <td className="table-cell">{customer.phone}</td>
                  <td className="table-cell">{customer.email}</td>
                  <td className="table-cell">{customer.address}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Duzenle
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Sil
                      </button>
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

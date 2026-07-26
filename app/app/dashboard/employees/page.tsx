"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string;
  salary: number;
  hire_date: string;
  created_at: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    phone: "",
    salary: "",
    hire_date: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Calisanlar yuklenirken hata olustu", "error");
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      salary: parseFloat(formData.salary) || 0,
    };

    if (editingEmployee) {
      const { error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", editingEmployee.id);

      if (error) {
        showToast("Guncelleme basarisiz", "error");
      } else {
        showToast("Calisan guncellendi", "success");
        setEditingEmployee(null);
        resetForm();
        setShowForm(false);
        fetchEmployees();
      }
    } else {
      const { error } = await supabase.from("employees").insert([payload]);

      if (error) {
        showToast("Ekleme basarisiz", "error");
      } else {
        showToast("Calisan eklendi", "success");
        resetForm();
        setShowForm(false);
        fetchEmployees();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", position: "", phone: "", salary: "", hire_date: "" });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      phone: employee.phone,
      salary: employee.salary.toString(),
      hire_date: employee.hire_date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu calisani silmek istediginize emin misiniz?")) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      showToast("Silme basarisiz", "error");
    } else {
      showToast("Calisan silindi", "success");
      fetchEmployees();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    resetForm();
  };

  return (
    <div>
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Calisanlar</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Iptal" : "+ Yeni Calisan"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingEmployee ? "Calisan Duzenle" : "Yeni Calisan"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Mehmet Kaya" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pozisyon</label>
              <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" placeholder="Muhendis" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Maas (TL)</label>
              <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="input-field" placeholder="25000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ise Baslama Tarihi</label>
              <input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editingEmployee ? "Guncelle" : "Kaydet"}</button>
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Iptal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : employees.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">Henüz calisan bulunmuyor.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header">Ad Soyad</th>
                <th className="table-header">Pozisyon</th>
                <th className="table-header">Telefon</th>
                <th className="table-header">Maas</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{employee.name}</td>
                  <td className="table-cell">{employee.position}</td>
                  <td className="table-cell">{employee.phone}</td>
                  <td className="table-cell">{employee.salary.toLocaleString("tr-TR")} TL</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(employee)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Duzenle</button>
                      <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Sil</button>
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

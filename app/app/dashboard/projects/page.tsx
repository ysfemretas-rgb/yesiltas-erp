"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/toast";

interface Project {
  id: string;
  name: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "Devam Ediyor",
    start_date: "",
    end_date: "",
    budget: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showToast("Projeler yuklenirken hata olustu", "error");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      budget: parseFloat(formData.budget) || 0,
    };

    if (editingProject) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", editingProject.id);

      if (error) {
        showToast("Guncelleme basarisiz", "error");
      } else {
        showToast("Proje guncellendi", "success");
        setEditingProject(null);
        resetForm();
        setShowForm(false);
        fetchProjects();
      }
    } else {
      const { error } = await supabase.from("projects").insert([payload]);

      if (error) {
        showToast("Ekleme basarisiz", "error");
      } else {
        showToast("Proje eklendi", "success");
        resetForm();
        setShowForm(false);
        fetchProjects();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      status: "Devam Ediyor",
      start_date: "",
      end_date: "",
      budget: "",
    });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      location: project.location,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      budget: project.budget.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu projeyi silmek istediginize emin misiniz?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      showToast("Silme basarisiz", "error");
    } else {
      showToast("Proje silindi", "success");
      fetchProjects();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    resetForm();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Devam Ediyor": return "bg-blue-100 text-blue-700";
      case "Tamamlandi": return "bg-green-100 text-green-700";
      case "Beklemede": return "bg-amber-100 text-amber-700";
      case "Iptal": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div>
      <ToastContainer />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Projeler</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Iptal" : "+ Yeni Proje"}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingProject ? "Proje Duzenle" : "Yeni Proje"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proje Adi</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Site insaati" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lokasyon</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" placeholder="Istanbul" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                <option>Devam Ediyor</option>
                <option>Tamamlandi</option>
                <option>Beklemede</option>
                <option>Iptal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Butce (TL)</label>
              <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="input-field" placeholder="1000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Baslangic Tarihi</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bitis Tarihi</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editingProject ? "Guncelle" : "Kaydet"}</button>
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Iptal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Yukleniyor...</div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">Henüz proje bulunmuyor.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-header">Proje Adi</th>
                <th className="table-header">Lokasyon</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Butce</th>
                <th className="table-header">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{project.name}</td>
                  <td className="table-cell">{project.location}</td>
                  <td className="table-cell"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(project.status)}`}>{project.status}</span></td>
                  <td className="table-cell">{project.budget.toLocaleString("tr-TR")} TL</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(project)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Duzenle</button>
                      <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Sil</button>
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

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  created_at: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filtered, setFiltered] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (search) setFiltered(suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)))
    else setFiltered(suppliers)
  }, [search, suppliers])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data) { setSuppliers(data); setFiltered(data) }
    setLoading(false)
  }

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '', notes: supplier.notes || '' })
      setEditingId(supplier.id)
    } else {
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('suppliers').update(form).eq('id', editingId)
      showToast('Tedarikci guncellendi')
    } else {
      await supabase.from('suppliers').insert([form])
      showToast('Tedarikci eklendi')
    }
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    await supabase.from('suppliers').delete().eq('id', id)
    showToast('Silindi')
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Tedarikciler</h1>
        <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Tedarikci</button>
      </div>

      <input type="text" className="input" placeholder="Tedarikci ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Firma</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Adres</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="font-medium text-white">{s.name}</td>
                <td className="text-slate-300">{s.phone || '-'}</td>
                <td className="text-slate-300">{s.email || '-'}</td>
                <td className="text-slate-300 max-w-xs truncate">{s.address || '-'}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(s)} className="btn btn-secondary btn-sm">Duzenle</button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henuz tedarikci kaydi yok</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Tedarikci Duzenle' : 'Yeni Tedarikci'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Firma Adi *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

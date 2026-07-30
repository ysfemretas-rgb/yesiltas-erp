'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Warranty {
  id: string
  customer_name: string
  item_name: string
  imei: string
  warranty_start: string
  warranty_end: string
  warranty_months: number
  status: string
  notes: string
  created_at: string
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [filtered, setFiltered] = useState<Warranty[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    customer_name: '', item_name: '', imei: '', warranty_months: '12',
    warranty_start: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = warranties
    if (search) result = result.filter(w => w.customer_name?.toLowerCase().includes(search.toLowerCase()) || w.item_name?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) result = result.filter(w => w.status === statusFilter)
    setFiltered(result)
  }, [search, statusFilter, warranties])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('warranties').select('*').order('warranty_end', { ascending: true })
    if (data) { setWarranties(data); setFiltered(data) }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const months = parseInt(form.warranty_months) || 12
    const start = new Date(form.warranty_start)
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)

    const { error } = await supabase.from('warranties').insert([{
      customer_name: form.customer_name.trim(),
      item_name: form.item_name.trim(),
      imei: form.imei.trim() || null,
      warranty_start: form.warranty_start,
      warranty_end: end.toISOString().split('T')[0],
      warranty_months: months,
      status: 'Aktif',
      notes: form.notes.trim() || null
    }])

    if (error) {
      showToast('Hata: ' + error.message, 'error')
    } else {
      showToast('Garanti kaydi eklendi!')
      setShowModal(false)
      setForm({ customer_name: '', item_name: '', imei: '', warranty_months: '12', warranty_start: new Date().toISOString().split('T')[0], notes: '' })
      loadData()
    }
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const daysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('warranties').update({ status }).eq('id', id)
    showToast('Durum guncellendi')
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu garanti kaydini silmek istediginize emin misiniz?')) return
    await supabase.from('warranties').delete().eq('id', id)
    showToast('Garanti kaydi silindi')
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
        <h1 className="text-2xl font-bold text-white">Garantiler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">+ Yeni Garanti</button>
      </div>

      <div className="flex gap-2">
        <input type="text" className="input flex-1" placeholder="Musteri veya urun ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tum Durumlar</option>
          <option value="Aktif">Aktif</option>
          <option value="Sona Erdi">Sona Erdi</option>
          <option value="Iade Edildi">Iade Edildi</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Musteri</th><th>Urun</th><th>IMEI</th><th>Baslangic</th><th>Bitis</th><th>Kalan Sure</th><th>Durum</th><th>Islemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const expired = isExpired(w.warranty_end)
              const days = daysLeft(w.warranty_end)
              return (
                <tr key={w.id}>
                  <td className="font-medium text-white">{w.customer_name}</td>
                  <td className="text-slate-300">{w.item_name}</td>
                  <td className="text-slate-300 text-sm">{w.imei || '-'}</td>
                  <td className="text-slate-400 text-sm">{w.warranty_start ? new Date(w.warranty_start).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="text-slate-400 text-sm">{w.warranty_end ? new Date(w.warranty_end).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className={expired ? 'text-red-400' : days < 30 ? 'text-yellow-400' : 'text-emerald-400'}>
                    {expired ? 'Sona erdi' : `${days} gun`}
                  </td>
                  <td>
                    <select className="select text-sm py-1" value={w.status} onChange={(e) => handleStatusChange(w.id, e.target.value)}>
                      <option value="Aktif">Aktif</option>
                      <option value="Sona Erdi">Sona Erdi</option>
                      <option value="Iade Edildi">Iade Edildi</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleStatusChange(w.id, 'Iade Edildi')} className="btn btn-danger btn-sm">Iade</button>
                      <button onClick={() => handleDelete(w.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Henuz garanti kaydi yok</p>
        </div>
      )}

      {/* Yeni Garanti Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Garanti Kaydi</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Musteri Adi *</label><input className="input" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required /></div>
                <div className="form-group"><label>Urun Adi *</label><input className="input" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} /></div>
                <div className="grid-2">
                  <div className="form-group"><label>Garanti Suresi (Ay) *</label><input className="input" type="number" min="1" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} required /></div>
                  <div className="form-group"><label>Baslangic Tarihi *</label><input className="input" type="date" value={form.warranty_start} onChange={(e) => setForm({...form, warranty_start: e.target.value})} required /></div>
                </div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

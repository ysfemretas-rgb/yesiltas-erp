'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function InlineToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
    }`}>
      <div className="flex items-center gap-2">
        <span>{type === 'success' ? '✅' : '❌'}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">&times;</button>
      </div>
    </div>
  )
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [form, setForm] = useState({
    customer_name: '', item_name: '', warranty_months: '12', warranty_end_date: '', status: 'Aktif'
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('warranties').select('*').order('created_at', { ascending: false })
    if (data) setWarranties(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const months = parseInt(form.warranty_months) || 12
      let endDate = form.warranty_end_date
      if (!endDate) {
        const d = new Date()
        d.setMonth(d.getMonth() + months)
        endDate = d.toISOString().split('T')[0]
      }
      const { error } = await supabase.from('warranties').insert([{
        customer_name: form.customer_name, item_name: form.item_name,
        warranty_months: months, warranty_end_date: endDate, status: form.status
      }])
      if (error) throw error
      setToast({ message: 'Garanti eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({ customer_name: '', item_name: '', warranty_months: '12', warranty_end_date: '', status: 'Aktif' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu garantiyi silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('warranties').delete().eq('id', id)
      if (error) throw error
      setToast({ message: 'Garanti silindi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('warranties').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setToast({ message: 'Durum güncellendi!', type: 'success' })
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'badge-green'
      case 'Süresi Dolmuş': return 'badge-red'
      case 'İptal': return 'badge-gray'
      default: return 'badge-blue'
    }
  }

  const activeWarranties = warranties.filter(w => w.status === 'Aktif' && new Date(w.warranty_end_date) > new Date())
  const expiredWarranties = warranties.filter(w => w.status === 'Aktif' && new Date(w.warranty_end_date) <= new Date())

  const filtered = warranties.filter(w =>
    w.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    w.item_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading && warranties.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Garantiler</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni Garanti</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-emerald-400">{activeWarranties.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Aktif Garanti</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-red-400">{expiredWarranties.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Süresi Dolmuş</div>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-blue-400">{warranties.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam</div>
        </div>
      </div>

      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Müşteri</th><th>Ürün</th><th>Süre</th><th>Bitiş</th><th>Durum</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((warranty) => {
              const isExpired = new Date(warranty.warranty_end_date) <= new Date() && warranty.status === 'Aktif'
              return (
                <tr key={warranty.id} className={isExpired ? 'bg-red-500/5' : ''}>
                  <td className="font-medium">{warranty.customer_name}</td>
                  <td>{warranty.item_name}</td>
                  <td>{warranty.warranty_months} ay</td>
                  <td>
                    {new Date(warranty.warranty_end_date).toLocaleDateString('tr-TR')}
                    {isExpired && <span className="text-red-400 text-xs ml-2">(Süresi Doldu)</span>}
                  </td>
                  <td><span className={`badge ${getStatusColor(warranty.status)}`}>{warranty.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      {warranty.status === 'Aktif' && (
                        <button onClick={() => handleStatusChange(warranty.id, 'İptal')} className="btn btn-sm btn-secondary">İptal</button>
                      )}
                      <button onClick={() => handleDelete(warranty.id)} className="btn btn-sm btn-danger">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Garanti bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Garanti Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri Adı *</label>
                  <input className="input" value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input className="input" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Garanti Süresi (Ay)</label>
                  <input className="input" type="number" value={form.warranty_months} onChange={(e) => setForm({...form, warranty_months: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bitiş Tarihi (Opsiyonel)</label>
                  <input className="input" type="date" value={form.warranty_end_date} onChange={(e) => setForm({...form, warranty_end_date: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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
            <tr>
              <th>Musteri</th>
              <th>Urun</th>
              <th>IMEI</th>
              <th>Baslangic</th>
              <th>Bitis</th>
              <th>Kalan Sure</th>
              <th>Durum</th>
              <th>Islemler</th>
            </tr>
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
                    <select
                      className="select text-sm py-1"
                      value={w.status}
                      onChange={(e) => handleStatusChange(w.id, e.target.value)}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Sona Erdi">Sona Erdi</option>
                      <option value="Iade Edildi">Iade Edildi</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleStatusChange(w.id, 'Iade Edildi')} className="btn btn-danger btn-sm">Iade</button>
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
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Phone, Edit2, Trash2, MessageCircle, X, CheckCircle, Clock, Wrench } from 'lucide-react'
import { useToast } from '@/components/toast'
import { ExportCSV } from '@/components/export-csv'
import { WhatsAppButton } from '@/components/whatsapp-button'
import Link from 'next/link'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { showToast, ToastComponent } = useToast()

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('services').select('*, customers(full_name, phone)').eq('user_id', user?.id).order('created_at', { ascending: false })
    if (!error) setServices(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('services').update({ status, completed_at: status === 'Tamamlandı' ? new Date().toISOString() : null }).eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Durum güncellendi: ' + status); fetchServices() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Servis kaydı silindi'); fetchServices() }
  }

  const filtered = services.filter(s =>
    (s.service_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.customers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.device_model?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? s.status === statusFilter : true)
  )

  const statusColors: Record<string, string> = {
    'Bekliyor': 'bg-yellow-100 text-yellow-700',
    'İşlemde': 'bg-blue-100 text-blue-700',
    'Tamamlandı': 'bg-green-100 text-green-700',
    'Teslim Edildi': 'bg-gray-100 text-gray-700',
    'İptal': 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-6 space-y-6">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teknik Servis</h1>
        <div className="flex gap-2">
          <ExportCSV data={services} filename="servisler.csv" />
          <Link href="/dashboard/services/new" className="btn-primary flex items-center gap-2">
            <Plus size={18}/> Yeni Servis
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
          <input className="input pl-10" placeholder="Servis no, müşteri, model ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="İşlemde">İşlemde</option>
          <option value="Tamamlandı">Tamamlandı</option>
          <option value="Teslim Edildi">Teslim Edildi</option>
          <option value="İptal">İptal</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="table-header">Servis No</th>
              <th className="table-header">Müşteri</th>
              <th className="table-header">Cihaz</th>
              <th className="table-header">Problem</th>
              <th className="table-header">Durum</th>
              <th className="table-header">Tutar</th>
              <th className="table-header">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="table-cell font-mono font-medium">{s.service_no}</td>
                <td className="table-cell">
                  <div className="font-medium">{s.customers?.full_name}</div>
                  <div className="text-xs text-gray-500">{s.customers?.phone}</div>
                </td>
                <td className="table-cell">{s.device_type} {s.device_model}</td>
                <td className="table-cell max-w-xs truncate">{s.problem}</td>
                <td className="table-cell">
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)} className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[s.status] || 'bg-gray-100'}`}>
                    <option value="Bekliyor">Bekliyor</option>
                    <option value="İşlemde">İşlemde</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                    <option value="İptal">İptal</option>
                  </select>
                </td>
                <td className="table-cell">{s.final_cost ? s.final_cost + ' ₺' : s.estimated_cost ? s.estimated_cost + ' ₺' : '-'}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <WhatsAppButton phone={s.customers?.phone} message={`Merhaba ${s.customers?.full_name}, ${s.service_no} nolu servis kaydınızın durumu: ${s.status}`} />
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">Servis kaydı bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

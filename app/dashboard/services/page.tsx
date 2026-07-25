'use client'
import { useState, useEffect } from 'react'
import { supabase, Service } from '@/lib/supabase'
import { Search, Plus, QrCode, Phone } from 'lucide-react'
import Link from 'next/link'
import BarcodeGenerator from '@/components/barcode-generator'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null)

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*, customers(full_name, phone)').order('created_at', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status }
    if (status === 'Tamamlandı') updates.completed_at = new Date().toISOString()
    await supabase.from('services').update(updates).eq('id', id)
    fetchServices()
  }

  const filtered = services.filter(s => s.service_no?.toLowerCase().includes(search.toLowerCase()) || s.device_type?.toLowerCase().includes(search.toLowerCase()) || s.customers?.full_name?.toLowerCase().includes(search.toLowerCase()))

  const statusColors: Record<string, string> = { 'Bekliyor': 'bg-yellow-100 text-yellow-700', 'İşlemde': 'bg-blue-100 text-blue-700', 'Tamamlandı': 'bg-green-100 text-green-700', 'Teslim Edildi': 'bg-purple-100 text-purple-700', 'İptal': 'bg-red-100 text-red-700' }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teknik Servis</h1>
        <Link href="/dashboard/services/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Servis</Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input className="input pl-10" placeholder="Servis no, cihaz veya müşteri ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {selectedBarcode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBarcode(null)}>
          <div className="bg-white p-6 rounded-xl" onClick={e => e.stopPropagation()}>
            <BarcodeGenerator value={selectedBarcode} text={selectedBarcode} />
            <button onClick={() => setSelectedBarcode(null)} className="mt-4 w-full btn-secondary">Kapat</button>
          </div>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Servis No</th><th className="table-header">Müşteri</th><th className="table-header">Cihaz</th><th className="table-header">Durum</th><th className="table-header">Tutar</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> :
             filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">Servis kaydı bulunamadı</td></tr> :
             filtered.map((service) => (
               <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell font-mono font-medium">{service.service_no}</td>
                 <td className="table-cell"><p className="font-medium">{service.customers?.full_name}</p><a href={`tel:${service.customers?.phone}`} className="text-xs text-green-600 flex items-center gap-1"><Phone size={12} /> {service.customers?.phone}</a></td>
                 <td className="table-cell">{service.device_type} {service.device_model}</td>
                 <td className="table-cell">
                   <select value={service.status} onChange={(e) => updateStatus(service.id, e.target.value)} className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColors[service.status] || 'bg-gray-100'}`}>
                     <option value="Bekliyor">Bekliyor</option><option value="İşlemde">İşlemde</option><option value="Tamamlandı">Tamamlandı</option><option value="Teslim Edildi">Teslim Edildi</option><option value="İptal">İptal</option>
                   </select>
                 </td>
                 <td className="table-cell">₺{service.final_cost || service.estimated_cost || 0}</td>
                 <td className="table-cell"><button onClick={() => setSelectedBarcode(service.service_no)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Barkod Göster"><QrCode size={16} /></button></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
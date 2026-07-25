'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewServicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ customer_id: '', device_type: '', device_model: '', imei: '', problem: '', estimated_cost: '', deposit: '', warranty_months: '0', notes: '' })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('id, full_name, phone').order('full_name')
    setCustomers(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const today = new Date()
    const prefix = `SRV-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}`
    const { count } = await supabase.from('services').select('*', { count: 'exact', head: true }).like('service_no', `${prefix}%`)
    const serviceNo = `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`
    const { error } = await supabase.from('services').insert([{
      ...formData, service_no: serviceNo, status: 'Bekliyor',
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      deposit: parseFloat(formData.deposit) || 0,
      warranty_months: parseInt(formData.warranty_months) || 0
    }])
    if (!error) { alert(`Servis kaydı oluşturuldu!\nServis No: ${serviceNo}`); router.push('/dashboard/services') }
    else alert('Hata: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/services" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Servis Kaydı</h1>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Müşteri *</label>
            <select className="input" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} required>
              <option value="">Müşteri seçin...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Cihaz Türü *</label><input className="input" placeholder="Örn: Telefon, Tablet, Laptop" value={formData.device_type} onChange={e => setFormData({...formData, device_type: e.target.value})} required /></div>
          <div><label className="block text-sm font-medium mb-1">Model</label><input className="input" placeholder="Örn: iPhone 14 Pro" value={formData.device_model} onChange={e => setFormData({...formData, device_model: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">IMEI/Seri No</label><input className="input" placeholder="IMEI veya Seri Numarası" value={formData.imei} onChange={e => setFormData({...formData, imei: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Tahmini Maliyet (₺)</label><input type="number" className="input" placeholder="0.00" value={formData.estimated_cost} onChange={e => setFormData({...formData, estimated_cost: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Kapora (₺)</label><input type="number" className="input" placeholder="0.00" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} /></div>
          <div><label className="block text-sm font-medium mb-1">Garanti (Ay)</label><input type="number" className="input" placeholder="0" value={formData.warranty_months} onChange={e => setFormData({...formData, warranty_months: e.target.value})} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Arıza Açıklaması *</label><textarea className="input" rows={3} placeholder="Müşterinin belirttiği arıza..." value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} required /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Notlar</label><textarea className="input" rows={2} placeholder="Teknisyen notları..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">{loading ? <Loader2 className="animate-spin" size={18} /> : 'Kaydet'}</button>
          <Link href="/dashboard/services" className="btn-secondary">İptal</Link>
        </div>
      </form>
    </div>
  )
}
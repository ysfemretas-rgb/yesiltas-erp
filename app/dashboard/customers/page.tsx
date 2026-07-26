'use client'
import { useState, useEffect } from 'react'
import { supabase, Customer } from '@/lib/supabase'
import { Search, Plus, Phone, Trash2, Edit } from 'lucide-react'
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', address: '', tc_no: '', notes: '' })
  useEffect(() => { fetchCustomers() }, [])
  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('customers').insert([formData])
    setFormData({ full_name: '', phone: '', email: '', address: '', tc_no: '', notes: '' })
    setShowForm(false)
    fetchCustomers()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('customers').delete().eq('id', id)
    fetchCustomers()
  }
  const filtered = customers.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.tc_no?.includes(search))
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h1><button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Yeni Müşteri</button></div>
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Yeni Müşteri Ekle</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Ad Soyad *" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
            <input className="input" placeholder="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input className="input" placeholder="E-posta" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input className="input" placeholder="TC Kimlik No" value={formData.tc_no} onChange={e => setFormData({...formData, tc_no: e.target.value})} />
            <input className="input md:col-span-2" placeholder="Adres" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <textarea className="input md:col-span-2" placeholder="Notlar" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            <div className="md:col-span-2 flex gap-2"><button type="submit" className="btn-primary">Kaydet</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">İptal</button></div>
          </form>
        </div>
      )}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input className="input pl-10" placeholder="Müşteri ara..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="table-header">Ad Soyad</th><th className="table-header">Telefon</th><th className="table-header">E-posta</th><th className="table-header">İşlemler</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">Yükleniyor...</td></tr> : filtered.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">Müşteri bulunamadı</td></tr> :
             filtered.map((customer) => (
               <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                 <td className="table-cell font-medium">{customer.full_name}</td>
                 <td className="table-cell"><a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-green-600 hover:text-green-700"><Phone size={14} /> {customer.phone}</a></td>
                 <td className="table-cell">{customer.email || '-'}</td>
                 <td className="table-cell"><div className="flex items-center gap-2"><button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button><button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
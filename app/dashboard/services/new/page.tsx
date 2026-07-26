'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useToast } from '@/components/toast'
import Link from 'next/link'

const PHONE_MODELS = [
  'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
  'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
  'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13 mini','iPhone 13',
  'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12 mini','iPhone 12',
  'iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11','iPhone SE (3. nesil)',
  'iPhone XS Max','iPhone XS','iPhone XR','iPhone X',
  'Samsung Galaxy S24 Ultra','Samsung Galaxy S24+','Samsung Galaxy S24',
  'Samsung Galaxy S23 Ultra','Samsung Galaxy S23+','Samsung Galaxy S23',
  'Samsung Galaxy S22 Ultra','Samsung Galaxy S22+','Samsung Galaxy S22',
  'Samsung Galaxy Z Fold 5','Samsung Galaxy Z Flip 5',
  'Samsung Galaxy A73','Samsung Galaxy A54','Samsung Galaxy A34',
  'Samsung Galaxy Note 20 Ultra','Samsung Galaxy Note 20',
  'Xiaomi 14 Ultra','Xiaomi 14','Xiaomi 13T Pro','Xiaomi 13T',
  'Xiaomi Redmi Note 13 Pro+','Xiaomi Redmi Note 13 Pro','Xiaomi Redmi Note 13',
  'Xiaomi Redmi 12','Xiaomi Poco F5 Pro','Xiaomi Poco X6 Pro',
  'Oppo Find X7 Ultra','Oppo Find X6 Pro','Oppo Reno 11 Pro',
  'Oppo Reno 11','Oppo Reno 10','Oppo A98','Oppo A78',
  'Vivo X100 Pro','Vivo X90 Pro','Vivo V29 Pro','Vivo V29',
  'Vivo Y36','Vivo Y27','Vivo T2 Pro',
  'Realme GT 5 Pro','Realme GT Neo 5','Realme 11 Pro+','Realme 11',
  'Realme C67','Realme C53',
  'Huawei P60 Pro','Huawei P60','Huawei Mate 60 Pro','Huawei Mate 60',
  'Huawei Nova 11 Pro','Huawei Nova 11',
  'Honor Magic 6 Pro','Honor Magic 6','Honor 90 Pro','Honor 90',
  'Honor X9b','Honor X8a',
  'Google Pixel 8 Pro','Google Pixel 8','Google Pixel 7a',
  'OnePlus 12','OnePlus 12R','OnePlus 11','OnePlus Nord 3',
  'Nothing Phone (2)','Nothing Phone (2a)',
  'Asus ROG Phone 8','Asus Zenfone 10',
  'Motorola Edge 40 Pro','Motorola Edge 40','Motorola G84',
  'Nokia G60','Nokia X30','Nokia C32',
  'General Mobile GM 24 Pro','General Mobile GM 24','General Mobile GM 23',
  'Reeder S19 Max','Reeder S19 Pro','Reeder S19',
  'Casper VIA X40','Casper VIA X30','Casper VIA F30',
  'Tecno Phantom V2 Fold','Tecno Camon 20 Premier','Tecno Pova 5 Pro',
  'Infinix Zero 30','Infinix Note 30 VIP','Infinix Hot 40',
  'TCL 40 NXTpaper','TCL 40 XE','TCL 30 SE',
  'Alcatel 1V','Alcatel 3L','Alcatel 1S',
  'Diğer'
]

export default function NewServicePage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [form, setForm] = useState({
    device_type: 'Telefon',
    device_model: '',
    problem: '',
    estimated_cost: '',
    final_cost: '',
    status: 'Bekliyor',
    notes: ''
  })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('customers').select('*').eq('user_id', user?.id).order('full_name')
    setCustomers(data || [])
  }

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone?.includes(searchCustomer)
  )

  const filteredModels = PHONE_MODELS.filter(m =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) { showToast('Müşteri seçin', 'error'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const serviceNo = 'SRV-' + Date.now().toString().slice(-6)
    const payload = {
      service_no: serviceNo,
      customer_id: selectedCustomer.id,
      user_id: user.id,
      ...form,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      final_cost: form.final_cost ? parseFloat(form.final_cost) : null
    }

    const { error } = await supabase.from('services').insert([payload])
    if (error) showToast('Hata: ' + error.message, 'error')
    else {
      showToast('Servis kaydı oluşturuldu: ' + serviceNo)
      setForm({ device_type: 'Telefon', device_model: '', problem: '', estimated_cost: '', final_cost: '', status: 'Bekliyor', notes: '' })
      setSelectedCustomer(null)
      setSearchCustomer('')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {ToastComponent}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/services" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20}/></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Servis Kaydı</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {/* Müşteri Seçimi */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Müşteri *</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
              <div><span className="font-medium">{selectedCustomer.full_name}</span> <span className="text-gray-500">{selectedCustomer.phone}</span></div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-green-100 rounded"><X size={16}/></button>
            </div>
          ) : (
            <div className="space-y-2">
              <input className="input" placeholder="Müşteri ara (ad veya telefon)..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
              {searchCustomer && filteredCustomers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCustomer(c); setSearchCustomer('') }} className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0">
                      <div className="font-medium">{c.full_name}</div>
                      <div className="text-sm text-gray-500">{c.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cihaz Modeli Dropdown */}
        <div className="space-y-2 relative">
          <label className="text-sm font-medium text-gray-700">Cihaz Modeli *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input
              className="input pl-10"
              placeholder="Model ara (örn: iPhone 15)..."
              value={modelSearch}
              onChange={e => { setModelSearch(e.target.value); setShowModelDropdown(true) }}
              onFocus={() => setShowModelDropdown(true)}
            />
            {form.device_model && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{form.device_model}</span>}
          </div>
          {showModelDropdown && modelSearch && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {filteredModels.map(m => (
                <button key={m} type="button" onClick={() => { setForm({...form, device_model: m}); setModelSearch(m); setShowModelDropdown(false) }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                  {m}
                </button>
              ))}
              {filteredModels.length === 0 && <div className="p-3 text-gray-500 text-sm">Model bulunamadı</div>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cihaz Türü</label>
            <select className="input" value={form.device_type} onChange={e => setForm({...form, device_type: e.target.value})}>
              <option>Telefon</option><option>Tablet</option><option>Laptop</option><option>Aksesuar</option><option>Diğer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tahmini Maliyet (₺)</label>
            <input className="input" type="number" placeholder="0.00" value={form.estimated_cost} onChange={e => setForm({...form, estimated_cost: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Problem / Şikayet *</label>
          <textarea className="input" rows={3} placeholder="Müşterinin şikayeti..." value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Notlar</label>
          <textarea className="input" rows={2} placeholder="Ek notlar..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/services" className="btn-secondary">İptal</Link>
          <button type="submit" className="btn-primary">Kaydet</button>
        </div>
      </form>
    </div>
  )
}

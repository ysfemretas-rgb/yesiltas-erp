'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, Search } from 'lucide-react'
import { useToast } from '@/components/toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const phoneModels = [
  // iPhone
  'iPhone 6', 'iPhone 6 Plus', 'iPhone 6s', 'iPhone 6s Plus',
  'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
  'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 Mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 Mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
  'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'iPhone SE (1.Nesil)', 'iPhone SE (2.Nesil)', 'iPhone SE (3.Nesil)',
  // Samsung S Serisi
  'Samsung Galaxy S8', 'Samsung Galaxy S8+', 'Samsung Galaxy S9', 'Samsung Galaxy S9+',
  'Samsung Galaxy S10', 'Samsung Galaxy S10+', 'Samsung Galaxy S10e',
  'Samsung Galaxy S20', 'Samsung Galaxy S20+', 'Samsung Galaxy S20 Ultra', 'Samsung Galaxy S20 FE',
  'Samsung Galaxy S21', 'Samsung Galaxy S21+', 'Samsung Galaxy S21 Ultra', 'Samsung Galaxy S21 FE',
  'Samsung Galaxy S22', 'Samsung Galaxy S22+', 'Samsung Galaxy S22 Ultra',
  'Samsung Galaxy S23', 'Samsung Galaxy S23+', 'Samsung Galaxy S23 Ultra', 'Samsung Galaxy S23 FE',
  'Samsung Galaxy S24', 'Samsung Galaxy S24+', 'Samsung Galaxy S24 Ultra',
  // Samsung A Serisi
  'Samsung Galaxy A10', 'Samsung Galaxy A20', 'Samsung Galaxy A30', 'Samsung Galaxy A50',
  'Samsung Galaxy A51', 'Samsung Galaxy A52', 'Samsung Galaxy A52s', 'Samsung Galaxy A53', 'Samsung Galaxy A54', 'Samsung Galaxy A55',
  'Samsung Galaxy A70', 'Samsung Galaxy A71', 'Samsung Galaxy A72', 'Samsung Galaxy A73',
  'Samsung Galaxy A14', 'Samsung Galaxy A24', 'Samsung Galaxy A34', 'Samsung Galaxy A35',
  // Samsung Note / Z
  'Samsung Galaxy Note 8', 'Samsung Galaxy Note 9', 'Samsung Galaxy Note 10', 'Samsung Galaxy Note 10+', 'Samsung Galaxy Note 20', 'Samsung Galaxy Note 20 Ultra',
  'Samsung Galaxy Z Fold 2', 'Samsung Galaxy Z Fold 3', 'Samsung Galaxy Z Fold 4', 'Samsung Galaxy Z Fold 5', 'Samsung Galaxy Z Fold 6',
  'Samsung Galaxy Z Flip', 'Samsung Galaxy Z Flip 3', 'Samsung Galaxy Z Flip 4', 'Samsung Galaxy Z Flip 5', 'Samsung Galaxy Z Flip 6',
  // Samsung M Serisi
  'Samsung Galaxy M12', 'Samsung Galaxy M13', 'Samsung Galaxy M14', 'Samsung Galaxy M20', 'Samsung Galaxy M21', 'Samsung Galaxy M31', 'Samsung Galaxy M32', 'Samsung Galaxy M33', 'Samsung Galaxy M51', 'Samsung Galaxy M52', 'Samsung Galaxy M53',
  // Xiaomi
  'Xiaomi Mi 9', 'Xiaomi Mi 10', 'Xiaomi Mi 10T', 'Xiaomi Mi 11', 'Xiaomi Mi 11T', 'Xiaomi 12', 'Xiaomi 12T', 'Xiaomi 12 Pro', 'Xiaomi 13', 'Xiaomi 13T', 'Xiaomi 13 Pro', 'Xiaomi 14', 'Xiaomi 14T', 'Xiaomi 14 Pro',
  'Redmi Note 8', 'Redmi Note 9', 'Redmi Note 9 Pro', 'Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 11', 'Redmi Note 11 Pro', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 13', 'Redmi Note 13 Pro',
  'Redmi 9', 'Redmi 9A', 'Redmi 9C', 'Redmi 10', 'Redmi 10A', 'Redmi 10C', 'Redmi 12', 'Redmi 12C', 'Redmi 13', 'Redmi 13C',
  'POCO F3', 'POCO F4', 'POCO F5', 'POCO F6', 'POCO X3', 'POCO X3 Pro', 'POCO X4', 'POCO X4 Pro', 'POCO X5', 'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO M3', 'POCO M4', 'POCO M5', 'POCO M6',
  // Oppo
  'Oppo A15', 'Oppo A16', 'Oppo A17', 'Oppo A18', 'Oppo A52', 'Oppo A53', 'Oppo A54', 'Oppo A55', 'Oppo A57', 'Oppo A58', 'Oppo A72', 'Oppo A73', 'Oppo A74', 'Oppo A76', 'Oppo A77', 'Oppo A78', 'Oppo A79', 'Oppo A91', 'Oppo A92', 'Oppo A93', 'Oppo A94', 'Oppo A96', 'Oppo A98',
  'Oppo Reno 4', 'Oppo Reno 5', 'Oppo Reno 6', 'Oppo Reno 7', 'Oppo Reno 8', 'Oppo Reno 8T', 'Oppo Reno 9', 'Oppo Reno 10', 'Oppo Reno 10 Pro', 'Oppo Reno 11', 'Oppo Reno 11 Pro', 'Oppo Reno 12', 'Oppo Reno 12 Pro',
  'Oppo Find X3', 'Oppo Find X3 Pro', 'Oppo Find X5', 'Oppo Find X5 Pro', 'Oppo Find X6', 'Oppo Find X6 Pro', 'Oppo Find X7', 'Oppo Find X7 Ultra',
  // vivo
  'vivo Y11', 'vivo Y12', 'vivo Y15', 'vivo Y17', 'vivo Y19', 'vivo Y20', 'vivo Y21', 'vivo Y22', 'vivo Y30', 'vivo Y33', 'vivo Y35', 'vivo Y50', 'vivo Y51', 'vivo Y53', 'vivo Y55', 'vivo Y72', 'vivo Y76', 'vivo Y81', 'vivo Y91',
  'vivo V21', 'vivo V23', 'vivo V25', 'vivo V27', 'vivo V29', 'vivo V30', 'vivo V40',
  'vivo X60', 'vivo X70', 'vivo X80', 'vivo X90', 'vivo X100',
  // realme
  'realme C11', 'realme C15', 'realme C21', 'realme C25', 'realme C30', 'realme C35', 'realme C53', 'realme C55', 'realme C61', 'realme C67',
  'realme 6', 'realme 7', 'realme 8', 'realme 8 Pro', 'realme 9', 'realme 9 Pro', 'realme 9 Pro+', 'realme 10', 'realme 10 Pro', 'realme 11', 'realme 11 Pro', 'realme 12', 'realme 12 Pro',
  'realme GT', 'realme GT 2', 'realme GT 2 Pro', 'realme GT 3', 'realme GT 6', 'realme GT Neo', 'realme GT Neo 2', 'realme GT Neo 3', 'realme GT Neo 5',
  // General Mobile
  'General Mobile GM 5', 'General Mobile GM 6', 'General Mobile GM 8', 'General Mobile GM 9 Pro', 'General Mobile GM 20', 'General Mobile GM 21', 'General Mobile GM 22', 'General Mobile GM 23', 'General Mobile GM 24', 'General Mobile GM 24 Pro', 'General Mobile Discovery', 'General Mobile Discovery Elite', 'General Mobile Discovery Air',
  // Huawei
  'Huawei P20', 'Huawei P20 Pro', 'Huawei P30', 'Huawei P30 Pro', 'Huawei P40', 'Huawei P40 Pro', 'Huawei P50', 'Huawei P50 Pro', 'Huawei P60', 'Huawei P60 Pro',
  'Huawei Mate 20', 'Huawei Mate 20 Pro', 'Huawei Mate 30', 'Huawei Mate 30 Pro', 'Huawei Mate 40', 'Huawei Mate 40 Pro', 'Huawei Mate 50', 'Huawei Mate 50 Pro', 'Huawei Mate 60', 'Huawei Mate 60 Pro',
  'Huawei Nova 5T', 'Huawei Nova 7', 'Huawei Nova 8', 'Huawei Nova 9', 'Huawei Nova 10', 'Huawei Nova 11',
  'Huawei Y6', 'Huawei Y6p', 'Huawei Y7', 'Huawei Y7p', 'Huawei Y8p', 'Huawei Y9',
  // Honor
  'Honor 8X', 'Honor 9X', 'Honor 10', 'Honor 10X', 'Honor 20', 'Honor 20 Pro', 'Honor 50', 'Honor 50 Pro', 'Honor 70', 'Honor 70 Pro', 'Honor 90', 'Honor 90 Pro', 'Honor 100', 'Honor 200', 'Honor 200 Pro',
  'Honor Magic 4', 'Honor Magic 4 Pro', 'Honor Magic 5', 'Honor Magic 5 Pro', 'Honor Magic 6', 'Honor Magic 6 Pro',
  'Honor X6', 'Honor X7', 'Honor X7a', 'Honor X8', 'Honor X8a', 'Honor X9', 'Honor X9a', 'Honor X9b',
  // Casper
  'Casper VIA A3', 'Casper VIA A4', 'Casper VIA E3', 'Casper VIA F1', 'Casper VIA F2', 'Casper VIA F3', 'Casper VIA G1', 'Casper VIA G1 Plus', 'Casper VIA G2', 'Casper VIA G3', 'Casper VIA G4', 'Casper VIA M1', 'Casper VIA M2', 'Casper VIA M3', 'Casper VIA M4', 'Casper VIA P1', 'Casper VIA P2', 'Casper VIA P3', 'Casper VIA S', 'Casper VIA X30',
  // Reeder
  'Reeder P13', 'Reeder P13 Blue', 'Reeder P13 Blue Max', 'Reeder P13 Blue Max Pro', 'Reeder P13 Blue Max Lite', 'Reeder P13 Pro', 'Reeder P13 Pro Max', 'Reeder S19', 'Reeder S19 Max', 'Reeder S19 Max Pro', 'Reeder S23', 'Reeder S23 Max', 'Reeder S23 Max Pro',
  // Nokia
  'Nokia 5.1', 'Nokia 5.3', 'Nokia 5.4', 'Nokia 6.1', 'Nokia 6.2', 'Nokia 7.1', 'Nokia 7.2', 'Nokia 8.1', 'Nokia 8.3', 'Nokia G10', 'Nokia G11', 'Nokia G20', 'Nokia G21', 'Nokia G50', 'Nokia G60', 'Nokia X10', 'Nokia X20', 'Nokia X30', 'Nokia XR20',
  // Motorola
  'Motorola Moto E7', 'Motorola Moto E20', 'Motorola Moto E32', 'Motorola Moto E40',
  'Motorola Moto G8', 'Motorola Moto G8 Power', 'Motorola Moto G9', 'Motorola Moto G9 Power', 'Motorola Moto G10', 'Motorola Moto G20', 'Motorola Moto G30', 'Motorola Moto G31', 'Motorola Moto G32', 'Motorola Moto G40', 'Motorola Moto G50', 'Motorola Moto G51', 'Motorola Moto G52', 'Motorola Moto G53', 'Motorola Moto G54', 'Motorola Moto G60', 'Motorola Moto G62', 'Motorola Moto G71', 'Motorola Moto G72', 'Motorola Moto G73', 'Motorola Moto G84', 'Motorola Moto G100',
  'Motorola Edge 20', 'Motorola Edge 30', 'Motorola Edge 40', 'Motorola Edge 40 Pro', 'Motorola Edge 50', 'Motorola Edge 50 Pro', 'Motorola Edge 50 Ultra',
  // OnePlus
  'OnePlus 6', 'OnePlus 6T', 'OnePlus 7', 'OnePlus 7 Pro', 'OnePlus 7T', 'OnePlus 8', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 9', 'OnePlus 9 Pro', 'OnePlus 9R', 'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 11', 'OnePlus 12',
  'OnePlus Nord', 'OnePlus Nord 2', 'OnePlus Nord 2T', 'OnePlus Nord 3', 'OnePlus Nord 4', 'OnePlus Nord CE', 'OnePlus Nord CE 2', 'OnePlus Nord CE 3', 'OnePlus Nord CE 4', 'OnePlus Nord N10', 'OnePlus Nord N20', 'OnePlus Nord N30',
  // Google Pixel
  'Google Pixel 3', 'Google Pixel 3 XL', 'Google Pixel 4', 'Google Pixel 4 XL', 'Google Pixel 4a', 'Google Pixel 5', 'Google Pixel 5a', 'Google Pixel 6', 'Google Pixel 6 Pro', 'Google Pixel 6a', 'Google Pixel 7', 'Google Pixel 7 Pro', 'Google Pixel 7a', 'Google Pixel 8', 'Google Pixel 8 Pro', 'Google Pixel 8a', 'Google Pixel 9', 'Google Pixel 9 Pro', 'Google Pixel 9 Pro XL',
  // Sony
  'Sony Xperia 1', 'Sony Xperia 1 II', 'Sony Xperia 1 III', 'Sony Xperia 1 IV', 'Sony Xperia 1 V', 'Sony Xperia 1 VI',
  'Sony Xperia 5', 'Sony Xperia 5 II', 'Sony Xperia 5 III', 'Sony Xperia 5 IV', 'Sony Xperia 5 V',
  'Sony Xperia 10', 'Sony Xperia 10 II', 'Sony Xperia 10 III', 'Sony Xperia 10 IV', 'Sony Xperia 10 V',
  // Asus
  'Asus Zenfone 6', 'Asus Zenfone 7', 'Asus Zenfone 8', 'Asus Zenfone 8 Flip', 'Asus Zenfone 9', 'Asus Zenfone 10', 'Asus Zenfone 11 Ultra',
  'Asus ROG Phone 3', 'Asus ROG Phone 5', 'Asus ROG Phone 6', 'Asus ROG Phone 7', 'Asus ROG Phone 8', 'Asus ROG Phone 8 Pro',
  // Nothing
  'Nothing Phone (1)', 'Nothing Phone (2)', 'Nothing Phone (2a)',
  // Diğer
  'Tecno Spark 10', 'Tecno Spark 10 Pro', 'Tecno Spark 20', 'Tecno Spark 20 Pro', 'Tecno Pova 5', 'Tecno Pova 5 Pro',
  'Infinix Hot 30', 'Infinix Hot 40', 'Infinix Note 30', 'Infinix Note 40', 'Infinix Zero 30', 'Infinix Zero 40',
  'Alcatel 1S', 'Alcatel 3L', 'Alcatel 3X', 'Alcatel 5X',
  'Hometech Alfa 10', 'Hometech Alfa 10V', 'Hometech Alfa 10X',
  'TCL 10 SE', 'TCL 20 SE', 'TCL 20 Pro', 'TCL 30 SE', 'TCL 40 SE', 'TCL 40 X',
  'Lenovo K12', 'Lenovo K13', 'Lenovo K14',
  'ZTE Blade A51', 'ZTE Blade A71', 'ZTE Blade V40',
  'Vestel Venus E4', 'Vestel Venus GO', 'Vestel Venus V3', 'Vestel Venus V4', 'Vestel Venus V5', 'Vestel Venus V6', 'Vestel Venus V7', 'Vestel Venus Z10', 'Vestel Venus Z20', 'Vestel Venus Z30', 'Vestel Venus Z40',
  // Tablet
  'iPad (5.Nesil)', 'iPad (6.Nesil)', 'iPad (7.Nesil)', 'iPad (8.Nesil)', 'iPad (9.Nesil)', 'iPad (10.Nesil)',
  'iPad Air 2', 'iPad Air 3', 'iPad Air 4', 'iPad Air 5', 'iPad Air (M2)',
  'iPad Mini 4', 'iPad Mini 5', 'iPad Mini 6',
  'iPad Pro 9.7', 'iPad Pro 10.5', 'iPad Pro 11 (1.Nesil)', 'iPad Pro 11 (2.Nesil)', 'iPad Pro 11 (3.Nesil)', 'iPad Pro 11 (4.Nesil)', 'iPad Pro 12.9 (1.Nesil)', 'iPad Pro 12.9 (2.Nesil)', 'iPad Pro 12.9 (3.Nesil)', 'iPad Pro 12.9 (4.Nesil)', 'iPad Pro 12.9 (5.Nesil)', 'iPad Pro 12.9 (6.Nesil)',
  'Samsung Galaxy Tab A7', 'Samsung Galaxy Tab A8', 'Samsung Galaxy Tab A9', 'Samsung Galaxy Tab A9+',
  'Samsung Galaxy Tab S6', 'Samsung Galaxy Tab S6 Lite', 'Samsung Galaxy Tab S7', 'Samsung Galaxy Tab S7+', 'Samsung Galaxy Tab S7 FE', 'Samsung Galaxy Tab S8', 'Samsung Galaxy Tab S8+', 'Samsung Galaxy Tab S8 Ultra', 'Samsung Galaxy Tab S9', 'Samsung Galaxy Tab S9+', 'Samsung Galaxy Tab S9 Ultra',
  'Lenovo Tab M10', 'Lenovo Tab M10 Plus', 'Lenovo Tab P11', 'Lenovo Tab P11 Pro',
  'Xiaomi Pad 5', 'Xiaomi Pad 5 Pro', 'Xiaomi Pad 6', 'Xiaomi Pad 6 Pro', 'Xiaomi Pad 6S Pro'
]

export default function NewServicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [searchModel, setSearchModel] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [form, setForm] = useState({
    service_no: '', customer_id: '', device_type: 'Telefon', device_model: '', imei: '',
    problem: '', diagnosis: '', estimated_cost: '', deposit: '', warranty_months: '0',
    technician: '', notes: ''
  })
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetchCustomers()
    generateServiceNo()
  }, [])

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('customers').select('id, full_name, phone').eq('user_id', user?.id).order('full_name')
    setCustomers(data || [])
  }

  const generateServiceNo = async () => {
    const today = new Date()
    const prefix = 'SV-' + today.getFullYear().toString().slice(-2) + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0') + '-'
    const { data: { user } } = await supabase.auth.getUser()
    const { count } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', user?.id).ilike('service_no', prefix + '%')
    const no = prefix + String((count || 0) + 1).padStart(3, '0')
    setForm(prev => ({ ...prev, service_no: no }))
  }

  const filteredModels = phoneModels.filter(m => m.toLowerCase().includes(searchModel.toLowerCase()))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Oturum bulunamadı', 'error'); return }

    const payload = {
      ...form,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      deposit: parseFloat(form.deposit) || 0,
      warranty_months: parseInt(form.warranty_months) || 0,
      user_id: user.id
    }
    const { error } = await supabase.from('services').insert([payload])
    if (error) showToast('Hata: ' + error.message, 'error')
    else { showToast('Servis kaydı oluşturuldu'); router.push('/dashboard/services') }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {ToastComponent}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/services" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft size={20}/></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Servis Kaydı</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Servis No</label>
            <input className="input bg-gray-100" value={form.service_no} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Müşteri *</label>
            <select className="input" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
              <option value="">Seçiniz</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cihaz Türü</label>
            <select className="input" value={form.device_type} onChange={e => setForm({...form, device_type: e.target.value})}>
              <option>Telefon</option>
              <option>Tablet</option>
              <option>Bilgisayar</option>
              <option>Aksesuar</option>
              <option>Diğer</option>
            </select>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Cihaz Modeli</label>
            <div className="relative">
              <input className="input pr-8" placeholder="Model ara..." value={searchModel} onChange={e => { setSearchModel(e.target.value); setShowModelDropdown(true) }} onFocus={() => setShowModelDropdown(true)} />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            </div>
            {showModelDropdown && searchModel && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredModels.slice(0, 50).map(m => (
                  <button key={m} type="button" className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm" onClick={() => { setForm({...form, device_model: m}); setSearchModel(m); setShowModelDropdown(false) }}>
                    {m}
                  </button>
                ))}
                {filteredModels.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">Sonuç bulunamadı</div>}
              </div>
            )}
            {form.device_model && <div className="mt-1 text-sm text-green-600 font-medium">Seçilen: {form.device_model}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IMEI / Seri No</label>
            <input className="input" placeholder="IMEI" value={form.imei} onChange={e => setForm({...form, imei: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teknisyen</label>
            <input className="input" placeholder="Teknisyen adı" value={form.technician} onChange={e => setForm({...form, technician: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tahmini Maliyet (₺)</label>
            <input className="input" type="number" placeholder="0" value={form.estimated_cost} onChange={e => setForm({...form, estimated_cost: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kapora (₺)</label>
            <input className="input" type="number" placeholder="0" value={form.deposit} onChange={e => setForm({...form, deposit: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Garanti (Ay)</label>
            <input className="input" type="number" placeholder="0" value={form.warranty_months} onChange={e => setForm({...form, warranty_months: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Arıza / Problem *</label>
          <textarea className="input" placeholder="Müşterinin belirttiği arıza" value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} required rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teshis / Notlar</label>
          <textarea className="input" placeholder="Teknisyen teshisi" value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} rows={3} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Link href="/dashboard/services" className="btn-secondary">İptal</Link>
          <button type="submit" className="btn-primary flex items-center gap-2"><Save size={18}/> Kaydet</button>
        </div>
      </form>
    </div>
  )
}

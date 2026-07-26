'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  created_at: string
}

interface Debt {
  id: string
  customer_id: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  due_date: string | null
  created_at: string
  source_type: string
}

interface Payment {
  id: string
  customer_id: string
  amount: number
  payment_method: string
  notes: string | null
  created_at: string
}

interface Device {
  id: string
  customer_id: string
  customer_name: string
  brand: string
  model: string
  imei: string
  complaint: string
  final_cost: number
  status: string
  created_at: string
  delivery_date: string | null
}

interface Sale {
  id: string
  customer_id: string
  customer_name: string
  total_price: number
  payment_method: string
  notes: string | null
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Nakit',
    notes: ''
  })

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [custRes, debtRes, payRes, devRes, saleRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('debts').select('*'),
        supabase.from('customer_payments').select('*').order('created_at', { ascending: false }),
        supabase.from('devices').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('created_at', { ascending: false })
      ])

      if (custRes.data) setCustomers(custRes.data)
      if (debtRes.data) setDebts(debtRes.data)
      if (payRes.data) setPayments(payRes.data)
      if (devRes.data) setDevices(devRes.data)
      if (saleRes.data) setSales(saleRes.data)
    } catch (err: any) {
      console.error('Veri yükleme hatası:', err)
    }
    setLoading(false)
  }

  const getCustomerDebts = (customerId: string) => {
    return debts.filter(d => d.customer_id === customerId)
  }

  const getCustomerPayments = (customerId: string) => {
    return payments.filter(p => p.customer_id === customerId)
  }

  const getCustomerDevices = (customerId: string) => {
    return devices.filter(d => d.customer_id === customerId)
  }

  const getCustomerSales = (customerId: string) => {
    return sales.filter(s => s.customer_id === customerId)
  }

  const getTotalDebt = (customerId: string) => {
    return getCustomerDebts(customerId).reduce((sum, d) => sum + (d.remaining_amount || 0), 0)
  }

  const getTotalPaid = (customerId: string) => {
    return getCustomerPayments(customerId).reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getAllTransactions = (customerId: string) => {
    const trans: any[] = []

    // Borçlar
    getCustomerDebts(customerId).forEach(d => {
      trans.push({
        type: 'Borç',
        date: d.created_at,
        amount: d.total_amount,
        remaining: d.remaining_amount,
        status: d.status,
        detail: d.source_type || 'Genel'
      })
    })

    // Ödemeler
    getCustomerPayments(customerId).forEach(p => {
      trans.push({
        type: 'Ödeme',
        date: p.created_at,
        amount: p.amount,
        method: p.payment_method,
        notes: p.notes,
        detail: p.notes || 'Müşteri Ödemesi'
      })
    })

    // Cihazlar (Teknik Servis)
    getCustomerDevices(customerId).forEach(d => {
      trans.push({
        type: 'Teknik Servis',
        date: d.created_at,
        amount: d.final_cost,
        status: d.status,
        detail: `${d.brand} ${d.model} - ${d.complaint}`
      })
    })

    // Satışlar
    getCustomerSales(customerId).forEach(s => {
      trans.push({
        type: 'Satış',
        date: s.created_at,
        amount: s.total_price,
        method: s.payment_method,
        detail: s.notes || 'Ürün Satışı'
      })
    })

    // Tarihe göre sırala (en yeni üstte)
    return trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setToast({ message: 'Ad Soyad alanı zorunludur!', type: 'error' })
      return
    }

    if (!form.phone.trim()) {
      setToast({ message: 'Telefon alanı zorunludur!', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const insertData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select()

      if (error) {
        setToast({ message: `HATA: ${error.message} (Kod: ${error.code})`, type: 'error' })
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setToast({ message: 'HATA: Sunucudan veri dönmedi!', type: 'error' })
        setLoading(false)
        return
      }

      setCustomers(prev => [data[0], ...prev])
      setToast({ message: `✅ ${data[0].name} başarıyla eklendi!`, type: 'success' })
      setShowModal(false)
      setForm({ name: '', phone: '', email: '', address: '' })
      await loadData()
    } catch (err: any) {
      setToast({ message: `BEKLENMEYEN HATA: ${err.message}`, type: 'error' })
    }
    setLoading(false)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      setToast({ message: 'Geçerli bir tutar girin!', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const { error: payError } = await supabase.from('customer_payments').insert([{
        customer_id: selectedCustomer.id,
        amount: amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || null
      }])

      if (payError) {
        setToast({ message: `Ödeme kaydedilemedi: ${payError.message}`, type: 'error' })
        setLoading(false)
        return
      }

      await supabase.from('transactions').insert([{
        type: 'Gelir',
        category: 'Müşteri Ödemesi',
        amount: amount,
        description: `${selectedCustomer.name} - Müşteri Ödemesi`,
        payment_method: paymentForm.payment_method
      }])

      const customerDebts = getCustomerDebts(selectedCustomer.id)
        .filter(d => d.remaining_amount > 0)
        .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())

      let remainingPayment = amount
      for (const debt of customerDebts) {
        if (remainingPayment <= 0) break
        const payAmount = Math.min(remainingPayment, debt.remaining_amount)

        await supabase.from('debts').update({
          paid_amount: (debt.paid_amount || 0) + payAmount,
          remaining_amount: debt.remaining_amount - payAmount,
          status: debt.remaining_amount - payAmount <= 0 ? 'Ödendi' : 'Kısmi'
        }).eq('id', debt.id)

        remainingPayment -= payAmount
      }

      setToast({ message: `₺${amount.toLocaleString('tr-TR')} ödeme alındı!`, type: 'success' })
      setShowPaymentModal(false)
      setPaymentForm({ amount: '', payment_method: 'Nakit', notes: '' })
      loadData()
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return

    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      setToast({ message: `Silme hatası: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Müşteri silindi!', type: 'success' })
      setCustomers(prev => prev.filter(c => c.id !== id))
    }
  }

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg animate-fade-in max-w-md ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        } text-white`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 text-white/70 hover:text-white text-lg">×</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Müşteriler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Müşteri</button>
      </div>

      <input
        type="text"
        className="input max-w-md"
        placeholder="İsim veya telefon ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>Toplam Borç</th>
              <th>Toplam Ödeme</th>
              <th>Kalan</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => {
              const totalDebt = getTotalDebt(customer.id)
              const totalPaid = getTotalPaid(customer.id)
              const remaining = totalDebt - totalPaid

              return (
                <tr key={customer.id}>
                  <td 
                    className="font-medium text-white cursor-pointer hover:text-emerald-400 transition-colors"
                    onClick={() => openDetail(customer)}
                    title="Detayları gör"
                  >
                    {customer.name}
                  </td>
                  <td className="text-slate-300">{customer.phone}</td>
                  <td className="text-red-400">₺{totalDebt.toLocaleString('tr-TR')}</td>
                  <td className="text-emerald-400">₺{totalPaid.toLocaleString('tr-TR')}</td>
                  <td className={remaining > 0 ? 'text-yellow-400 font-bold' : 'text-emerald-400'}>
                    ₺{remaining.toLocaleString('tr-TR')}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedCustomer(customer); setShowPaymentModal(true) }}
                        className="btn btn-primary btn-sm"
                      >
                        💰 Ödeme Al
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="empty-state">
          <p>Henüz müşteri kaydı yok</p>
        </div>
      )}

      {/* Yeni Müşteri Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Yeni Müşteri</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="modal-body">
                <div className="form-group">
                  <label>Ad Soyad *</label>
                  <input
                    className="input"
                    name="musteri-ad"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Müşteri adı soyadı"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon *</label>
                  <input
                    className="input"
                    name="musteri-tel"
                    type="tel"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="05XX XXX XX XX"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input
                    className="input"
                    name="musteri-mail"
                    type="email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <textarea
                    className="input"
                    name="musteri-adres"
                    rows={3}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    placeholder="Adres bilgisi..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <div className="spinner w-4 h-4 border-2" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödeme Al Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">
                Ödeme Al - {selectedCustomer.name}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <div className="p-3 rounded-lg bg-slate-700/50 mb-4">
                  <p className="text-sm text-slate-400">
                    Kalan Borç: <span className="text-yellow-400 font-bold">₺{getTotalDebt(selectedCustomer.id).toLocaleString('tr-TR')}</span>
                  </p>
                </div>
                <div className="form-group">
                  <label>Tutar (TL) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="1000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ödeme Yöntemi</label>
                  <select
                    className="select"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  >
                    <option>Nakit</option>
                    <option>Kredi Kartı</option>
                    <option>Havale/EFT</option>
                    <option>Çek</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    placeholder="Ödeme notu..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <div className="spinner w-4 h-4 border-2" /> : 'Ödeme Al'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MÜŞTERİ DETAY MODAL - İşlem Geçmişi */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedCustomer.name}</h2>
                <p className="text-sm text-slate-400">{selectedCustomer.phone} {selectedCustomer.email ? `| ${selectedCustomer.email}` : ''}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="modal-body">
              {/* Özet Kartları */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                  <div className="text-lg font-bold text-red-400">₺{getTotalDebt(selectedCustomer.id).toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-slate-400">Toplam Borç</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                  <div className="text-lg font-bold text-emerald-400">₺{getTotalPaid(selectedCustomer.id).toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-slate-400">Toplam Ödeme</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                  <div className="text-lg font-bold text-yellow-400">₺{(getTotalDebt(selectedCustomer.id) - getTotalPaid(selectedCustomer.id)).toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-slate-400">Kalan Borç</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                  <div className="text-lg font-bold text-blue-400">{getAllTransactions(selectedCustomer.id).length}</div>
                  <div className="text-xs text-slate-400">Toplam İşlem</div>
                </div>
              </div>

              {/* İşlem Geçmişi Tablosu */}
              <h3 className="text-md font-semibold text-white mb-3">📋 İşlem Geçmişi</h3>
              <div className="table-container max-h-96 overflow-y-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Saat</th>
                      <th>İşlem Türü</th>
                      <th>Detay</th>
                      <th>Tutar</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAllTransactions(selectedCustomer.id).map((t, i) => (
                      <tr key={i}>
                        <td className="text-slate-300">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                        <td className="text-slate-400 text-xs">{new Date(t.date).toLocaleTimeString('tr-TR')}</td>
                        <td>
                          <span className={`badge ${
                            t.type === 'Ödeme' ? 'badge-green' :
                            t.type === 'Borç' ? 'badge-red' :
                            t.type === 'Satış' ? 'badge-blue' :
                            t.type === 'Teknik Servis' ? 'badge-yellow' :
                            'badge-gray'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="text-slate-300 max-w-xs truncate" title={t.detail}>{t.detail}</td>
                        <td className={`font-bold ${
                          t.type === 'Ödeme' ? 'text-emerald-400' :
                          t.type === 'Borç' ? 'text-red-400' :
                          'text-white'
                        }`}>
                          ₺{t.amount?.toLocaleString('tr-TR')}
                        </td>
                        <td className="text-slate-400 text-xs">
                          {t.status || (t.type === 'Ödeme' ? t.method : '-')}
                          {t.remaining !== undefined && t.remaining > 0 && (
                            <span className="text-yellow-400 ml-1">(Kalan: ₺{t.remaining.toLocaleString('tr-TR')})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {getAllTransactions(selectedCustomer.id).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>Bu müşteri için henüz işlem kaydı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

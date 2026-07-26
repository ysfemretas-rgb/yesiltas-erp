'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  created_at: string
}

interface Debt {
  id: string
  source_type: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  due_date: string
  status: string
}

interface Payment {
  id: string
  amount: number
  payment_method: string
  notes: string
  created_at: string
}

interface Device {
  id: string
  brand: string
  model: string
  status: string
  final_cost: number
  paid_amount: number
  delivered_date: string
}

interface Sale {
  id: string
  item_name: string
  item_type: string
  total_price: number
  remaining_amount: number
  payment_method: string
  created_at: string
}

interface Appointment {
  id: string
  service_type: string
  appointment_date: string
  appointment_time: string
  status: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [customerDebts, setCustomerDebts] = useState<Record<string, { total: number; remaining: number; overdue: boolean; dueDate: string }>>({})
  const [historyData, setHistoryData] = useState<{ devices: Device[]; sales: Sale[]; appointments: Appointment[]; payments: Payment[]; debts: Debt[] } | null>(null)

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'Nakit', notes: '' })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    setFiltered(customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    ))
  }, [search, customers])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCustomers = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (data) {
      setCustomers(data)
      setFiltered(data)
      const debtsMap: Record<string, { total: number; remaining: number; overdue: boolean; dueDate: string }> = {}
      for (const c of data) {
        const { data: debts } = await supabase.from('debts').select('*').eq('customer_id', c.id)
        const total = debts?.reduce((s, d) => s + (d.total_amount || 0), 0) || 0
        const remaining = debts?.reduce((s, d) => s + (d.remaining_amount || 0), 0) || 0
        const overdue = debts?.some(d => d.due_date && new Date(d.due_date) < new Date() && d.remaining_amount > 0) || false
        const dueDate = debts?.find(d => d.remaining_amount > 0)?.due_date || ''
        debtsMap[c.id] = { total, remaining, overdue, dueDate }
      }
      setCustomerDebts(debtsMap)
    }
    setLoading(false)
  }

  const openModal = (customer?: Customer) => {
    if (customer) {
      setForm({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '', notes: customer.notes || '' })
      setEditingId(customer.id)
    } else {
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('customers').update(form).eq('id', editingId)
      showToast('Musteri guncellendi')
    } else {
      await supabase.from('customers').insert([form])
      showToast('Musteri eklendi')
    }
    setShowModal(false)
    loadCustomers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu musteriyi silmek istediginize emin misiniz?')) return
    await supabase.from('customers').delete().eq('id', id)
    showToast('Musteri silindi')
    loadCustomers()
  }

  const loadHistory = async (customerId: string) => {
    const [devicesRes, salesRes, appointmentsRes, paymentsRes, debtsRes] = await Promise.all([
      supabase.from('devices').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('sales').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('customer_id', customerId).order('appointment_date', { ascending: false }),
      supabase.from('customer_payments').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('debts').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    ])
    setHistoryData({
      devices: devicesRes.data || [],
      sales: salesRes.data || [],
      appointments: appointmentsRes.data || [],
      payments: paymentsRes.data || [],
      debts: debtsRes.data || []
    })
    setShowHistory(customerId)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPayment) return
    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      showToast('Gecerli tutar girin', 'error')
      return
    }

    await supabase.from('customer_payments').insert([{
      customer_id: showPayment,
      amount,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes
    }])

    await supabase.from('transactions').insert([{
      type: 'gelir',
      category: 'Musteri Tahsilati',
      amount,
      description: `Musteri odemesi - ${customers.find(c => c.id === showPayment)?.name || ''}`
    }])

    const { data: debts } = await supabase.from('debts').select('*').eq('customer_id', showPayment).gt('remaining_amount', 0).order('due_date')
    let remainingPayment = amount
    for (const debt of (debts || [])) {
      if (remainingPayment <= 0) break
      const payAmount = Math.min(remainingPayment, debt.remaining_amount)
      const newPaid = (debt.paid_amount || 0) + payAmount
      const newRemaining = debt.total_amount - newPaid
      const newStatus = newRemaining <= 0 ? 'Tamamlandi' : 'Kismi Odenmedi'
      await supabase.from('debts').update({
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus
      }).eq('id', debt.id)
      remainingPayment -= payAmount
    }

    showToast('Odeme alindi ve kasaya eklendi')
    setShowPayment(null)
    setPaymentForm({ amount: '', payment_method: 'Nakit', notes: '' })
    loadCustomers()
  }

  const exportToCSV = () => {
    const headers = ['Ad', 'Telefon', 'E-posta', 'Adres', 'Toplam Borc', 'Kalan Borc', 'Kayit Tarihi']
    const rows = filtered.map(c => {
      const d = customerDebts[c.id] || { total: 0, remaining: 0 }
      return [c.name, c.phone, c.email || '', c.address || '', d.total, d.remaining, new Date(c.created_at).toLocaleDateString('tr-TR')]
    })
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'musteriler.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV olarak indirildi')
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
        <h1 className="text-2xl font-bold text-white">Musteriler</h1>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="btn btn-secondary btn-sm">Excel</button>
          <button onClick={() => openModal()} className="btn btn-primary btn-sm">Yeni Musteri</button>
        </div>
      </div>

      <input
        type="text"
        className="input"
        placeholder="Musteri ara (isim, telefon, e-posta)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Musteri</th>
              <th>Telefon</th>
              <th>Toplam Borc</th>
              <th>Kalan Borc</th>
              <th>Durum</th>
              <th>Islemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => {
              const debt = customerDebts[customer.id] || { total: 0, remaining: 0, overdue: false, dueDate: '' }
              return (
                <tr key={customer.id}>
                  <td>
                    <button
                      onClick={() => loadHistory(customer.id)}
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer text-left"
                    >
                      {customer.name}
                    </button>
                    <div className="text-xs text-slate-500">{customer.email}</div>
                  </td>
                  <td className="text-slate-300">{customer.phone}</td>
                  <td className="text-slate-300">{debt.total.toLocaleString('tr-TR')} TL</td>
                  <td>
                    {debt.remaining > 0 ? (
                      <span className="text-red-400 font-medium">{debt.remaining.toLocaleString('tr-TR')} TL</span>
                    ) : (
                      <span className="text-emerald-400 text-sm">Borc yok</span>
                    )}
                  </td>
                  <td>
                    {debt.overdue ? (
                      <span className="badge badge-red">Tarihi Gecti</span>
                    ) : debt.remaining > 0 ? (
                      <span className="badge badge-yellow">Beklemede</span>
                    ) : (
                      <span className="badge badge-green">Temiz</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => setShowPayment(customer.id)} className="btn btn-primary btn-sm">Odeme Al</button>
                      <button onClick={() => openModal(customer)} className="btn btn-secondary btn-sm">Duzenle</button>
                      <button onClick={() => handleDelete(customer.id)} className="btn btn-danger btn-sm">Sil</button>
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
          <p>Henuz musteri kaydi yok</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Musteri Duzenle' : 'Yeni Musteri'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ad Soyad *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Telefon *</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notlar</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Odeme Al</h2>
              <button onClick={() => setShowPayment(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body space-y-4">
                <p className="text-slate-300">Musteri: <span className="text-emerald-400 font-medium">{customers.find(c => c.id === showPayment)?.name}</span></p>
                <p className="text-slate-300">Kalan Borc: <span className="text-red-400 font-medium">{(customerDebts[showPayment]?.remaining || 0).toLocaleString('tr-TR')} TL</span></p>
                <div className="form-group">
                  <label>Tutar (TL) *</label>
                  <input className="input" type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Odeme Yontemi</label>
                  <select className="select" value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                    <option>Nakit</option>
                    <option>Kredi Karti</option>
                    <option>Havale</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Not</label>
                  <input className="input" value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPayment(null)} className="btn btn-secondary">Iptal</button>
                <button type="submit" className="btn btn-primary">Odeme Al</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && historyData && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-white">Islem Gecmisi - {customers.find(c => c.id === showHistory)?.name}</h2>
              <button onClick={() => setShowHistory(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body space-y-6">
              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Borclar</h3>
                {historyData.debts.length > 0 ? (
                  <table className="table text-sm">
                    <thead><tr><th>Kaynak</th><th>Toplam</th><th>Odenen</th><th>Kalan</th><th>Vade</th><th>Durum</th></tr></thead>
                    <tbody>
                      {historyData.debts.map(d => (
                        <tr key={d.id}>
                          <td>{d.source_type === 'device' ? 'Servis' : 'Satis'}</td>
                          <td>{d.total_amount?.toLocaleString('tr-TR')} TL</td>
                          <td>{d.paid_amount?.toLocaleString('tr-TR')} TL</td>
                          <td className="text-red-400">{d.remaining_amount?.toLocaleString('tr-TR')} TL</td>
                          <td>{d.due_date ? new Date(d.due_date).toLocaleDateString('tr-TR') : '-'}</td>
                          <td><span className={`badge ${d.status === 'Tamamlandi' ? 'badge-green' : d.status === 'Gecikti' ? 'badge-red' : 'badge-yellow'}`}>{d.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">Borc kaydi yok</p>}
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Odemeler</h3>
                {historyData.payments.length > 0 ? (
                  <table className="table text-sm">
                    <thead><tr><th>Tutar</th><th>Yontem</th><th>Not</th><th>Tarih</th></tr></thead>
                    <tbody>
                      {historyData.payments.map(p => (
                        <tr key={p.id}>
                          <td className="text-emerald-400">{p.amount?.toLocaleString('tr-TR')} TL</td>
                          <td>{p.payment_method}</td>
                          <td>{p.notes || '-'}</td>
                          <td>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">Odeme kaydi yok</p>}
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Teknik Servis</h3>
                {historyData.devices.length > 0 ? (
                  <table className="table text-sm">
                    <thead><tr><th>Marka/Model</th><th>Durum</th><th>Ucret</th><th>Tarih</th></tr></thead>
                    <tbody>
                      {historyData.devices.map(d => (
                        <tr key={d.id}>
                          <td>{d.brand} {d.model}</td>
                          <td><span className={`badge ${d.status === 'Teslim Edildi' ? 'badge-green' : d.status === 'Tamamlandi' ? 'badge-blue' : 'badge-yellow'}`}>{d.status}</span></td>
                          <td>{d.final_cost?.toLocaleString('tr-TR')} TL</td>
                          <td>{d.delivered_date ? new Date(d.delivered_date).toLocaleDateString('tr-TR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">Servis kaydi yok</p>}
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Satislar</h3>
                {historyData.sales.length > 0 ? (
                  <table className="table text-sm">
                    <thead><tr><th>Urun</th><th>Tip</th><th>Tutar</th><th>Odeme</th><th>Tarih</th></tr></thead>
                    <tbody>
                      {historyData.sales.map(s => (
                        <tr key={s.id}>
                          <td>{s.item_name}</td>
                          <td>{s.item_type}</td>
                          <td>{s.total_price?.toLocaleString('tr-TR')} TL</td>
                          <td>{s.payment_method} {s.remaining_amount > 0 && <span className="text-red-400">(Kalan: {s.remaining_amount?.toLocaleString('tr-TR')} TL)</span>}</td>
                          <td>{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">Satis kaydi yok</p>}
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Randevular</h3>
                {historyData.appointments.length > 0 ? (
                  <table className="table text-sm">
                    <thead><tr><th>Servis</th><th>Tarih</th><th>Saat</th><th>Durum</th></tr></thead>
                    <tbody>
                      {historyData.appointments.map(a => (
                        <tr key={a.id}>
                          <td>{a.service_type}</td>
                          <td>{new Date(a.appointment_date).toLocaleDateString('tr-TR')}</td>
                          <td>{a.appointment_time}</td>
                          <td><span className={`badge ${a.status === 'Tamamlandi' ? 'badge-green' : a.status === 'Iptal Edildi' ? 'badge-red' : 'badge-yellow'}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">Randevu kaydi yok</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

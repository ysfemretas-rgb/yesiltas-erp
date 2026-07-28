'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Inline Toast Component
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

// WhatsApp Borç Bildirim Modalı
function WhatsAppModal({ customer, debtAmount, onClose }: { customer: any; debtAmount: number; onClose: () => void }) {
  const [iban, setIban] = useState('')
  const [accountName, setAccountName] = useState('')
  const [note, setNote] = useState('')

  const handleSend = () => {
    if (!iban.trim() || !accountName.trim()) {
      alert('IBAN ve Hesap Sahibi zorunludur!')
      return
    }
    const message = `Merhaba ${customer.name},

Yeşiltaş Teknoloji'ye ait borç bilgileriniz:

💰 Borç Tutarı: ₺${debtAmount.toLocaleString('tr-TR')}
🏦 IBAN: ${iban}
👤 Hesap Sahibi: ${accountName}

Lütfen borç tutarını yukarıdaki IBAN'a havale/EFT yaparak ödeyiniz.

${note ? `📝 Not:\n${note}\n` : ''}
Ödeme yaptıktan sonra dekontu paylaşabilirsiniz.

Teşekkür ederiz,
Yeşiltaş Teknoloji`

    const phone = customer.phone?.replace(/\D/g, '')
    if (!phone) {
      alert('Müşterinin telefon numarası yok!')
      return
    }
    const url = `https://wa.me/90${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>📱 WhatsApp Borç Bildirim</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <div className="modal-body space-y-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Müşteri</div>
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{customer.name}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Borç Tutarı</div>
            <div className="text-xl font-bold text-red-400">₺{debtAmount.toLocaleString('tr-TR')}</div>
          </div>
          <div className="form-group">
            <label>IBAN *</label>
            <input className="input" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR12 3456 7890 1234 5678 9012 34" autoComplete="off" />
          </div>
          <div className="form-group">
            <label>Hesap Sahibi (İsim) *</label>
            <input className="input" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ad Soyad" autoComplete="off" />
          </div>
          <div className="form-group">
            <label>Not / Açıklama</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="İsteğe bağlı not..." autoComplete="off" />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">İptal</button>
          <button onClick={handleSend} className="btn btn-primary" style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}>📤 WhatsApp'tan Gönder</button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [customerDebts, setCustomerDebts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetails, setCustomerDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [whatsappModal, setWhatsappModal] = useState<{customer: any, debt: number} | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) {
      setCustomers(data)
      const debts: Record<string, number> = {}
      await Promise.all(data.map(async (c: any) => {
        const { data: debtsData } = await supabase.from('debts').select('remaining_amount').eq('customer_id', c.id)
        const totalRemaining = (debtsData || []).reduce((s: number, d: any) => s + (d.remaining_amount || 0), 0)
        debts[c.id] = totalRemaining
      }))
      setCustomerDebts(debts)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.phone.trim()) {
      setToast({ message: 'Telefon numarası zorunludur!', type: 'error' })
      return
    }
    try {
      const { data, error } = await supabase.from('customers').insert([{
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null
      }]).select()
      if (error) {
        setToast({ message: `HATA: ${error.message} (Kod: ${error.code})`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ name: '', phone: '', email: '', address: '', notes: '' })
        if (data && data[0]) setCustomers(prev => [data[0], ...prev])
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message || 'Bilinmeyen hata'}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz? Bu müşteriye ait tüm kayıtlar (borçlar, ödemeler, cihazlar, satışlar) da silinecektir.')) return
    try {
      setLoading(true)
      await supabase.from('device_history').delete().eq('customer_id', id)
      await supabase.from('devices').delete().eq('customer_id', id)
      await supabase.from('sales').delete().eq('customer_id', id)
      await supabase.from('customer_payments').delete().eq('customer_id', id)
      await supabase.from('debts').delete().eq('customer_id', id)
      await supabase.from('warranties').delete().eq('customer_id', id)
      await supabase.from('appointments').delete().eq('customer_id', id)
      const { error: custError } = await supabase.from('customers').delete().eq('id', id)
      if (custError) {
        setToast({ message: `HATA: ${custError.message} (Kod: ${custError.code})`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri ve tüm bağlı kayıtlar silindi!', type: 'success' })
        setCustomers(prev => prev.filter(c => c.id !== id))
        if (selectedCustomer?.id === id) { setSelectedCustomer(null); setCustomerDetails(null) }
      }
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message || 'Silme işlemi başarısız'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerDetails = async (customer: any) => {
    setSelectedCustomer(customer)
    setDetailsLoading(true)
    try {
      const [debtsRes, paymentsRes, devicesRes, salesRes] = await Promise.all([
        supabase.from('debts').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('customer_payments').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('devices').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('sales').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
      ])

      // Teknik servis kayıtlarını borç olarak debts tablosuna otomatik ekle (yoksa)
      const deviceDebts = (devicesRes.data || []).filter((d: any) => (d.final_cost || 0) > (d.paid_amount || 0))
      for (const device of deviceDebts) {
        const remaining = (device.final_cost || 0) - (device.paid_amount || 0)
        // Aynı source_id ile kayıt var mı kontrol et
        const { data: existing } = await supabase.from('debts').select('id').eq('source_id', device.id).eq('source_type', 'Teknik Servis')
        if (!existing || existing.length === 0) {
          await supabase.from('debts').insert([{
            customer_id: customer.id,
            source_type: 'Teknik Servis',
            source_id: device.id,
            total_amount: device.final_cost || 0,
            paid_amount: device.paid_amount || 0,
            remaining_amount: remaining,
            status: remaining <= 0 ? 'Ödendi' : 'Beklemede'
          }])
        } else {
          // Varsa güncelle
          await supabase.from('debts').update({
            total_amount: device.final_cost || 0,
            paid_amount: device.paid_amount || 0,
            remaining_amount: remaining,
            status: remaining <= 0 ? 'Ödendi' : 'Beklemede'
          }).eq('source_id', device.id).eq('source_type', 'Teknik Servis')
        }
      }

      // debts'i tekrar çek (güncellenmiş haliyle)
      const { data: updatedDebts } = await supabase.from('debts').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })

      const totalDebt = (updatedDebts || []).reduce((s: number, d: any) => s + (d.total_amount || 0), 0)
      const totalPaid = (updatedDebts || []).reduce((s: number, d: any) => s + (d.paid_amount || 0), 0)
      const totalRemaining = (updatedDebts || []).reduce((s: number, d: any) => s + (d.remaining_amount || 0), 0)

      const allTransactions = [
        ...(updatedDebts || []).map((d: any) => ({
          ...d, 
          type: d.source_type === 'Teknik Servis' ? '🔧 Teknik Servis Borcu' : 'Borç', 
          typeColor: d.source_type === 'Teknik Servis' ? 'text-orange-400' : 'text-red-400',
          amount: d.remaining_amount || 0,
          description: d.source_type === 'Teknik Servis' ? `Cihaz kaydı - Kalan borç` : (d.description || 'Borç kaydı')
        })),
        ...(paymentsRes.data || []).map((p: any) => ({...p, type: 'Ödeme', typeColor: 'text-emerald-400'})),
        ...(devicesRes.data || []).map((d: any) => ({
          ...d, 
          type: '🔧 Teknik Servis', 
          typeColor: 'text-blue-400', 
          amount: d.final_cost || 0,
          description: `${d.brand} ${d.model} - ${d.complaint || 'Tamir'}`
        })),
        ...(salesRes.data || []).map((s: any) => ({...s, type: 'Satış', typeColor: 'text-purple-400'}))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setCustomerDetails({
        debts: updatedDebts || [], 
        payments: paymentsRes.data || [], 
        devices: devicesRes.data || [], 
        sales: salesRes.data || [],
        totalDebt, 
        totalPaid, 
        remaining: totalRemaining, 
        transactions: allTransactions
      })
    } catch (err) {
      console.error('Detay yükleme hatası:', err)
      setToast({ message: 'Detaylar yüklenirken hata oluştu', type: 'error' })
    } finally {
      setDetailsLoading(false)
    }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  const openWhatsApp = async (customer: any) => {
    const debt = customerDebts[customer.id] || 0
    if (debt <= 0) {
      setToast({ message: 'Bu müşterinin borcu yok!', type: 'error' })
      return
    }
    setWhatsappModal({ customer, debt })
  }

  if (loading && customers.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Müşteriler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Müşteri</button>
      </div>
      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Ad</th><th>Telefon</th><th>E-posta</th><th>Adres</th><th>Borç Durumu</th><th>İşlemler</th></tr></thead>
          <tbody>
            {filtered.map((c) => {
              const debt = customerDebts[c.id] || 0
              const hasDebt = debt > 0
              return (
                <tr key={c.id}>
                  <td className="font-medium cursor-pointer hover:underline" style={{ color: 'var(--text-primary)' }} onClick={() => loadCustomerDetails(c)}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email || '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.address || '-'}</td>
                  <td>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        backgroundColor: hasDebt ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: hasDebt ? '#f87171' : '#4ade80',
                        border: `1px solid ${hasDebt ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {hasDebt ? `🔴 ₺${debt.toLocaleString('tr-TR')} Borç` : '🟢 Borç Yok'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openWhatsApp(c)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: '#fff', marginRight: '6px' }} title="WhatsApp Borç Bildirim">📱</button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm">Sil</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Müşteri bulunamadı</p></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Müşteri</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required autoComplete="off" /></div>
                <div className="form-group"><label>Telefon *</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required autoComplete="off" /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} autoComplete="off" /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} autoComplete="off" /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} autoComplete="off" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => { setSelectedCustomer(null); setCustomerDetails(null) }}>
          <div className="modal max-w-6xl w-full" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'hidden' }}>
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedCustomer.phone} {selectedCustomer.email ? `| ${selectedCustomer.email}` : ''}</p>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setCustomerDetails(null) }} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            {detailsLoading ? (
              <div className="p-8 flex justify-center"><div className="spinner" /></div>
            ) : customerDetails ? (
              <div className="modal-body space-y-4" style={{ overflow: 'hidden' }}>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="text-2xl font-bold text-red-400">₺{customerDetails.totalDebt.toLocaleString('tr-TR')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Borç</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="text-2xl font-bold text-emerald-400">₺{customerDetails.totalPaid.toLocaleString('tr-TR')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Ödeme</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className={`text-2xl font-bold ${customerDetails.remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{customerDetails.remaining.toLocaleString('tr-TR')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan Borç</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="text-2xl font-bold text-blue-400">{customerDetails.transactions.length}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam İşlem</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>İşlem Geçmişi</h3>
                <div className="table-container" style={{ overflow: 'visible' }}>
                  <table className="table" style={{ tableLayout: 'auto', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Saat</th>
                        <th style={{ whiteSpace: 'nowrap' }}>İşlem Türü</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Detay</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Tutar</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.transactions.map((t: any, i: number) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className={`font-semibold ${t.typeColor}`}>{t.type}</span>
                          </td>
                          <td style={{ maxWidth: '300px', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
                            {t.description || t.complaint || t.brand || t.product_name || t.notes || '-'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }} className={
                            t.type === 'Ödeme' ? 'text-emerald-400' : 
                            t.type === '🔧 Teknik Servis Borcu' ? 'text-orange-400' :
                            t.type === 'Borç' ? 'text-red-400' : 
                            'text-blue-400'
                          }>
                            ₺{(t.amount || 0).toLocaleString('tr-TR')}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className={`badge ${
                              t.status === 'Tamamlandı' || t.status === 'Ödendi' ? 'badge-green' : 
                              t.status === 'Beklemede' ? 'badge-yellow' : 
                              'badge-blue'
                            }`}>
                              {t.status || 'Tamamlandı'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {customerDetails.transactions.length === 0 && <div className="empty-state"><p>Henüz işlem kaydı yok</p></div>}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {whatsappModal && (
        <WhatsAppModal
          customer={whatsappModal.customer}
          debtAmount={whatsappModal.debt}
          onClose={() => setWhatsappModal(null)}
        />
      )}
    </div>
  )
}
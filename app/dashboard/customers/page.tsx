'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

💰 Borç Tutarı: ₺${debtAmount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
            <div className="text-xl font-bold text-red-400">₺{debtAmount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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

// Borç Detay Modalı
function DebtDetailModal({ customer, debtAmount, onClose }: { customer: any; debtAmount: number; onClose: () => void }) {
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDebtDetails()
  }, [])

  const loadDebtDetails = async () => {
    setLoading(true)
    try {
      // debts tablosundan borç kayıtları (Türkçe sütun adları)
      const { data: debtsData } = await supabase
        .from('debts')
        .select('*')
        .eq('müşteri_kimliği', customer.id)
        .order('oluşturma_tarihi', { ascending: false })

      // devices tablosundan ödenmemiş cihaz borçları
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .eq('customer_id', customer.id)

      // sales tablosundan ödenmemiş satış borçları
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)

      const allDebts = [
        ...(debtsData || []).map((d: any) => ({
          id: d.id,
          date: d.olusturma_tarihi || d.created_at,
          source: d.kaynak_türü || d.source_type || 'Borç',
          description: d.kaynak_türü === 'satış' ? 'Satış borcu' : (d.kaynak_türü === 'Teknik Servis' ? 'Teknik servis borcu' : (d.durum || 'Borç')),
          total: d.toplam_miktar || d.total_amount || 0,
          paid: d.ödenen_miktar || d.paid_amount || 0,
          remaining: d.kalan_miktar || d.remaining_amount || 0,
          status: d.durum || d.status || 'Beklemede'
        })),
        ...(devicesData || [])
          .filter((d: any) => (d.final_cost || 0) > (d.paid_amount || 0))
          .map((d: any) => ({
            id: d.id,
            date: d.created_at,
            source: '🔧 Teknik Servis',
            description: `${d.brand} ${d.model} - ${d.complaint || 'Tamir'}`,
            total: d.final_cost || 0,
            paid: d.paid_amount || 0,
            remaining: (d.final_cost || 0) - (d.paid_amount || 0),
            status: ((d.final_cost || 0) - (d.paid_amount || 0)) <= 0 ? 'Ödendi' : 'Beklemede'
          })),
        ...(salesData || [])
          .filter((s: any) => (s.remaining_amount || 0) > 0)
          .map((s: any) => ({
            id: s.id,
            date: s.created_at,
            source: '🛒 Satış',
            description: s.item_name || 'Satış',
            total: s.total_price || 0,
            paid: (s.total_price || 0) - (s.remaining_amount || 0),
            remaining: s.remaining_amount || 0,
            status: 'Beklemede'
          }))
      ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setDetails(allDebts)
    } catch (err) {
      console.error('Borç detay hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
      <div className="modal max-w-4xl w-full" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'hidden' }}>
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>💰 {customer.name} - Borç Detayları</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Toplam Borç: ₺{debtAmount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <div className="modal-body space-y-4" style={{ overflow: 'auto', maxHeight: 'calc(85vh - 80px)' }}>
          {loading ? (
            <div className="p-8 flex justify-center"><div className="spinner" /></div>
          ) : details.length === 0 ? (
            <div className="empty-state"><p>Henüz borç kaydı yok</p></div>
          ) : (
            <div className="table-container">
              <table className="table" style={{ tableLayout: 'auto', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Kaynak</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Açıklama</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Toplam</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Ödenen</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Kalan</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {d.date ? new Date(d.date).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`font-semibold ${
                          d.source.includes('Teknik') ? 'text-orange-400' :
                          d.source.includes('Satış') ? 'text-purple-400' :
                          'text-red-400'
                        }`}>{d.source}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', wordBreak: 'break-word' }}>{d.description}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-emerald-400">₺{(d.total || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-blue-400">₺{(d.paid || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ whiteSpace: 'nowrap' }} className="text-red-400 font-bold">₺{(d.remaining || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${
                          d.status === 'Ödendi' ? 'badge-green' :
                          d.status === 'Beklemede' ? 'badge-yellow' :
                          'badge-blue'
                        }`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  const [debtDetailModal, setDebtDetailModal] = useState<{customer: any, debt: number} | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) {
      setCustomers(data)
      const debts: Record<string, number> = {}
      await Promise.all(data.map(async (c: any) => {
        // 1. debts tablosundaki borçlar (Türkçe sütun adları)
        const { data: debtsData } = await supabase.from('debts').select('kalan_miktar, remaining_amount').eq('müşteri_kimliği', c.id)
        const debtsTotal = (debtsData || []).reduce((s: number, d: any) => s + (d.kalan_miktar || d.remaining_amount || 0), 0)
        
        // 2. devices tablosundaki ödenmemiş cihaz borçları
        const { data: devicesData } = await supabase.from('devices').select('final_cost, paid_amount').eq('customer_id', c.id)
        const devicesTotal = (devicesData || []).reduce((s: number, d: any) => {
          const remaining = (d.final_cost || 0) - (d.paid_amount || 0)
          return s + (remaining > 0 ? remaining : 0)
        }, 0)

        // Toplam = debts + devices
        debts[c.id] = debtsTotal + devicesTotal
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
      await supabase.from('debts').delete().eq('müşteri_kimliği', id)
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
        supabase.from('debts').select('*').eq('müşteri_kimliği', customer.id).order('oluşturma_tarihi', { ascending: false }),
        supabase.from('customer_payments').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('devices').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
        supabase.from('sales').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
      ])

      // devices'taki borçları debts tablosuna senkronize et
      const deviceDebts = (devicesRes.data || []).filter((d: any) => (d.final_cost || 0) > (d.paid_amount || 0))
      for (const device of deviceDebts) {
        const remaining = (device.final_cost || 0) - (device.paid_amount || 0)
        const { data: existing } = await supabase.from('debts').select('id').eq('kaynak_kimliği', device.id).eq('kaynak_türü', 'Teknik Servis')
        if (!existing || existing.length === 0) {
          await supabase.from('debts').insert([{
            müşteri_kimliği: customer.id,
            kaynak_türü: 'Teknik Servis',
            kaynak_kimliği: device.id,
            toplam_miktar: device.final_cost || 0,
            ödenen_miktar: device.paid_amount || 0,
            kalan_miktar: remaining,
            durum: 'Beklemede'
          }])
        } else {
          await supabase.from('debts').update({
            toplam_miktar: device.final_cost || 0,
            ödenen_miktar: device.paid_amount || 0,
            kalan_miktar: remaining,
            durum: remaining <= 0 ? 'Ödendi' : 'Beklemede'
          }).eq('kaynak_kimliği', device.id).eq('kaynak_türü', 'Teknik Servis')
        }
      }

      // Güncellenmiş debts'i tekrar çek
      const { data: updatedDebts } = await supabase.from('debts').select('*').eq('müşteri_kimliği', customer.id).order('oluşturma_tarihi', { ascending: false })

      const totalDebt = (updatedDebts || []).reduce((s: number, d: any) => s + (d.toplam_miktar || d.total_amount || 0), 0)
      const totalPaid = (updatedDebts || []).reduce((s: number, d: any) => s + (d.ödenen_miktar || d.paid_amount || 0), 0)
      const totalRemaining = (updatedDebts || []).reduce((s: number, d: any) => s + (d.kalan_miktar || d.remaining_amount || 0), 0)

      const allTransactions = [
        ...(updatedDebts || []).map((d: any) => ({
          ...d,
          type: d.kaynak_türü === 'Teknik Servis' ? '🔧 Teknik Servis Borcu' : d.kaynak_türü === 'satış' ? '🛒 Satış Borcu' : 'Borç',
          typeColor: d.kaynak_türü === 'Teknik Servis' ? 'text-orange-400' : d.kaynak_türü === 'satış' ? 'text-purple-400' : 'text-red-400',
          amount: d.kalan_miktar || d.remaining_amount || 0,
          description: d.kaynak_türü === 'Teknik Servis' ? `Cihaz: ${devicesRes.data?.find((dev: any) => dev.id === d.kaynak_kimliği)?.brand || ''} ${devicesRes.data?.find((dev: any) => dev.id === d.kaynak_kimliği)?.model || ''}` : (d.durum || `${d.kaynak_türü} borcu`)
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

  const openDebtDetail = (customer: any) => {
    const debt = customerDebts[customer.id] || 0
    if (debt <= 0) {
      setToast({ message: 'Bu müşterinin borcu yok!', type: 'error' })
      return
    }
    setDebtDetailModal({ customer, debt })
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
                      className="px-2 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: hasDebt ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: hasDebt ? '#f87171' : '#4ade80',
                        border: `1px solid ${hasDebt ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => hasDebt && openDebtDetail(c)}
                      title={hasDebt ? 'Borç detaylarını gör' : 'Borç yok'}
                    >
                      {hasDebt ? `🔴 ₺${debt.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Borç` : '🟢 Borç Yok'}
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
                    <div className="text-2xl font-bold text-red-400">₺{customerDetails.totalDebt.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Borç</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="text-2xl font-bold text-emerald-400">₺{customerDetails.totalPaid.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam Ödeme</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className={`text-2xl font-bold ${customerDetails.remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{customerDetails.remaining.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
                      <tr><th style={{ whiteSpace: 'nowrap' }}>Tarih</th><th style={{ whiteSpace: 'nowrap' }}>Saat</th><th style={{ whiteSpace: 'nowrap' }}>İşlem Türü</th><th style={{ whiteSpace: 'nowrap' }}>Detay</th><th style={{ whiteSpace: 'nowrap' }}>Tutar</th><th style={{ whiteSpace: 'nowrap' }}>Durum</th></tr>
                    </thead>
                    <tbody>
                      {customerDetails.transactions.map((t: any, i: number) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}><span className={`font-semibold ${t.typeColor}`}>{t.type}</span></td>
                          <td style={{ maxWidth: '300px', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>{t.description || t.complaint || t.brand || t.product_name || t.notes || '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }} className={
                            t.type === 'Ödeme' ? 'text-emerald-400' : 
                            t.type === '🔧 Teknik Servis Borcu' ? 'text-orange-400' :
                            t.type === '🛒 Satış Borcu' ? 'text-purple-400' :
                            t.type === 'Borç' ? 'text-red-400' : 
                            'text-blue-400'
                          }>₺{(t.amount || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td style={{ whiteSpace: 'nowrap' }}><span className={`badge ${t.status === 'Tamamlandı' || t.status === 'Ödendi' ? 'badge-green' : t.status === 'Beklemede' ? 'badge-yellow' : 'badge-blue'}`}>{t.status || 'Tamamlandı'}</span></td>
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

      {debtDetailModal && (
        <DebtDetailModal
          customer={debtDetailModal.customer}
          debtAmount={debtDetailModal.debt}
          onClose={() => setDebtDetailModal(null)}
        />
      )}
    </div>
  )
}
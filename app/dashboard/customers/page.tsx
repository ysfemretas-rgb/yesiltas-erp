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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)

  const [form, setForm] = useState({ ad: '', telefon: '', email: '', adres: '', notlar: '' })
  const [editForm, setEditForm] = useState({ id: '', ad: '', telefon: '', email: '', adres: '', notlar: '' })
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDebts, setCustomerDebts] = useState<any[]>([])
  const [paymentForm, setPaymentForm] = useState({ borç_kimliği: '', ödeme_miktarı: '' })
  const [whatsAppForm, setWhatsAppForm] = useState({ telefon: '', mesaj: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = customers
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(c => 
        c.ad?.toLowerCase().includes(term) ||
        c.telefon?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, customers])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('ad')
    if (data) setCustomers(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('customers').insert([{
        ad: form.ad.trim(),
        telefon: form.telefon.trim(),
        email: form.email.trim() || null,
        adres: form.adres.trim() || null,
        notlar: form.notlar.trim() || null
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ ad: '', telefon: '', email: '', adres: '', notlar: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (c: any) => {
    setEditForm({
      id: c.id,
      ad: c.ad || '',
      telefon: c.telefon || '',
      email: c.email || '',
      adres: c.adres || '',
      notlar: c.notlar || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('customers').update({
        ad: editForm.ad.trim(),
        telefon: editForm.telefon.trim(),
        email: editForm.email.trim() || null,
        adres: editForm.adres.trim() || null,
        notlar: editForm.notlar.trim() || null
      }).eq('id', editForm.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openDetailModal = async (c: any) => {
    setSelectedCustomer(c)
    const { data: debts } = await supabase.from('debts').select('*').eq('müşteri_kimliği', c.id)
    setCustomerDebts(debts || [])
    setShowDetailModal(true)
  }

  const openDebtModal = async (c: any) => {
    setSelectedCustomer(c)
    const { data: debts } = await supabase.from('debts').select('*').eq('müşteri_kimliği', c.id).eq('durum', 'Beklemede')
    setCustomerDebts(debts || [])
    setShowDebtModal(true)
  }

  const openPaymentModal = (debt: any) => {
    setPaymentForm({ borç_kimliği: debt.id, ödeme_miktarı: debt.kalan_miktar?.toString() || '' })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const debt = customerDebts.find(d => d.id === paymentForm.borç_kimliği)
      if (!debt) return

      const paymentAmount = parseFloat(paymentForm.ödeme_miktarı) || 0
      const newPaid = (debt.ödenen_miktar || 0) + paymentAmount
      const newRemaining = Math.max(0, (debt.kalan_miktar || 0) - paymentAmount)

      await supabase.from('debts').update({
        ödenen_miktar: newPaid,
        kalan_miktar: newRemaining,
        durum: newRemaining <= 0 ? 'Ödendi' : 'Beklemede'
      }).eq('id', paymentForm.borç_kimliği)

      await supabase.from('transactions').insert([{
        tip: 'gelir',
        kategori: 'Borç Ödemesi',
        miktar: paymentAmount,
        Tanım: `${selectedCustomer?.ad} - Borç Ödemesi`,
        ilgili_kimlik: debt.id,
        ilgili_tablo: 'debts'
      }])

      setToast({ message: `₺${paymentAmount.toLocaleString('tr-TR')} ödeme alındı!`, type: 'success' })
      setShowPaymentModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openWhatsAppModal = (c: any) => {
    setWhatsAppForm({
      telefon: c.telefon || '',
      mesaj: `Merhaba ${c.ad},\n\nYeşiltaş Teknoloji'den bilgi vermek istiyoruz.\n\nIBAN: TR00 0000 0000 0000 0000 0000 00\nAlıcı: Yeşiltaş Teknoloji\nBanka: Ziraat Bankası\n\nTeşekkürler!`
    })
    setShowWhatsAppModal(true)
  }

  const sendWhatsApp = () => {
    const cleanPhone = whatsAppForm.telefon.replace(/\D/g, '')
    const intlPhone = cleanPhone.startsWith('0') ? '9' + cleanPhone : cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsAppForm.mesaj)}`
    window.open(url, '_blank')
    setShowWhatsAppModal(false)
  }

  const handleDelete = async (customer: any) => {
    const { data: salesCount } = await supabase.from('sales').select('id', { count: 'exact' }).eq('müşteri_kimliği', customer.id)
    const { data: devicesCount } = await supabase.from('devices').select('id', { count: 'exact' }).eq('müşteri_kimliği', customer.id)
    const { data: debtsCount } = await supabase.from('debts').select('id', { count: 'exact' }).eq('müşteri_kimliği', customer.id)

    const sCount = salesCount?.length || 0
    const dCount = devicesCount?.length || 0
    const deCount = debtsCount?.length || 0
    const total = sCount + dCount + deCount

    let confirmMessage = `${customer.ad} silinecek.`
    if (total > 0) {
      confirmMessage += `\n\nBAĞLI KAYITLAR DA SİLİNECEK:`
      if (sCount > 0) confirmMessage += `\n• ${sCount} satış kaydı`
      if (dCount > 0) confirmMessage += `\n• ${dCount} teknik servis kaydı`
      if (deCount > 0) confirmMessage += `\n• ${deCount} borç kaydı`
      confirmMessage += `\n\nBu işlem GERİ ALINAMAZ!`
    }
    confirmMessage += `\n\nEmin misiniz?`

    if (!confirm(confirmMessage)) return

    try {
      await supabase.from('customer_payments').delete().eq('müşteri_kimliği', customer.id)
      await supabase.from('warranties').delete().eq('müşteri_kimliği', customer.id)
      await supabase.from('debts').delete().eq('müşteri_kimliği', customer.id)
      await supabase.from('sales').delete().eq('müşteri_kimliği', customer.id)

      const { data: customerDevices } = await supabase.from('devices').select('id').eq('müşteri_kimliği', customer.id)
      if (customerDevices && customerDevices.length > 0) {
        for (const dev of customerDevices) {
          await supabase.from('device_history').delete().eq('cihaz_kimliği', dev.id)
        }
        await supabase.from('devices').delete().eq('müşteri_kimliği', customer.id)
      }

      const { error } = await supabase.from('customers').delete().eq('id', customer.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: `${customer.ad} silindi. ${total > 0 ? `${total} bağlı kayıt da silindi.` : ''}`, type: 'success' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Müşteriler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Müşteri</button>
      </div>

      <input type="text" className="input max-w-md" placeholder="Ara (isim, telefon, e-posta)..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Ad</th><th>Telefon</th><th>E-posta</th><th>Adres</th><th>Notlar</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.ad}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.telefon}</td>
                <td style={{ color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                <td style={{ color: 'var(--text-muted)' }} className="max-w-xs truncate">{c.adres || '-'}</td>
                <td style={{ color: 'var(--text-muted)' }} className="max-w-xs truncate">{c.notlar || '-'}</td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => openDetailModal(c)} className="btn btn-sm" style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Detay">👁️</button>
                    <button onClick={() => openEditModal(c)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Düzenle">✏️</button>
                    <button onClick={() => openDebtModal(c)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Borçlar">💳</button>
                    <button onClick={() => openWhatsAppModal(c)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="WhatsApp">📱</button>
                    <button onClick={() => handleDelete(c)} className="btn btn-danger btn-sm">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Müşteri bulunamadı</p></div>}

      {/* Yeni Müşteri Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Müşteri</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={form.ad} onChange={(e) => setForm({...form, ad: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon *</label><input className="input" value={form.telefon} onChange={(e) => setForm({...form, telefon: e.target.value})} required /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={form.adres} onChange={(e) => setForm({...form, adres: e.target.value})} /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notlar} onChange={(e) => setForm({...form, notlar: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Müşteriyi Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={editForm.ad} onChange={(e) => setEditForm({...editForm, ad: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon *</label><input className="input" value={editForm.telefon} onChange={(e) => setEditForm({...editForm, telefon: e.target.value})} required /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={editForm.adres} onChange={(e) => setEditForm({...editForm, adres: e.target.value})} /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={editForm.notlar} onChange={(e) => setEditForm({...editForm, notlar: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detay Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>👁️ Müşteri Detayı</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body space-y-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Ad</div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.ad}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Telefon</div>
                  <div style={{ color: 'var(--text-primary)' }}>{selectedCustomer.telefon}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>E-posta</div>
                  <div style={{ color: 'var(--text-primary)' }}>{selectedCustomer.email || '-'}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Adres</div>
                <div style={{ color: 'var(--text-primary)' }}>{selectedCustomer.adres || '-'}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Notlar</div>
                <div style={{ color: 'var(--text-primary)' }}>{selectedCustomer.notlar || '-'}</div>
              </div>
              <h3 className="text-sm font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>Borçlar</h3>
              {customerDebts.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Borç kaydı yok</p>
              ) : (
                customerDebts.map(debt => (
                  <div key={debt.id} className="p-2 rounded-lg flex justify-between" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{debt.kaynak_türü}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam: ₺{debt.toplam_miktar?.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${debt.durum === 'Ödendi' ? 'text-emerald-400' : 'text-red-400'}`}>{debt.durum}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan: ₺{debt.kalan_miktar?.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Borçlar Modal */}
      {showDebtModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowDebtModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>💳 {selectedCustomer.ad} - Borçlar</h2>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body space-y-3">
              {customerDebts.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-lg" style={{ color: '#4ade80' }}>✅</div>
                  <p style={{ color: 'var(--text-muted)' }}>Bekleyen borç yok!</p>
                </div>
              ) : (
                customerDebts.map(debt => (
                  <div key={debt.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{debt.kaynak_türü}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam: ₺{debt.toplam_miktar?.toLocaleString('tr-TR')} | Ödenen: ₺{debt.ödenen_miktar?.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-400">₺{debt.kalan_miktar?.toLocaleString('tr-TR')}</div>
                        <button onClick={() => openPaymentModal(debt)} className="btn btn-sm mt-1" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.7rem' }}>Ödeme Al</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDebtModal(false)} className="btn btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>💰 Borç Ödemesi Al</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Ödeme Tutarı (TL) *</label>
                  <input className="input" type="number" step="0.01" value={paymentForm.ödeme_miktarı} onChange={(e) => setPaymentForm({...paymentForm, ödeme_miktarı: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>💰 Ödemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>📱 WhatsApp Mesajı</h2>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Alıcı</div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{whatsAppForm.telefon}</div>
              </div>
              <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>IBAN Bilgileri</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Alıcı:</span> Yeşiltaş Teknoloji</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>IBAN:</span> TR00 0000 0000 0000 0000 0000 00</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Banka:</span> Ziraat Bankası</div>
              </div>
              <div className="form-group">
                <label>Mesaj</label>
                <textarea className="input" rows={6} value={whatsAppForm.mesaj} onChange={(e) => setWhatsAppForm({...whatsAppForm, mesaj: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowWhatsAppModal(false)} className="btn btn-secondary">İptal</button>
              <button onClick={sendWhatsApp} className="btn btn-primary" style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}>📱 WhatsApp'ta Aç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

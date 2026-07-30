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

function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const intlPhone = cleanPhone.startsWith('0') ? '9' + cleanPhone : cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDebts, setCustomerDebts] = useState<any[]>([])
  const [customerSales, setCustomerSales] = useState<any[]>([])
  const [customerDevices, setCustomerDevices] = useState<any[]>([])
  const [customerPayments, setCustomerPayments] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = customers
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(term)
      )
    }
    setFiltered(result)
  }, [search, customers])

  // DÜZELTİLMİŞ - debts sütun adları İngilizce'ye çevrildi
  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) {
      const enriched = await Promise.all(data.map(async (c) => {
        const { data: debts } = await supabase.from('debts').select('remaining_amount, status').eq('customer_id', c.id)
        const totalDebt = debts?.reduce((sum, d) => sum + (d.remaining_amount || 0), 0) || 0
        const hasOverdue = debts?.some((d: any) => d.status === 'Gecikmiş') || false
        return { ...c, totalDebt, hasOverdue }
      }))
      setCustomers(enriched)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('customers').insert([{
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ name: '', phone: '', email: '', address: '', notes: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  // DÜZELTİLMİŞ - 4. Kritik Hata: Müşteri silme çok agresif, detaylı uyarı eklendi
  const handleDelete = async (customer: any) => {
    // Önce bağlı kayıtları say
    const { data: salesCount } = await supabase.from('sales').select('id', { count: 'exact' }).eq('customer_id', customer.id)
    const { data: devicesCount } = await supabase.from('devices').select('id', { count: 'exact' }).eq('customer_id', customer.id)
    const { data: debtsCount } = await supabase.from('debts').select('id', { count: 'exact' }).eq('customer_id', customer.id)
    const { data: warrantiesCount } = await supabase.from('warranties').select('id', { count: 'exact' }).eq('customer_id', customer.id)

    const sCount = salesCount?.length || 0
    const dCount = devicesCount?.length || 0
    const deCount = debtsCount?.length || 0
    const wCount = warrantiesCount?.length || 0
    const total = sCount + dCount + deCount + wCount

    let confirmMessage = `"${customer.name}" silinecek.`
    if (total > 0) {
      confirmMessage += `\n\nBAĞLI KAYITLAR DA SİLİNECEK:`
      if (sCount > 0) confirmMessage += `\n• ${sCount} satış kaydı`
      if (dCount > 0) confirmMessage += `\n• ${dCount} teknik servis kaydı`
      if (deCount > 0) confirmMessage += `\n• ${deCount} borç kaydı`
      if (wCount > 0) confirmMessage += `\n• ${wCount} garanti kaydı`
      confirmMessage += `\n\nBu işlem GERİ ALINAMAZ!`
    }
    confirmMessage += `\n\nEmin misiniz?`

    if (!confirm(confirmMessage)) return

    try {
      // Cascade silme sırası
      await supabase.from('customer_payments').delete().eq('customer_id', customer.id)
      await supabase.from('warranties').delete().eq('customer_id', customer.id)
      await supabase.from('debts').delete().eq('customer_id', customer.id)
      await supabase.from('sales').delete().eq('customer_id', customer.id)

      // Cihazlar önce device_history'yi temizle
      const { data: customerDevices } = await supabase.from('devices').select('id').eq('customer_id', customer.id)
      if (customerDevices && customerDevices.length > 0) {
        for (const dev of customerDevices) {
          await supabase.from('device_history').delete().eq('device_id', dev.id)
        }
        await supabase.from('devices').delete().eq('customer_id', customer.id)
      }

      // Son olarak müşteriyi sil
      const { error } = await supabase.from('customers').delete().eq('id', customer.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: `"${customer.name}" silindi. ${total > 0 ? `${total} bağlı kayıt da silindi.` : ''}`, type: 'success' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  // DÜZELTİLMİŞ - debts sütun adları İngilizce'ye çevrildi
  const openDebtModal = async (customer: any) => {
    setSelectedCustomer(customer)
    const { data: debts } = await supabase.from('debts').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
    setCustomerDebts(debts || [])
    setShowDebtModal(true)
  }

  // DÜZELTİLMİŞ - debts sütun adları İngilizce'ye çevrildi
  const openDetailModal = async (customer: any) => {
    setSelectedCustomer(customer)
    const [debts, sales, devices, payments] = await Promise.all([
      supabase.from('debts').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('sales').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('devices').select('*, customers:customer_id(name)').eq('customer_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('customer_payments').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
    ])
    setCustomerDebts(debts.data || [])
    setCustomerSales(sales.data || [])
    setCustomerDevices(devices.data || [])
    setCustomerPayments(payments.data || [])
    setShowDetailModal(true)
  }

  const sendWhatsAppDebt = (customer: any) => {
    const iban = prompt('IBAN numarasını girin:')
    if (!iban) return
    const message = `Merhaba ${customer.name},\n\nToplam borcunuz: ₺${(customer.totalDebt || 0).toLocaleString('tr-TR')}\n\nÖdeme için IBAN:\n${iban}\n\nYeşiltaş Teknoloji`
    window.open(getWhatsAppLink(customer.phone, message), '_blank')
  }

  const getDebtStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Beklemede': 'bg-yellow-500/20 text-yellow-400',
      'Ödendi': 'bg-emerald-500/20 text-emerald-400',
      'Gecikmiş': 'bg-red-500/20 text-red-400',
      'İptal': 'bg-slate-500/20 text-slate-400'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || colors['Beklemede']}`}>{status}</span>
  }

  if (loading && customers.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Müşteriler</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Müşteri</button>
      </div>

      <input type="text" className="input" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Ad</th><th>Telefon</th><th>E-posta</th><th>Borç</th><th>Durum</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                <td style={{ color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                <td>
                  {c.totalDebt > 0 ? (
                    <span className="text-red-400 font-bold">₺{c.totalDebt.toLocaleString('tr-TR')}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  )}
                </td>
                <td>
                  {c.hasOverdue && <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">⚠️ Gecikme</span>}
                  {c.totalDebt > 0 && !c.hasOverdue && <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">💳 Borçlu</span>}
                  {c.totalDebt <= 0 && <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">✅ Temiz</span>}
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => openDetailModal(c)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>👁️</button>
                    {c.totalDebt > 0 && (
                      <>
                        <button onClick={() => openDebtModal(c)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>💳</button>
                        <button onClick={() => sendWhatsAppDebt(c)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>📱</button>
                      </>
                    )}
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
                <div className="form-group"><label>Ad *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon *</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borç Detay Modal - DÜZELTİLMİŞ debts sütun adları İngilizce */}
      {showDebtModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowDebtModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name} - Borç Detayı</h2>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body">
              {customerDebts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Borç kaydı bulunamadı.</p>
              ) : (
                <div className="space-y-3">
                  {customerDebts.map((debt) => (
                    <div key={debt.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{debt.source_type}</div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Toplam: ₺{(debt.total_amount || 0).toLocaleString('tr-TR')}</div>
                        </div>
                        {getDebtStatusBadge(debt.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Ödenen:</span> <span className="text-emerald-400">₺{(debt.paid_amount || 0).toLocaleString('tr-TR')}</span></div>
                        <div className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Kalan:</span> <span className="text-red-400">₺{(debt.remaining_amount || 0).toLocaleString('tr-TR')}</span></div>
                        <div className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Bitiş:</span> {debt.due_date ? new Date(debt.due_date).toLocaleDateString('tr-TR') : '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDebtModal(false)} className="btn btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Detay Modal - DÜZELTİLMİŞ debts sütun adları İngilizce */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name} - Detay</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              {/* İletişim Bilgileri */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>📇 İletişim</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span style={{ color: 'var(--text-muted)' }}>Telefon:</span> {selectedCustomer.phone}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>E-posta:</span> {selectedCustomer.email || '-'}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Adres:</span> {selectedCustomer.address || '-'}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Notlar:</span> {selectedCustomer.notes || '-'}</div>
                </div>
              </div>

              {/* Borç Özeti - DÜZELTİLMİŞ */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💳 Borç Durumu</h3>
                <div className="text-2xl font-bold text-red-400">₺{selectedCustomer.totalDebt?.toLocaleString('tr-TR') || 0}</div>
                {customerDebts.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {customerDebts.map(d => (
                      <div key={d.id} className="text-sm flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>{d.source_type}</span>
                        <span className="text-red-400">₺{(d.remaining_amount || 0).toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Satış Geçmişi */}
              {customerSales.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🛒 Satış Geçmişi ({customerSales.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {customerSales.map(s => (
                      <div key={s.id} className="text-sm flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>{s.item_name}</span>
                        <span className="text-emerald-400">₺{(s.total_price || 0).toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cihaz Geçmişi */}
              {customerDevices.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🔧 Teknik Servis ({customerDevices.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {customerDevices.map(d => (
                      <div key={d.id} className="text-sm flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>{d.brand} {d.model}</span>
                        <span className={`text-xs px-2 py-1 rounded ${d.status === 'Tamamlandı' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ödeme Geçmişi */}
              {customerPayments.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💰 Ödemeler ({customerPayments.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {customerPayments.map(p => (
                      <div key={p.id} className="text-sm flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</span>
                        <span className="text-emerald-400">₺{(p.amount || 0).toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
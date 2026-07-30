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

function PaymentStatusBadge({ device }: { device: any }) {
  const finalCost = device.son_maliyet || 0
  const paidAmount = device.ödenen_miktar || 0
  const remaining = finalCost - paidAmount

  if (finalCost === 0) {
    return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>Ücretsiz</span>
  }
  if (remaining <= 0) {
    return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Ödendi</span>
  }
  if (paidAmount > 0) {
    return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💰 Kısmi</span>
  }
  return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>❌ Ödenmedi</span>
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tümü')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [form, setForm] = useState({ müşteri_kimliği: '', marka: '', model: '', imei: '', şikayet: '', son_maliyet: '', durum: 'Beklemede', teknisyen: '' })
  const [editForm, setEditForm] = useState({ id: '', müşteri_kimliği: '', marka: '', model: '', imei: '', şikayet: '', son_maliyet: '', ödenen_miktar: '', durum: 'Beklemede', teknisyen: '' })
  const [paymentForm, setPaymentForm] = useState({ cihaz_kimliği: '', ödeme_miktarı: '' })
  const [customerForm, setCustomerForm] = useState({ ad: '', telefon: '', email: '', adres: '', notlar: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: devicesData }, { data: customersData }] = await Promise.all([
      supabase.from('devices').select('*, customers:müşteri_kimliği(ad, telefon)').order('oluşturulma_tarihi', { ascending: false }),
      supabase.from('customers').select('id, ad, telefon').order('ad')
    ])
    if (devicesData) setDevices(devicesData)
    if (customersData) setCustomers(customersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('devices').insert([{
        müşteri_kimliği: form.müşteri_kimliği,
        marka: form.marka.trim(),
        model: form.model.trim(),
        imei: form.imei.trim() || null,
        şikayet: form.şikayet.trim(),
        son_maliyet: parseFloat(form.son_maliyet) || 0,
        durum: form.durum,
        teknisyen: form.teknisyen.trim() || null,
        ödenen_miktar: 0
      }])
      if (error) {
        setToast({ message: `Hata: ${error.message} (Kod: ${error.code})`, type: 'error' })
      } else {
        setToast({ message: 'Cihaz kaydı eklendi!', type: 'success' })
        setShowModal(false)
        setForm({ müşteri_kimliği: '', marka: '', model: '', imei: '', şikayet: '', son_maliyet: '', durum: 'Beklemede', teknisyen: '' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (d: any) => {
    setEditForm({
      id: d.id,
      müşteri_kimliği: d.müşteri_kimliği,
      marka: d.marka || '',
      model: d.model || '',
      imei: d.imei || '',
      şikayet: d.şikayet || '',
      son_maliyet: d.son_maliyet?.toString() || '',
      ödenen_miktar: d.ödenen_miktar?.toString() || '',
      durum: d.durum || 'Beklemede',
      teknisyen: d.teknisyen || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('devices').update({
        müşteri_kimliği: editForm.müşteri_kimliği,
        marka: editForm.marka.trim(),
        model: editForm.model.trim(),
        imei: editForm.imei.trim() || null,
        şikayet: editForm.şikayet.trim(),
        son_maliyet: parseFloat(editForm.son_maliyet) || 0,
        durum: editForm.durum,
        teknisyen: editForm.teknisyen.trim() || null
      }).eq('id', editForm.id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Cihaz kaydı güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openPaymentModal = (d: any) => {
    setPaymentForm({
      cihaz_kimliği: d.id,
      ödeme_miktarı: ''
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const device = devices.find(d => d.id === paymentForm.cihaz_kimliği)
      if (!device) {
        setToast({ message: 'Cihaz bulunamadı!', type: 'error' })
        return
      }
      const finalCost = device.son_maliyet || 0
      const currentPaid = device.ödenen_miktar || 0
      const paymentAmount = parseFloat(paymentForm.ödeme_miktarı) || 0
      const newPaid = currentPaid + paymentAmount
      const remaining = finalCost - newPaid

      const { error: deviceError } = await supabase.from('devices').update({
        ödenen_miktar: newPaid
      }).eq('id', paymentForm.cihaz_kimliği)

      if (deviceError) {
        setToast({ message: `Hata: ${deviceError.message}`, type: 'error' })
        return
      }

      await supabase.from('transactions').insert([{
        tip: 'gelir',
        kategori: 'Teknik Servis',
        miktar: paymentAmount,
        Tanım: `${device.marka} ${device.model} - Teknik Servis Ödemesi (${device.customers?.ad || 'Müşteri'})`,
        ilgili_kimlik: device.id,
        ilgili_tablo: 'devices'
      }])

      const remainingAmount = remaining > 0 ? remaining : 0
      const { data: existing } = await supabase.from('debts').select('id').eq('kaynak_kimliği', paymentForm.cihaz_kimliği).eq('kaynak_türü', 'Teknik Servis')
      if (!existing || existing.length === 0) {
        await supabase.from('debts').insert([{
          müşteri_kimliği: device.müşteri_kimliği,
          kaynak_türü: 'Teknik Servis',
          kaynak_kimliği: device.id,
          toplam_miktar: finalCost,
          ödenen_miktar: newPaid,
          kalan_miktar: remainingAmount,
          durum: remainingAmount <= 0 ? 'Ödendi' : 'Beklemede'
        }])
      } else {
        await supabase.from('debts').update({
          toplam_miktar: finalCost,
          ödenen_miktar: newPaid,
          kalan_miktar: remainingAmount,
          durum: remainingAmount <= 0 ? 'Ödendi' : 'Beklemede'
        }).eq('kaynak_kimliği', paymentForm.cihaz_kimliği).eq('kaynak_türü', 'Teknik Servis')
      }

      setToast({ message: `₺${paymentAmount.toLocaleString('tr-TR')} ödeme alındı! Kasa kaydı oluşturuldu.`, type: 'success' })
      setShowPaymentModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerForm.telefon.trim()) {
      setToast({ message: 'Telefon numarası zorunludur!', type: 'error' })
      return
    }
    try {
      const { data, error } = await supabase.from('customers').insert([{
        ad: customerForm.ad.trim(),
        telefon: customerForm.telefon.trim(),
        email: customerForm.email.trim() || null,
        adres: customerForm.adres.trim() || null,
        notlar: customerForm.notlar.trim() || null
      }]).select()
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Müşteri eklendi!', type: 'success' })
        setShowCustomerModal(false)
        setCustomerForm({ ad: '', telefon: '', email: '', adres: '', notlar: '' })
        if (data && data[0]) {
          setForm(prev => ({ ...prev, müşteri_kimliği: data[0].id }))
        }
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('devices').update({ durum: newStatus }).eq('id', id).select()
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Durum güncellendi!', type: 'success' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('device_history').delete().eq('cihaz_kimliği', id)
    await supabase.from('devices').delete().eq('id', id)
    setToast({ message: 'Cihaz silindi!', type: 'success' })
    loadData()
  }

  const sendWhatsAppReady = (device: any) => {
    const phone = device.customers?.telefon
    if (!phone) {
      setToast({ message: 'HATA: Müşteri telefon numarası bulunamadı!', type: 'error' })
      return
    }
    const remaining = (device.son_maliyet || 0) - (device.ödenen_miktar || 0)
    const message = `Merhaba ${device.customers?.ad || 'Sayın Müşterimiz'},\n\n${device.marka} ${device.model} cihazınızın tamir işlemi tamamlanmıştır. Cihazınızı servisimizden teslim alabilirsiniz.\n\nToplam Ücret: ₺${(device.son_maliyet || 0).toLocaleString('tr-TR')}\nÖdenen: ₺${(device.ödenen_miktar || 0).toLocaleString('tr-TR')}\nKalan: ₺${remaining.toLocaleString('tr-TR')}\nSorun: ${device.şikayet}\n\nYeşiltaş Teknoloji`
    window.open(getWhatsAppLink(phone, message), '_blank')
  }

  const filtered = devices.filter(d => {
    const matchesSearch = (d.marka + ' ' + d.model)?.toLowerCase().includes(search.toLowerCase()) ||
      d.customers?.ad?.toLowerCase().includes(search.toLowerCase()) ||
      d.imei?.includes(search)
    const matchesStatus = statusFilter === 'Tümü' || d.durum === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions = ['Tümü', 'Beklemede', 'İşlemde', 'Tamamlandı', 'Teslim Edildi', 'İptal']

  if (loading && devices.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Teknik Servis</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Yeni Cihaz</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" className="input max-w-md" placeholder="Ara (cihaz, müşteri, IMEI)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Tarih</th><th>Müşteri</th><th>Cihaz</th><th>IMEI</th><th>Sorun</th><th>Ücret</th><th>Ödeme</th><th>Teknisyen</th><th>Durum</th><th>İşlemler</th></tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const remaining = (d.son_maliyet || 0) - (d.ödenen_miktar || 0)
              return (
                <tr key={d.id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(d.oluşturulma_tarihi).toLocaleDateString('tr-TR')}</td>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.customers?.ad || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.marka} {d.model}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{d.imei || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '200px' }} className="truncate">{d.şikayet}</td>
                  <td className="text-emerald-400">₺{(d.son_maliyet || 0).toLocaleString('tr-TR')}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <PaymentStatusBadge device={d} />
                      {remaining > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan: ₺{remaining.toLocaleString('tr-TR')}</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{d.teknisyen || '-'}</td>
                  <td>
                    <select className="select text-xs py-1" value={d.durum || 'Beklemede'} onChange={(e) => updateStatus(d.id, e.target.value)}>
                      <option>Beklemede</option><option>İşlemde</option><option>Tamamlandı</option><option>Teslim Edildi</option><option>İptal</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(d)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      <button onClick={() => openPaymentModal(d)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Ödeme Al">💰</button>
                      {d.durum === 'Tamamlandı' && d.customers?.telefon && (
                        <button onClick={() => sendWhatsAppReady(d)} className="btn btn-sm" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>📱</button>
                      )}
                      <button onClick={() => handleDelete(d.id)} className="btn btn-danger btn-sm">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Cihaz bulunamadı</p></div>}

      {/* Yeni Cihaz Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Cihaz Kaydı</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri *</label>
                  <div className="flex gap-2">
                    <select className="select flex-1" value={form.müşteri_kimliği} onChange={(e) => setForm({...form, müşteri_kimliği: e.target.value})} required>
                      <option value="">Seçin</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.ad} {c.telefon ? `(${c.telefon})` : ''}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCustomerModal(true)} className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>+ Yeni Müşteri</button>
                  </div>
                </div>
                <div className="form-group"><label>Marka *</label><input className="input" value={form.marka} onChange={(e) => setForm({...form, marka: e.target.value})} required /></div>
                <div className="form-group"><label>Model *</label><input className="input" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} /></div>
                <div className="form-group"><label>Şikayet *</label><textarea className="input" rows={2} value={form.şikayet} onChange={(e) => setForm({...form, şikayet: e.target.value})} required /></div>
                <div className="form-group"><label>Ücret (TL)</label><input className="input" type="number" step="0.01" value={form.son_maliyet} onChange={(e) => setForm({...form, son_maliyet: e.target.value})} /></div>
                <div className="form-group"><label>Teknisyen</label><input className="input" value={form.teknisyen} onChange={(e) => setForm({...form, teknisyen: e.target.value})} /></div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={form.durum} onChange={(e) => setForm({...form, durum: e.target.value})}>
                    <option>Beklemede</option><option>İşlemde</option><option>Tamamlandı</option><option>Teslim Edildi</option><option>İptal</option>
                  </select>
                </div>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cihaz Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri *</label>
                  <select className="select" value={editForm.müşteri_kimliği} onChange={(e) => setEditForm({...editForm, müşteri_kimliği: e.target.value})} required>
                    <option value="">Seçin</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.ad} {c.telefon ? `(${c.telefon})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Marka *</label><input className="input" value={editForm.marka} onChange={(e) => setEditForm({...editForm, marka: e.target.value})} required /></div>
                <div className="form-group"><label>Model *</label><input className="input" value={editForm.model} onChange={(e) => setEditForm({...editForm, model: e.target.value})} required /></div>
                <div className="form-group"><label>IMEI</label><input className="input" value={editForm.imei} onChange={(e) => setEditForm({...editForm, imei: e.target.value})} /></div>
                <div className="form-group"><label>Şikayet *</label><textarea className="input" rows={2} value={editForm.şikayet} onChange={(e) => setEditForm({...editForm, şikayet: e.target.value})} required /></div>
                <div className="form-group"><label>Ücret (TL)</label><input className="input" type="number" step="0.01" value={editForm.son_maliyet} onChange={(e) => setEditForm({...editForm, son_maliyet: e.target.value})} /></div>
                <div className="form-group"><label>Teknisyen</label><input className="input" value={editForm.teknisyen} onChange={(e) => setEditForm({...editForm, teknisyen: e.target.value})} /></div>
                <div className="form-group">
                  <label>Durum</label>
                  <select className="select" value={editForm.durum} onChange={(e) => setEditForm({...editForm, durum: e.target.value})}>
                    <option>Beklemede</option><option>İşlemde</option><option>Tamamlandı</option><option>Teslim Edildi</option><option>İptal</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödeme Al Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>💰 Ödeme Al</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body space-y-4">
                {(() => {
                  const device = devices.find(d => d.id === paymentForm.cihaz_kimliği)
                  const finalCost = device?.son_maliyet || 0
                  const currentPaid = device?.ödenen_miktar || 0
                  const remaining = finalCost - currentPaid
                  return (
                    <>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Cihaz</div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{device?.marka} {device?.model}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam</div>
                          <div className="font-bold text-emerald-400">₺{finalCost.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan</div>
                          <div className={`font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{remaining.toLocaleString('tr-TR')}</div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Ödenen Tutar (TL) *</label>
                        <input className="input" type="number" step="0.01" value={paymentForm.ödeme_miktarı} onChange={(e) => setPaymentForm({...paymentForm, ödeme_miktarı: e.target.value})} required />
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>💰 Ödemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Müşteri Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowCustomerModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Müşteri Ekle</h2>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleCustomerSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={customerForm.ad} onChange={(e) => setCustomerForm({...customerForm, ad: e.target.value})} required autoComplete="off" /></div>
                <div className="form-group"><label>Telefon *</label><input className="input" value={customerForm.telefon} onChange={(e) => setCustomerForm({...customerForm, telefon: e.target.value})} required autoComplete="off" /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={customerForm.email} onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})} autoComplete="off" /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={customerForm.adres} onChange={(e) => setCustomerForm({...customerForm, adres: e.target.value})} autoComplete="off" /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={customerForm.notlar} onChange={(e) => setCustomerForm({...customerForm, notlar: e.target.value})} autoComplete="off" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Müşteriyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

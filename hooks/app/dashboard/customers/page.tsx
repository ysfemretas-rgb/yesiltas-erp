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
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerDetails, setCustomerDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [editForm, setEditForm] = useState({ id: '', name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: customersData }, { data: debtsData }] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('debts').select('*')
    ])
    if (customersData) setCustomers(customersData)
    if (debtsData) setDebts(debtsData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const insertData = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null
      }
      const { data, error } = await supabase.from('customers').insert([insertData]).select()
      if (error) throw error
      setToast({ message: 'Müşteri eklendi!', type: 'success' })
      setShowAddModal(false)
      setForm({ name: '', phone: '', email: '', address: '', notes: '' })
      if (data && data[0]) setCustomers(prev => [data[0], ...prev])
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const openEditModal = (customer: any) => {
    setEditForm({
      id: customer.id, name: customer.name || '', phone: customer.phone || '',
      email: customer.email || '', address: customer.address || '', notes: customer.notes || ''
    })
    setShowEditModal(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('customers').update({
        name: editForm.name.trim(), phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null, address: editForm.address.trim() || null,
        notes: editForm.notes.trim() || null
      }).eq('id', editForm.id)
      if (error) throw error
      setToast({ message: 'Müşteri güncellendi!', type: 'success' })
      setShowEditModal(false)
      loadData()
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz? Bu müşteriye ait tüm kayıtlar da silinecektir.')) return
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
      if (custError) throw custError
      setToast({ message: 'Müşteri ve tüm bağlı kayıtlar silindi!', type: 'success' })
      setCustomers(prev => prev.filter(c => c.id !== id))
      if (selectedCustomer?.id === id) { setSelectedCustomer(null); setCustomerDetails(null) }
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
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
      const totalDebt = (debtsRes.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0)
      const totalPaid = (paymentsRes.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
      const allTransactions = [
        ...(debtsRes.data || []).map((d: any) => ({...d, type: 'Borç', typeColor: 'text-red-400'})),
        ...(paymentsRes.data || []).map((p: any) => ({...p, type: 'Ödeme', typeColor: 'text-emerald-400'})),
        ...(devicesRes.data || []).map((d: any) => ({...d, type: 'Teknik Servis', typeColor: 'text-blue-400', amount: d.price || 0})),
        ...(salesRes.data || []).map((s: any) => ({...s, type: 'Satış', typeColor: 'text-purple-400'}))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setCustomerDetails({
        debts: debtsRes.data || [], payments: paymentsRes.data || [], devices: devicesRes.data || [], sales: salesRes.data || [],
        totalDebt, totalPaid, remaining: totalDebt - totalPaid, transactions: allTransactions
      })
    } catch (err: any) {
      setToast({ message: `HATA: ${err.message}`, type: 'error' })
    } finally {
      setDetailsLoading(false)
    }
  }

  const getCustomerDebts = (customerId: string) => debts.filter(d => d.customer_id === customerId)
  const getTotalDebt = (customerId: string) => getCustomerDebts(customerId).reduce((sum, d) => sum + (d.remaining || 0), 0)

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/90${cleanPhone}`, '_blank')
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  if (loading && customers.length === 0) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-4">
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Müşteriler</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Yeni Müşteri</button>
      </div>

      <input type="text" className="input max-w-md" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Ad</th><th>Telefon</th><th>E-posta</th><th>Borç</th><th>İşlemler</th></tr></thead>
          <tbody>
            {filtered.map((c) => {
              const totalDebt = getTotalDebt(c.id)
              return (
                <tr key={c.id}>
                  <td className="font-medium cursor-pointer hover:underline" style={{ color: 'var(--text-primary)' }} onClick={() => loadCustomerDetails(c)}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email || '-'}</td>
                  <td>
                    {totalDebt > 0 ? (
                      <span className="text-red-400 font-medium">₺{totalDebt.toLocaleString('tr-TR')}</span>
                    ) : (
                      <span className="text-emerald-400">Borç yok</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => loadCustomerDetails(c)} className="btn btn-sm btn-secondary">Detay</button>
                      <button onClick={() => openEditModal(c)} className="btn btn-sm btn-secondary">Düzenle</button>
                      {c.phone && (
                        <button onClick={() => handleWhatsApp(c.phone)} className="btn btn-sm btn-secondary">WP</button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-danger">Sil</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>Müşteri bulunamadı</p></div>}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Yeni Müşteri</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Müşteri Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body space-y-4">
                <div className="form-group"><label>Ad *</label><input className="input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></div>
                <div className="form-group"><label>Telefon</label><input className="input" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
                <div className="form-group"><label>E-posta</label><input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
                <div className="form-group"><label>Adres</label><textarea className="input" rows={2} value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></div>
                <div className="form-group"><label>Notlar</label><textarea className="input" rows={2} value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
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
                      <tr><th style={{ whiteSpace: 'nowrap' }}>Tarih</th><th style={{ whiteSpace: 'nowrap' }}>Saat</th><th style={{ whiteSpace: 'nowrap' }}>İşlem Türü</th><th style={{ whiteSpace: 'nowrap' }}>Detay</th><th style={{ whiteSpace: 'nowrap' }}>Tutar</th><th style={{ whiteSpace: 'nowrap' }}>Durum</th></tr>
                    </thead>
                    <tbody>
                      {customerDetails.transactions.map((t: any, i: number) => (
                        <tr key={i}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString('tr-TR')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}><span className={`font-semibold ${t.typeColor}`}>{t.type}</span></td>
                          <td style={{ maxWidth: '300px', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>{t.description || t.issue || t.device_name || t.product_name || t.notes || '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }} className={t.type === 'Ödeme' ? 'text-emerald-400' : t.type === 'Borç' ? 'text-red-400' : 'text-blue-400'}>₺{(t.amount || 0).toLocaleString('tr-TR')}</td>
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
    </div>
  )
}

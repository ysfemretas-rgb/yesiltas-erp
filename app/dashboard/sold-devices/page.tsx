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

interface Sale {
  id: string
  customer_id: string
  item_name: string
  item_type: string
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string
  installments: number
  remaining_amount: number
  warranty_months: number
  warranty_end_date: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function SoldDevicesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    customer_id: '',
    item_name: '',
    unit_price: '',
    quantity: '1',
    payment_method: 'Nakit',
    installments: '1',
    remaining_amount: '',
    warranty_months: '12'
  })
  const [paymentForm, setPaymentForm] = useState({
    sale_id: '',
    payment_amount: ''
  })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = sales
    if (search) {
      const term = search.toLowerCase()
      result = result.filter(s => s.item_name?.toLowerCase().includes(term))
    }
    setFiltered(result)
  }, [search, sales])

  const loadData = async () => {
    setLoading(true)
    const [salesRes, customersRes] = await Promise.all([
      supabase.from('sales').select('*').eq('item_type', 'Cihaz').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone')
    ])
    if (salesRes.data) setSales(salesRes.data)
    if (customersRes.data) setCustomers(customersRes.data)
    setLoading(false)
  }

  const openEditModal = (sale: Sale) => {
    setEditForm({
      id: sale.id,
      customer_id: sale.customer_id || '',
      item_name: sale.item_name || '',
      unit_price: sale.unit_price?.toString() || '',
      quantity: sale.quantity?.toString() || '1',
      payment_method: sale.payment_method || 'Nakit',
      installments: sale.installments?.toString() || '1',
      remaining_amount: sale.remaining_amount?.toString() || '',
      warranty_months: sale.warranty_months?.toString() || '12'
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const total = parseFloat(editForm.unit_price) * parseInt(editForm.quantity)
      const { error } = await supabase.from('sales').update({
        customer_id: editForm.customer_id,
        item_name: editForm.item_name.trim(),
        unit_price: parseFloat(editForm.unit_price) || 0,
        quantity: parseInt(editForm.quantity) || 1,
        total_price: total,
        payment_method: editForm.payment_method,
        installments: parseInt(editForm.installments) || 1,
        remaining_amount: parseFloat(editForm.remaining_amount) || 0,
        warranty_months: parseInt(editForm.warranty_months) || 12
      }).eq('id', editForm.id)

      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Satış kaydı güncellendi!', type: 'success' })
        setShowEditModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const openPaymentModal = (sale: Sale) => {
    setPaymentForm({
      sale_id: sale.id,
      payment_amount: ''
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const sale = sales.find(s => s.id === paymentForm.sale_id)
      if (!sale) return

      const paymentAmount = parseFloat(paymentForm.payment_amount) || 0
      const newRemaining = Math.max(0, (sale.remaining_amount || 0) - paymentAmount)

      const { error } = await supabase.from('sales').update({
        remaining_amount: newRemaining
      }).eq('id', paymentForm.sale_id)

      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        await supabase.from('customer_payments').insert([{
          customer_id: sale.customer_id,
          amount: paymentAmount,
          payment_method: sale.payment_method,
          notes: `Taksit ödemesi - ${sale.item_name}`
        }])

        setToast({ message: `₺${paymentAmount.toLocaleString('tr-TR')} ödeme kaydedildi! Kalan: ₺${newRemaining.toLocaleString('tr-TR')}`, type: 'success' })
        setShowPaymentModal(false)
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu satış kaydını silmek istediğinize emin misiniz?')) return
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        setToast({ message: 'Satış kaydı silindi!', type: 'success' })
        loadData()
      }
    } catch (err: any) {
      setToast({ message: `Hata: ${err.message}`, type: 'error' })
    }
  }

  const isWarrantyActive = (endDate: string) => {
    return endDate ? new Date(endDate) > new Date() : false
  }

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return 0
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getPaymentStatus = (sale: Sale) => {
    const total = sale.total_price || 0
    const remaining = sale.remaining_amount || 0
    const paid = total - remaining

    if (remaining <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Peşin</span>
    }
    if (sale.payment_method === 'Taksit') {
      const monthly = total / (sale.installments || 1)
      const paidInstallments = Math.floor(paid / monthly)
      return (
        <div className="flex flex-col gap-1">
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💳 Taksit</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInstallments}/{sale.installments} ödendi</span>
          <span className="text-xs text-red-400">Kalan: ₺{remaining.toLocaleString('tr-TR')}</span>
        </div>
      )
    }
    return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>❌ ₺{remaining.toLocaleString('tr-TR')}</span>
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
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Satılan Cihazlar</h1>
      </div>

      <input type="text" className="input" placeholder="Cihaz ara..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Cihaz</th>
              <th>Müşteri</th>
              <th>Tutar</th>
              <th>Ödeme</th>
              <th>Taksit</th>
              <th>Garanti</th>
              <th>Kalan Süre</th>
              <th>Satış Tarihi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => {
              const customer = customers.find(c => c.id === sale.customer_id)
              const active = isWarrantyActive(sale.warranty_end_date)
              const daysLeft = daysUntilExpiry(sale.warranty_end_date)
              const monthlyInstallment = sale.payment_method === 'Taksit' ? (sale.total_price || 0) / (sale.installments || 1) : 0
              return (
                <tr key={sale.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.item_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{customer?.name || 'Bilinmiyor'}<br/><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{customer?.phone}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{(sale.total_price || 0).toLocaleString('tr-TR')}</td>
                  <td>{getPaymentStatus(sale)}</td>
                  <td>
                    {sale.payment_method === 'Taksit' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sale.installments} ay</span>
                        <span className="text-xs text-emerald-400">₺{monthlyInstallment.toLocaleString('tr-TR')}/ay</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Aktif' : 'Sona Erdi'}</span></td>
                  <td className={daysLeft < 30 ? 'text-red-400' : ''} style={{ color: daysLeft >= 30 ? 'var(--text-secondary)' : undefined }}>
                    {active ? `${daysLeft} gün` : 'Sona erdi'}
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      {(sale.remaining_amount || 0) > 0 && (
                        <button onClick={() => openPaymentModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} title="Taksit Öde">💰</button>
                      )}
                      <button onClick={() => handleDelete(sale.id)} className="btn btn-danger btn-sm">Sil</button>
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
          <p>Henüz satılan cihaz kaydı yok</p>
        </div>
      )}

      {/* Düzenle Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Satış Kaydını Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label>Müşteri *</label>
                  <select className="select" value={editForm.customer_id} onChange={(e) => setEditForm({...editForm, customer_id: e.target.value})} required>
                    <option value="">Seçin</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ürün Adı *</label><input className="input" value={editForm.item_name} onChange={(e) => setEditForm({...editForm, item_name: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Birim Fiyatı (TL)</label><input className="input" type="number" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})} /></div>
                  <div className="form-group"><label>Miktar</label><input className="input" type="number" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label>Ödeme Yöntemi</label>
                    <select className="select" value={editForm.payment_method} onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}>
                      <option>Nakit</option>
                      <option>Kredi Kartı</option>
                      <option>Taksit</option>
                      <option>Havale</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taksit Sayısı</label><input className="input" type="number" value={editForm.installments} onChange={(e) => setEditForm({...editForm, installments: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group"><label>Kalan Miktar (TL)</label><input className="input" type="number" step="0.01" value={editForm.remaining_amount} onChange={(e) => setEditForm({...editForm, remaining_amount: e.target.value})} /></div>
                  <div className="form-group"><label>Garanti (Ay)</label><input className="input" type="number" value={editForm.warranty_months} onChange={(e) => setEditForm({...editForm, warranty_months: e.target.value})} /></div>
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

      {/* Taksit Öde Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>💳 Taksit Ödeme</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body space-y-4">
                {(() => {
                  const sale = sales.find(s => s.id === paymentForm.sale_id)
                  const total = sale?.total_price || 0
                  const remaining = sale?.remaining_amount || 0
                  const paid = total - remaining
                  const monthly = total / (sale?.installments || 1)
                  return (
                    <>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Cihaz</div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale?.item_name}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Toplam</div>
                          <div className="font-bold text-emerald-400">₺{total.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ödenen</div>
                          <div className="font-bold text-blue-400">₺{paid.toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan</div>
                          <div className={`font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>₺{remaining.toLocaleString('tr-TR')}</div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Aylık Taksit</div>
                        <div className="font-bold text-yellow-400">₺{monthly.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="form-group">
                        <label>Ödeme Tutarı (TL) *</label>
                        <input className="input" type="number" step="0.01" value={paymentForm.payment_amount} onChange={(e) => setPaymentForm({...paymentForm, payment_amount: e.target.value})} placeholder={monthly.toString()} required />
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>💳 Ödemeyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
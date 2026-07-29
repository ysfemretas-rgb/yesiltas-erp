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
  müşteri_kimliği: string
  ürün_adi: string
  ürün_türü: string
  miktar: number
  birim_fiyati: number
  toplam_fiyat: number
  ödeme_yöntemi: string
  taksitler: number
  kalan_miktar: number
  garanti_aylar: number
  garanti_bitiş: string
  oluşturma_tarihi: string
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
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    müşteri_kimliği: '',
    ürün_adi: '',
    birim_fiyati: '',
    miktar: '1',
    ödeme_yöntemi: 'Nakit',
    taksitler: '1',
    kalan_miktar: '',
    garanti_aylar: '12'
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
      result = result.filter(s => s.ürün_adi?.toLowerCase().includes(term))
    }
    setFiltered(result)
  }, [search, sales])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Önce TÜM satışları çek, filtre yok
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('oluşturma_tarihi', { ascending: false })

      if (salesError) {
        setError(`Sales hatası: ${salesError.message}`)
        setLoading(false)
        return
      }

      console.log('Sales data:', salesData)
      console.log('Sales count:', salesData?.length)

      const { data: customersData } = await supabase.from('customers').select('id, name, phone')

      if (salesData) setSales(salesData)
      if (customersData) setCustomers(customersData)
    } catch (err: any) {
      setError(`Catch hatası: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (sale: Sale) => {
    setEditForm({
      id: sale.id,
      müşteri_kimliği: sale.müşteri_kimliği || '',
      ürün_adi: sale.ürün_adi || '',
      birim_fiyati: sale.birim_fiyati?.toString() || '',
      miktar: sale.miktar?.toString() || '1',
      ödeme_yöntemi: sale.ödeme_yöntemi || 'Nakit',
      taksitler: sale.taksitler?.toString() || '1',
      kalan_miktar: sale.kalan_miktar?.toString() || '',
      garanti_aylar: sale.garanti_aylar?.toString() || '12'
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const total = parseFloat(editForm.birim_fiyati) * parseInt(editForm.miktar)
      const { error } = await supabase.from('sales').update({
        müşteri_kimliği: editForm.müşteri_kimliği,
        ürün_adi: editForm.ürün_adi.trim(),
        birim_fiyati: parseFloat(editForm.birim_fiyati) || 0,
        miktar: parseInt(editForm.miktar) || 1,
        toplam_fiyat: total,
        ödeme_yöntemi: editForm.ödeme_yöntemi,
        taksitler: parseInt(editForm.taksitler) || 1,
        kalan_miktar: parseFloat(editForm.kalan_miktar) || 0,
        garanti_aylar: parseInt(editForm.garanti_aylar) || 12
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
      const newRemaining = Math.max(0, (sale.kalan_miktar || 0) - paymentAmount)

      const { error } = await supabase.from('sales').update({
        kalan_miktar: newRemaining
      }).eq('id', paymentForm.sale_id)

      if (error) {
        setToast({ message: `Hata: ${error.message}`, type: 'error' })
      } else {
        await supabase.from('customer_payments').insert([{
          customer_id: sale.müşteri_kimliği,
          amount: paymentAmount,
          payment_method: sale.ödeme_yöntemi,
          notes: `Taksit ödemesi - ${sale.ürün_adi}`
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
    const total = sale.toplam_fiyat || 0
    const remaining = sale.kalan_miktar || 0
    const paid = total - remaining

    if (remaining <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>✅ Peşin</span>
    }
    if (sale.ödeme_yöntemi === 'Taksit') {
      const monthly = total / (sale.taksitler || 1)
      const paidInstallments = Math.floor(paid / monthly)
      return (
        <div className="flex flex-col gap-1">
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>💳 Taksit</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidInstallments}/{sale.taksitler} ödendi</span>
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
      
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          <strong>HATA:</strong> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Satılan Cihazlar</h1>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Toplam: {sales.length} kayıt | Filtrelenen: {filtered.length}
        </div>
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
              const customer = customers.find(c => c.id === sale.müşteri_kimliği)
              const active = isWarrantyActive(sale.garanti_bitiş)
              const daysLeft = daysUntilExpiry(sale.garanti_bitiş)
              const monthlyInstallment = sale.ödeme_yöntemi === 'Taksit' ? (sale.toplam_fiyat || 0) / (sale.taksitler || 1) : 0
              return (
                <tr key={sale.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.ürün_adi}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{customer?.name || 'Bilinmiyor'}<br/><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{customer?.phone}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>₺{(sale.toplam_fiyat || 0).toLocaleString('tr-TR')}</td>
                  <td>{getPaymentStatus(sale)}</td>
                  <td>
                    {sale.ödeme_yöntemi === 'Taksit' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sale.taksitler} ay</span>
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
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{sale.oluşturma_tarihi ? new Date(sale.oluşturma_tarihi).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => openEditModal(sale)} className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                      {(sale.kalan_miktar || 0) > 0 && (
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

      {filtered.length === 0 && !error && (
        <div className="empty-state">
          <p>Henüz satılan cihaz kaydı yok</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Toplam {sales.length} satış kaydı var (tüm türler)</p>
        </div>
      )}
    </div>
  )
}
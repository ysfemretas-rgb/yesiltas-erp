"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  description: string
  date: string
  created_at: string
}

export default function FinancePage() {
  var [transactions, setTransactions] = useState<Transaction[]>([])
  var [loading, setLoading] = useState(true)
  var [showForm, setShowForm] = useState(false)
  var [search, setSearch] = useState("")
  var [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  var [filterType, setFilterType] = useState("all")
  var [dateFrom, setDateFrom] = useState("")
  var [dateTo, setDateTo] = useState("")

  // Form state
  var [type, setType] = useState("income")
  var [category, setCategory] = useState("")
  var [amount, setAmount] = useState(0)
  var [description, setDescription] = useState("")
  var [date, setDate] = useState("")

  useEffect(function() {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    var result = await supabase.from("transactions").select("*").order("date", { ascending: false })
    if (result.data) setTransactions(result.data)
    setLoading(false)
  }

  function resetForm() {
    setType("income")
    setCategory("")
    setAmount(0)
    setDescription("")
    setDate(new Date().toISOString().split("T")[0])
    setEditTransaction(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    var data = {
      type: type,
      category: category,
      amount: amount,
      description: description,
      date: date,
    }
    if (editTransaction) {
      await supabase.from("transactions").update(data).eq("id", editTransaction.id)
    } else {
      await supabase.from("transactions").insert([data])
    }
    resetForm()
    setShowForm(false)
    fetchTransactions()
  }

  function handleEdit(t: Transaction) {
    setEditTransaction(t)
    setType(t.type)
    setCategory(t.category || "")
    setAmount(t.amount)
    setDescription(t.description || "")
    setDate(t.date ? t.date.split("T")[0] : "")
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await supabase.from("transactions").delete().eq("id", id)
    fetchTransactions()
  }

  function getFilteredTransactions() {
    var filtered: Transaction[] = []
    for (var i = 0; i < transactions.length; i++) {
      var t = transactions[i]
      if (filterType !== "all" && t.type !== filterType) continue
      if (dateFrom && t.date && t.date < dateFrom) continue
      if (dateTo && t.date && t.date > dateTo) continue
      if (search) {
        var lowerSearch = search.toLowerCase()
        var match = false
        if (t.category && t.category.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (t.description && t.description.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (!match) continue
      }
      filtered.push(t)
    }
    return filtered
  }

  function getCategories() {
    var cats: string[] = []
    for (var i = 0; i < transactions.length; i++) {
      var cat = transactions[i].category
      if (cat) {
        var found = false
        for (var j = 0; j < cats.length; j++) {
          if (cats[j] === cat) {
            found = true
            break
          }
        }
        if (!found) cats.push(cat)
      }
    }
    return cats
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    var d = new Date(dateStr)
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
  }

  function formatPrice(price: number) {
    return price.toLocaleString("tr-TR") + " TL"
  }

  var filtered = getFilteredTransactions()
  var totalIncome = 0
  var totalExpense = 0
  for (var i = 0; i < filtered.length; i++) {
    if (filtered[i].type === "income") totalIncome = totalIncome + filtered[i].amount
    else totalExpense = totalExpense + filtered[i].amount
  }
  var balance = totalIncome - totalExpense

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Finans</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni İşlem
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Gelir</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-green-600">{formatPrice(totalIncome)}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Gider</h3></div>
          <div className="card-content"><p className="text-2xl font-bold text-red-600">{formatPrice(totalExpense)}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Bakiye</h3></div>
          <div className="card-content"><p className={"text-2xl font-bold " + (balance >= 0 ? "text-green-600" : "text-red-600")}>{formatPrice(balance)}</p></div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" className="input w-full md:w-48" placeholder="Ara..." value={search} onChange={function(e) { setSearch(e.target.value) }} />
        <select className="input" value={filterType} onChange={function(e) { setFilterType(e.target.value) }}>
          <option value="all">Tümü</option>
          <option value="income">Gelir</option>
          <option value="expense">Gider</option>
        </select>
        <input type="date" className="input" value={dateFrom} onChange={function(e) { setDateFrom(e.target.value) }} />
        <input type="date" className="input" value={dateTo} onChange={function(e) { setDateTo(e.target.value) }} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTransaction ? "İşlem Düzenle" : "Yeni İşlem"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Tür</label>
                  <select className="input" value={type} onChange={function(e) { setType(e.target.value) }}>
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <input type="text" className="input" list="categories" value={category} onChange={function(e) { setCategory(e.target.value) }} required />
                  <datalist id="categories">
                    {getCategories().map(function(cat) {
                      return <option key={cat} value={cat} />
                    })}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="label">Tutar (TL)</label>
                  <input type="number" className="input" value={amount} min={0} onChange={function(e) { setAmount(Number(e.target.value)) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Tarih</label>
                  <input type="date" className="input" value={date} onChange={function(e) { setDate(e.target.value) }} required />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Açıklama</label>
                  <textarea className="input" rows={2} value={description} onChange={function(e) { setDescription(e.target.value) }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>İptal</button>
                <button type="submit" className="btn btn-primary">{editTransaction ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="spinner"></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">İşlem bulunamadı.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tür</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Tutar</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(t) {
                return (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>
                      <span className={"badge " + (t.type === "income" ? "badge-green" : "badge-red")}>
                        {t.type === "income" ? "Gelir" : "Gider"}
                      </span>
                    </td>
                    <td>{t.category || "-"}</td>
                    <td>{t.description || "-"}</td>
                    <td className={t.type === "income" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {formatPrice(t.amount)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(t) }}>Düzenle</button>
                        <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(t.id) }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

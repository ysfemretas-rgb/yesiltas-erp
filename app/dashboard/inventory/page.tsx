"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  min_stock: number
  price: number
  cost: number
  supplier: string
  created_at: string
}

export default function InventoryPage() {
  var [items, setItems] = useState<InventoryItem[]>([])
  var [loading, setLoading] = useState(true)
  var [showForm, setShowForm] = useState(false)
  var [search, setSearch] = useState("")
  var [editItem, setEditItem] = useState<InventoryItem | null>(null)
  var [filterLowStock, setFilterLowStock] = useState(false)

  // Form state
  var [name, setName] = useState("")
  var [category, setCategory] = useState("")
  var [stock, setStock] = useState(0)
  var [minStock, setMinStock] = useState(5)
  var [price, setPrice] = useState(0)
  var [cost, setCost] = useState(0)
  var [supplier, setSupplier] = useState("")

  useEffect(function() {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    var result = await supabase.from("inventory").select("*").order("name")
    if (result.data) setItems(result.data)
    setLoading(false)
  }

  function resetForm() {
    setName("")
    setCategory("")
    setStock(0)
    setMinStock(5)
    setPrice(0)
    setCost(0)
    setSupplier("")
    setEditItem(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    var data = {
      name: name,
      category: category,
      stock: stock,
      min_stock: minStock,
      price: price,
      cost: cost,
      supplier: supplier,
    }
    if (editItem) {
      await supabase.from("inventory").update(data).eq("id", editItem.id)
    } else {
      await supabase.from("inventory").insert([data])
    }
    resetForm()
    setShowForm(false)
    fetchItems()
  }

  function handleEdit(item: InventoryItem) {
    setEditItem(item)
    setName(item.name)
    setCategory(item.category || "")
    setStock(item.stock)
    setMinStock(item.min_stock || 5)
    setPrice(item.price || 0)
    setCost(item.cost || 0)
    setSupplier(item.supplier || "")
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await supabase.from("inventory").delete().eq("id", id)
    fetchItems()
  }

  function getFilteredItems() {
    var filtered: InventoryItem[] = []
    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      if (filterLowStock && item.stock >= (item.min_stock || 5)) continue
      if (search) {
        var lowerSearch = search.toLowerCase()
        var match = false
        if (item.name && item.name.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (item.category && item.category.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (item.supplier && item.supplier.toLowerCase().indexOf(lowerSearch) !== -1) match = true
        if (!match) continue
      }
      filtered.push(item)
    }
    return filtered
  }

  function formatPrice(price: number) {
    return price.toLocaleString("tr-TR") + " TL"
  }

  var filtered = getFilteredItems()
  var lowStockCount = 0
  var totalValue = 0
  for (var i = 0; i < items.length; i++) {
    if (items[i].stock < (items[i].min_stock || 5)) lowStockCount++
    totalValue = totalValue + items[i].stock * items[i].price
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni Ürün
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Ürün</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{items.length}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Düşük Stok</h3></div>
          <div className="card-content"><p className={"text-2xl font-bold " + (lowStockCount > 0 ? "text-red-600" : "text-green-600")}>{lowStockCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Stok Değeri</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{formatPrice(totalValue)}</p></div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" className="input w-full md:w-64" placeholder="Ürün ara..." value={search} onChange={function(e) { setSearch(e.target.value) }} />
        <button
          className={"btn " + (filterLowStock ? "btn-danger" : "btn-secondary")}
          onClick={function() { setFilterLowStock(!filterLowStock) }}
        >
          {filterLowStock ? "Tümünü Göster" : "Düşük Stokları Göster"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? "Ürün Düzenle" : "Yeni Ürün"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Ürün Adı *</label>
                  <input type="text" className="input" value={name} onChange={function(e) { setName(e.target.value) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <input type="text" className="input" value={category} onChange={function(e) { setCategory(e.target.value) }} />
                </div>
                <div className="form-group">
                  <label className="label">Stok *</label>
                  <input type="number" className="input" value={stock} min={0} onChange={function(e) { setStock(Number(e.target.value)) }} required />
                </div>
                <div className="form-group">
                  <label className="label">Min. Stok</label>
                  <input type="number" className="input" value={minStock} min={0} onChange={function(e) { setMinStock(Number(e.target.value)) }} />
                </div>
                <div className="form-group">
                  <label className="label">Satış Fiyatı (TL)</label>
                  <input type="number" className="input" value={price} min={0} onChange={function(e) { setPrice(Number(e.target.value)) }} />
                </div>
                <div className="form-group">
                  <label className="label">Maliyet (TL)</label>
                  <input type="number" className="input" value={cost} min={0} onChange={function(e) { setCost(Number(e.target.value)) }} />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Tedarikçi</label>
                  <input type="text" className="input" value={supplier} onChange={function(e) { setSupplier(e.target.value) }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>İptal</button>
                <button type="submit" className="btn btn-primary">{editItem ? "Güncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="spinner"></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Ürün bulunamadı.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Min. Stok</th>
                <th>Fiyat</th>
                <th>Maliyet</th>
                <th>Tedarikçi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(item) {
                var isLow = item.stock < (item.min_stock || 5)
                return (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.category || "-"}</td>
                    <td>
                      <span className={"badge " + (isLow ? "badge-red" : "badge-green")}>
                        {item.stock}
                      </span>
                    </td>
                    <td>{item.min_stock || 5}</td>
                    <td>{formatPrice(item.price || 0)}</td>
                    <td>{formatPrice(item.cost || 0)}</td>
                    <td>{item.supplier || "-"}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(item) }}>Düzenle</button>
                        <button className="btn btn-sm btn-danger" onClick={function() { handleDelete(item.id) }}>Sil</button>
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

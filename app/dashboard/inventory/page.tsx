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
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [filterLowStock, setFilterLowStock] = useState(false)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [price, setPrice] = useState(0)
  const [cost, setCost] = useState(0)
  const [supplier, setSupplier] = useState("")

  useEffect(function() {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const result = await supabase.from("inventory").select("*").order("name")
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
    const data = {
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
    if (!confirm("Silmek istediginize emin misiniz?")) return
    await supabase.from("inventory").delete().eq("id", id)
    fetchItems()
  }

  function getFilteredItems() {
    const filtered: InventoryItem[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (filterLowStock && item.stock >= (item.min_stock || 5)) continue
      if (search) {
        const lowerSearch = search.toLowerCase()
        let match = false
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

  const filtered = getFilteredItems()
  let lowStockCount = 0
  let totalValue = 0
  for (let i = 0; i < items.length; i++) {
    if (items[i].stock < (items[i].min_stock || 5)) lowStockCount++
    totalValue = totalValue + items[i].stock * items[i].price
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stok Yonetimi</h1>
        <button className="btn btn-primary" onClick={function() { resetForm(); setShowForm(true) }}>
          + Yeni Urun
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Toplam Urun</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{items.length}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Dusuk Stok</h3></div>
          <div className="card-content"><p className={"text-2xl font-bold " + (lowStockCount > 0 ? "text-red-600" : "text-green-600")}>{lowStockCount}</p></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Stok Degeri</h3></div>
          <div className="card-content"><p className="text-2xl font-bold">{formatPrice(totalValue)}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" className="input w-full md:w-64" placeholder="Urun ara" value={search} onChange={function(e) { setSearch(e.target.value) }} />
        <button
          className={"btn " + (filterLowStock ? "btn-danger" : "btn-secondary")}
          onClick={function() { setFilterLowStock(!filterLowStock) }}
        >
          {filterLowStock ? "Tumunu Goster" : "Dusuk Stoklari Goster"}
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? "Urun Duzenle" : "Yeni Urun"}</h2>
              <button className="modal-close" onClick={function() { setShowForm(false) }}>X</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Urun Adi *</label>
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
                  <label className="label">Satis Fiyati (TL)</label>
                  <input type="number" className="input" value={price} min={0} onChange={function(e) { setPrice(Number(e.target.value)) }} />
                </div>
                <div className="form-group">
                  <label className="label">Maliyet (TL)</label>
                  <input type="number" className="input" value={cost} min={0} onChange={function(e) { setCost(Number(e.target.value)) }} />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="label">Tedarikci</label>
                  <input type="text" className="input" value={supplier} onChange={function(e) { setSupplier(e.target.value) }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={function() { setShowForm(false) }}>Iptal</button>
                <button type="submit" className="btn btn-primary">{editItem ? "Guncelle" : "Kaydet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Urun bulunamadi.</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Urun</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Min. Stok</th>
                <th>Fiyat</th>
                <th>Maliyet</th>
                <th>Tedarikci</th>
                <th>Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(item) {
                const isLow = item.stock < (item.min_stock || 5)
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
                        <button className="btn btn-sm btn-secondary" onClick={function() { handleEdit(item) }}>Duzenle</button>
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

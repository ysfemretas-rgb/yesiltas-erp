"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Pencil, Package2, Upload, RefreshCw } from "lucide-react"
import { Toast, useToast } from "@/components/toast"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useIsManager } from "@/hooks/useIsManager"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { FixedAsset, fetchFixedAssets, createFixedAsset, createFixedAssetsBulk, updateFixedAsset, deleteFixedAsset, deleteFixedAssetsBulk } from "@/lib/fixedAssets"
import { ExcelImportDialog, ImportField } from "@/components/ExcelImportDialog"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount)
}

function toTRY(price: number, currency: "TRY" | "USD" | "EUR", rates: { USD: number; EUR: number }): number {
  if (currency === "USD") return price * rates.USD
  if (currency === "EUR") return price * rates.EUR
  return price
}

const CATEGORIES = ["Alet/Ekipman", "Mobilya", "Elektronik", "Bilgisayar", "Araç", "Diğer"]

const IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Ürün Adı", required: true, type: "text" },
  { key: "category", label: "Kategori", type: "text", defaultValue: "Diğer" },
  { key: "quantity", label: "Adet", type: "number", defaultValue: 1 },
  { key: "purchasePrice", label: "Alış Fiyatı", required: true, type: "number" },
  { key: "purchaseCurrency", label: "Para Birimi", type: "text", defaultValue: "TRY" },
  { key: "purchaseDate", label: "Alış Tarihi", type: "date" },
  { key: "location", label: "Konum", type: "text" },
  { key: "notes", label: "Not", type: "text" },
]

export default function FixedAssetsPage() {
  const { toast, showToast, hideToast } = useToast()
  const { authorized, checking } = usePageAccess("Demirbaşlar")
  const isManager = useIsManager()
  const { rates, isLoadingRates, fetchRates } = useExchangeRates()

  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newAsset, setNewAsset] = useState<Partial<FixedAsset>>({
    category: "Alet/Ekipman",
    quantity: 1,
    purchaseCurrency: "TRY",
    purchaseDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchFixedAssets()
      .then((data) => setAssets(data))
      .catch((e) => {
        console.error("Demirbaşlar yüklenemedi:", e)
        showToast("Demirbaşlar yüklenirken bir sorun oluştu.", "error")
      })
      .finally(() => setIsLoaded(true))
  }, [])

  const totalValueTRY = assets.reduce((sum, a) => sum + toTRY(a.purchasePrice, a.purchaseCurrency, rates) * a.quantity, 0)

  const handleAddAsset = async () => {
    if (!newAsset.name?.trim()) {
      showToast("Lütfen ürün adı girin!", "error")
      return
    }
    try {
      const asset = await createFixedAsset({
        name: newAsset.name.trim(),
        category: newAsset.category || "Diğer",
        quantity: Number(newAsset.quantity) || 1,
        purchasePrice: Number(newAsset.purchasePrice) || 0,
        purchaseCurrency: newAsset.purchaseCurrency || "TRY",
        purchaseDate: newAsset.purchaseDate || new Date().toISOString().split("T")[0],
        location: newAsset.location || "",
        notes: newAsset.notes || "",
      })
      setAssets([asset, ...assets])
      setNewAsset({ category: "Alet/Ekipman", quantity: 1, purchaseCurrency: "TRY", purchaseDate: new Date().toISOString().split("T")[0] })
      setIsDialogOpen(false)
      showToast("Demirbaş eklendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Demirbaş eklenirken bir sorun oluştu.", "error")
    }
  }

  const handleUpdateAsset = async () => {
    if (!editingAsset) return
    try {
      const updated = await updateFixedAsset(editingAsset.id, editingAsset)
      setAssets(assets.map(a => a.id === updated.id ? updated : a))
      setIsEditOpen(false)
      setEditingAsset(null)
      showToast("Demirbaş güncellendi.", "success")
    } catch (e) {
      console.error(e)
      showToast("Demirbaş güncellenirken bir sorun oluştu.", "error")
    }
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Bu demirbaşı silmek istediğinize emin misiniz?")) return
    try {
      await deleteFixedAsset(id)
      setAssets(assets.filter(a => a.id !== id))
      showToast("Demirbaş silindi.", "success")
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Demirbaş silinirken bir sorun oluştu.", "error")
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === assets.length ? [] : assets.map(a => a.id))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`${selectedIds.length} demirbaşı silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    try {
      const count = await deleteFixedAssetsBulk(selectedIds)
      setAssets(assets.filter(a => !selectedIds.includes(a.id)))
      setSelectedIds([])
      showToast(`${count} demirbaş silindi.`, "success")
    } catch (e: any) {
      console.error(e)
      showToast(e?.message || "Demirbaşlar silinirken bir sorun oluştu.", "error")
    }
  }

  const handleExcelImport = async (rows: Record<string, any>[]) => {
    const validCurrency = (c: any): "TRY" | "USD" | "EUR" => ["TRY", "USD", "EUR"].includes(String(c).toUpperCase()) ? String(c).toUpperCase() as any : "TRY"
    const inputs = rows.map(r => ({
      name: String(r.name || "").trim(),
      category: String(r.category || "Diğer"),
      quantity: Number(r.quantity) || 1,
      purchasePrice: Number(r.purchasePrice) || 0,
      purchaseCurrency: validCurrency(r.purchaseCurrency),
      purchaseDate: r.purchaseDate || "",
      location: String(r.location || ""),
      notes: String(r.notes || ""),
    })).filter(r => r.name)
    const created = await createFixedAssetsBulk(inputs)
    setAssets([...created, ...assets])
  }

  if (checking) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-white">Yetki kontrol ediliyor...</div></div>
  }
  if (!authorized) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="text-white">Yetkisiz erişim. Yönlendiriliyor...</div></div>
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package2 className="h-6 w-6 text-slate-400" />
            📋 Demirbaşlar
          </h1>
          <p className="text-sm text-slate-400 mt-1">İşletmeye ait alet, ekipman, mobilya ve donanımlar.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline" className="border-slate-600 text-slate-300">
            <Upload className="h-4 w-4 mr-2" />Excel ile Yükle
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />Yeni Demirbaş
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-xs text-slate-400">Toplam Kalem</div>
            <div className="text-2xl font-bold text-white">{assets.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Toplam Değer (TL)</div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalValueTRY)}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={fetchRates} disabled={isLoadingRates} className="text-slate-400">
                <RefreshCw className={`h-4 w-4 ${isLoadingRates ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-1">Kur: USD {rates.USD?.toFixed(2)} ₺ · EUR {rates.EUR?.toFixed(2)} ₺</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-white">Demirbaş Listesi</CardTitle>
            {assets.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={selectedIds.length === assets.length} onChange={toggleSelectAll} className="rounded" />
                  Tümünü Seç
                </label>
                {selectedIds.length > 0 && isManager && (
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />{selectedIds.length} Seçileni Sil
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isLoaded ? (
            <p className="text-slate-500 text-center py-8">Yükleniyor...</p>
          ) : assets.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Henüz demirbaş eklenmemiş.</p>
          ) : (
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className={`p-3 bg-slate-800 rounded-lg border ${selectedIds.includes(a.id) ? "border-emerald-500" : "border-slate-700"}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="mt-1 rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{a.name} {a.quantity > 1 && <span className="text-slate-500">x{a.quantity}</span>}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {a.category} {a.location && `· 📍 ${a.location}`} {a.purchaseDate && `· 📅 ${a.purchaseDate}`}
                        </div>
                        {a.notes && <div className="text-xs text-slate-500 mt-0.5">{a.notes}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {formatCurrency(toTRY(a.purchasePrice, a.purchaseCurrency, rates) * a.quantity)}
                      </div>
                      {a.purchaseCurrency !== "TRY" && (
                        <div className="text-xs text-slate-500">
                          {a.purchaseCurrency} {a.purchasePrice.toLocaleString("tr-TR")} × {a.quantity}
                        </div>
                      )}
                      <div className="flex gap-1 justify-end mt-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAsset(a); setIsEditOpen(true) }} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {isManager && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteAsset(a.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni Demirbaş */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Yeni Demirbaş</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Ürün Adı *</Label>
              <Input value={newAsset.name || ""} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-300">Kategori</Label>
                <Select value={newAsset.category} onValueChange={(v) => setNewAsset({ ...newAsset, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Adet</Label>
                <Input type="number" value={newAsset.quantity || 1} onChange={(e) => setNewAsset({ ...newAsset, quantity: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-300">Alış Fiyatı</Label>
                <Input type="number" value={newAsset.purchasePrice || ""} onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Para Birimi</Label>
                <Select value={newAsset.purchaseCurrency} onValueChange={(v) => setNewAsset({ ...newAsset, purchaseCurrency: v as any })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="TRY" className="text-white">TL</SelectItem>
                    <SelectItem value="USD" className="text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newAsset.purchaseCurrency && newAsset.purchaseCurrency !== "TRY" && newAsset.purchasePrice ? (
              <p className="text-xs text-slate-500">≈ {formatCurrency(toTRY(Number(newAsset.purchasePrice) || 0, newAsset.purchaseCurrency as any, rates))}</p>
            ) : null}
            <div className="space-y-1">
              <Label className="text-slate-300">Alış Tarihi</Label>
              <Input type="date" value={newAsset.purchaseDate || ""} onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Konum</Label>
              <Input value={newAsset.location || ""} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} placeholder="Örn: Depo, Servis Masası" className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Not</Label>
              <Input value={newAsset.notes || ""} onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <Button onClick={handleAddAsset} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Düzenle */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Demirbaşı Düzenle</DialogTitle></DialogHeader>
          {editingAsset && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-slate-300">Ürün Adı</Label>
                <Input value={editingAsset.name} onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">Kategori</Label>
                  <Select value={editingAsset.category} onValueChange={(v) => setEditingAsset({ ...editingAsset, category: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Adet</Label>
                  <Input type="number" value={editingAsset.quantity} onChange={(e) => setEditingAsset({ ...editingAsset, quantity: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">Alış Fiyatı</Label>
                  <Input type="number" value={editingAsset.purchasePrice} onChange={(e) => setEditingAsset({ ...editingAsset, purchasePrice: Number(e.target.value) })} className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Para Birimi</Label>
                  <Select value={editingAsset.purchaseCurrency} onValueChange={(v) => setEditingAsset({ ...editingAsset, purchaseCurrency: v as any })}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="TRY" className="text-white">TL</SelectItem>
                      <SelectItem value="USD" className="text-white">USD</SelectItem>
                      <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Alış Tarihi</Label>
                <Input type="date" value={editingAsset.purchaseDate} onChange={(e) => setEditingAsset({ ...editingAsset, purchaseDate: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Konum</Label>
                <Input value={editingAsset.location} onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Not</Label>
                <Input value={editingAsset.notes} onChange={(e) => setEditingAsset({ ...editingAsset, notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <Button onClick={handleUpdateAsset} className="w-full bg-emerald-600 hover:bg-emerald-700">Kaydet</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Demirbaşları Excel ile Yükle"
        fields={IMPORT_FIELDS}
        onImport={handleExcelImport}
        templateHint="Excel dosyanızda şu sütunlar olmalı: Ürün Adı, Kategori, Adet, Alış Fiyatı, Para Birimi (TRY/USD/EUR), Alış Tarihi, Konum, Not. Sütun sırası ve tam isim önemli değil, bir sonraki adımda eşleştirebilirsiniz."
      />
    </div>
  )
}

"use client"

import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2, X } from "lucide-react"

interface ImageUploadFieldProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

// Telefondan fotoğraf çekip ya da galeriden seçip doğrudan yükler.
// Dosya Supabase Storage'a gider, dönen adres kayda yazılır.
export function ImageUploadField({ value, onChange, label = "Ürün Resmi" }: ImageUploadFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFile = async (file: File) => {
    setError("")
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir resim dosyası seçin.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resim çok büyük (en fazla 5 MB olmalı).")
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName)
      onChange(data.publicUrl)
    } catch (e: any) {
      console.error("Resim yüklenemedi:", e)
      setError(
        e?.message?.includes("Bucket not found")
          ? "Depolama alanı bulunamadı. Supabase'de 'product-images' deposunu oluşturmanız gerekiyor (kurulum SQL'ini çalıştırın)."
          : "Resim yüklenirken bir sorun oluştu."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className="h-28 w-28 rounded-lg object-cover border border-slate-600"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            title="Resmi kaldır"
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => cameraInputRef.current?.click()}
          className="border-slate-600 text-slate-300"
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
          Fotoğraf Çek
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => galleryInputRef.current?.click()}
          className="border-slate-600 text-slate-300"
        >
          <Upload className="h-4 w-4 mr-2" />Galeriden Seç
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) handleFile(f)
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) handleFile(f)
        }}
      />

      {uploading && <p className="text-xs text-slate-400">Yükleniyor...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

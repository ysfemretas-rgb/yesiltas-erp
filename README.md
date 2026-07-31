# Yeşiltaş Teknoloji ERP

## Kurulum

1. ZIP'i açın, dosyaları proje klasörüne atın
2. `npm install` çalıştırın
3. `.env.local` dosyası oluşturun:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
4. `npm run dev` ile başlatın

## Dosya Yapısı

```
app/
  dashboard/
    page.tsx          # Dashboard
    sales/
      page.tsx        # Satış (Peşin/Taksitli)
    devices/
      page.tsx        # Teknik Servis
    customers/
      page.tsx        # Müşteriler (Düzenleme + Borç)
    inventory/
      page.tsx        # Stok
    finance/
      page.tsx        # Kasa (Tarih filtresi)
    warranties/
      page.tsx        # Garantiler
  layout.tsx          # Root layout
  globals.css         # Stil
components/
  Sidebar.tsx         # Sidebar
lib/
  supabase.ts         # Supabase client
```

## Özellikler

- ✅ Peşin/Taksitli satış
- ✅ Otomatik stok düşme
- ✅ Otomatik kasa kaydı
- ✅ Borç takibi (debts)
- ✅ Garanti yönetimi
- ✅ WhatsApp entegrasyonu
- ✅ Tarih aralığı filtresi
- ✅ Düşük stok uyarısı
- ✅ Garanti süresi dolma uyarısı
" " 

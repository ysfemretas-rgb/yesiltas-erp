# Yeşiltaş ERP v1.0

Profesyonel telefon teknik servisi ve işletme yönetim sistemi.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ (https://nodejs.org)
- Git (https://git-scm.com)
- Supabase hesabı (https://supabase.com) - ÜCRETSİZ
- Vercel hesabı (https://vercel.com) - ÜCRETSİZ

### 1. Projeyi İndir
```bash
git clone https://github.com/YOUR_USERNAME/yesiltas-erp.git
cd yesiltas-erp
```

### 2. Paketleri Yükle
```bash
npm install
```

### 3. Supabase Kurulumu
1. https://supabase.com adresine git
2. "New Project" oluştur
3. SQL Editor'a gir
4. `supabase/migrations/` klasöründeki dosyaları sırayla çalıştır:
   - 001_init_core_tables.sql
   - 002_crm_module.sql
   - 003_service_module.sql
   - 004_stock_and_purchase_module.sql
   - 005_sales_finance_assets_notifications.sql

### 4. Environment Variables
`.env.local` dosyası oluştur:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Geliştirme Sunucusu
```bash
npm run dev
```
Tarayıcıda: http://localhost:3000

### 6. Vercel'e Deploy
```bash
npm i -g vercel
vercel
```

## 📁 Proje Yapısı

```
yesiltas-erp/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard layout + sayfalar
│   ├── api/                # API routes
│   ├── login/              # Giriş sayfası
│   └── ...
├── components/             # React bileşenleri
├── lib/                    # Yardımcı fonksiyonlar
├── types/                  # TypeScript tipleri
├── supabase/migrations/    # SQL migration dosyaları
└── public/                 # Statik dosyalar
```

## 🗄️ Veritabanı Şeması

### Modüller
- **Core**: Şirket, şube, kullanıcı, aktivite log
- **CRM**: Müşteriler, adresler, cihazlar, notlar
- **Teknik Servis**: Servis kayıtları, durumlar, teşhis, parça/işçilik
- **Stok**: Ürünler, kategoriler, seri takibi, hareketler
- **Satın Alma**: Tedarikçiler, siparişler, ödemeler
- **Satış**: Siparişler, kampanyalar
- **Finans**: Hesaplar, işlemler, ortak yatırımları
- **Demirbaş**: Varlıklar, bakım kayıtları
- **Bildirim**: Uyarılar, şablonlar

## 🔒 Güvenlik

- Row Level Security (RLS) aktif
- Şirket bazlı veri izolasyonu
- Rol bazlı yetkilendirme
- Audit trail
- Soft delete

## 📱 Özellikler

- Responsive tasarım (mobil, tablet, masaüstü)
- Dark/Light mode
- QR/Barkod desteği
- WhatsApp entegrasyonu hazırlığı
- Otomatik fiyat hesaplama
- Stok uyarıları
- Garanti takibi

## 👨‍💻 Geliştirici

Yusuf Emre Taş - Yeşiltaş Teknoloji

## 📄 Lisans

Tüm hakları saklıdır. © 2026 Yeşiltaş Teknoloji.

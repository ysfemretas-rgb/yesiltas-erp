# Yeşiltaş Teknoloji - Logo Paketi

## 📦 ZIP İçeriği

| Dosya | Boyut | Kullanım Yeri |
|-------|-------|---------------|
| `logo.svg` | Vektör | **Ana site logosu** (sidebar/header) - Önerilen |
| `favicon-32x32.png` | 32×32 | Tarayıcı sekmesi ikonu |
| `logo-512x512.png` | 512×512 | PWA, yüksek çözünürlük |
| `header-logo.png` | 600×120 | Üst menü banner |
| `app-icon-180x180.png` | 180×180 | iOS ana ekran ikonu |
| `app-icon-192x192.png` | 192×192 | Android manifest |
| `app-icon-512x512.png` | 512×512 | PWA ikonu |
| `og-image.png` | 1200×630 | Sosyal medya paylaşım görseli |

## 🚀 Siteye Yükleme Adımları

### 1. Dosyaları `public/` klasörüne atın:

```
public/
  ├── logo.svg              ← Ana logo (önerilen)
  ├── favicon.png           ← favicon-32x32.png'i yeniden adlandır
  ├── header-logo.png       ← Aynı kalır
  ├── apple-touch-icon.png  ← app-icon-180x180.png'i yeniden adlandır
  └── og-image.png          ← Aynı kalır
```

### 2. `app/layout.tsx`'e metadata ekleyin:

```tsx
export const metadata = {
  title: 'Yeşiltaş Teknoloji ERP',
  description: 'Yeşiltaş Teknoloji İşletme Yönetim Sistemi',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Yeşiltaş Teknoloji ERP',
    description: 'İşletme Yönetim Sistemi',
    images: ['/og-image.png'],
  },
}
```

### 3. Sidebar logo bölümünü değiştirin:

```tsx
// SVG kullanımı (önerilen):
<img src="/logo.svg" alt="Yeşiltaş Teknoloji" className="h-10 w-auto" />

// Veya PNG kullanımı:
<img src="/logo-512x512.png" alt="Yeşiltaş Teknoloji" className="h-10 w-auto object-contain" />
```

## 🎨 Renkler

| Renk | Kod | Kullanım |
|------|-----|----------|
| Koyu Yeşil | `#144B30` | Ana zemin |
| Parlak Yeşil | `#32BE69` | Kenar, vurgu |
| Açık Yeşil | `#7AE8A9` | İkincil vurgu |
| Beyaz | `#FFFFFF` | Yazı |

## ℹ️ Not

- **SVG** formatı vektör tabanlıdır, sınırsız ölçeklenebilir.
- Tek dosya (`logo.svg`) tüm boyutları karşılar.
- PNG'ler SVG'den otomatik oluşturulmuştur.

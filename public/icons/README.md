# Yeşiltaş Teknoloji - Logo Paketi

## 📁 Dosya Listesi

| Dosya | Boyut | Kullanım Yeri |
|-------|-------|---------------|
| `logo-yesiltas.svg` | Vektör | Ana site logosu (sidebar/header) |
| `favicon-32x32.png` | 32×32 | Tarayıcı sekmesi ikonu |
| `logo-512x512.png` | 512×512 | Yüksek çözünürlük |
| `header-logo.png` | 600×120 | Üst menü banner |
| `app-icon-180x180.png` | 180×180 | iOS ana ekran ikonu |
| `app-icon-192x192.png` | 192×192 | Android manifest |
| `app-icon-512x512.png` | 512×512 | PWA ikonu |
| `og-image.png` | 1200×630 | Sosyal medya paylaşım görseli |

## 🚀 Hızlı Kurulum

### `public/` klasörüne atılacaklar:
```
public/
  ├── logo-yesiltas.svg     → logo.svg olarak yeniden adlandır
  ├── favicon-32x32.png     → favicon.ico olarak yeniden adlandır
  ├── header-logo.png       → Aynı kalır
  ├── app-icon-180x180.png  → apple-touch-icon.png olarak yeniden adlandır
  └── og-image.png          → Aynı kalır
```

### Kodda Kullanım

**layout.tsx metadata:**
```tsx
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/og-image.png'],
  },
}
```

**Sidebar logo:**
```tsx
<img src="/logo.svg" alt="Yeşiltaş Teknoloji" className="h-10 w-auto" />
```

**Header banner:**
```tsx
<img src="/header-logo.png" alt="Yeşiltaş Teknoloji" className="h-8 w-auto" />
```

## 🎨 Renkler

| Renk | Hex | Kullanım |
|------|-----|----------|
| Yeşil (Ana) | `#01984c` | Logo zemin |
| Yeşil (Koyu) | `#00361c` | Gölgeler |
| Yeşil (Açık) | `#7ae8a9` | Vurgular |
| Altın | `#e8b218` | Detaylar |
| Gümüş | `#bbb` | Yazı rengi |

---
*Yeşiltaş Teknoloji - ERP Sistemi*

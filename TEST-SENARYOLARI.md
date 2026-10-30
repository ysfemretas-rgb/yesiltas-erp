# Yeşiltaş ERP — Son Kontrol Test Senaryoları

Gerçek işlerde kullanmadan önce **küçük tutarlı** kayıtlarla bu senaryoları bir kez uygulayın. Her senaryoda "Beklenen" satırı tutmuyorsa o adımı not alıp bildirin.

## 0) Hazırlık
1. Supabase SQL Editor'de `supabase-saglik-kontrolu.sql` dosyasını çalıştırın → hiçbir satırda ❌ olmamalı (olan satır için `MIGRATION-SIRASI.md`'deki ilgili SQL'i çalıştırın).
2. Yönetici hesabıyla giriş yapın; **Kasa > 🔎 Mutabakat** açın. Eski kayıtlardan kalan farklar çıkabilir (not alın); yeni yapacağınız testlerin fark üretmemesi gerekir.

## 1) Satış
| # | Adım | Beklenen |
|---|---|---|
| 1.1 | Stoğu 2 olan ürünü nakit sat | Stok 1; Kasa'a gelir; Mutabakat temiz |
| 1.2 | Stoğu **1** olan ürünü sat | Satış olur, stok **0 (tükendi)** |
| 1.3 | Stoğu 0 olan ürünü sepete eklemeye çalış | "stokta yok" uyarısı |
| 1.4 | Kısmi ödemeli satış (ör. 1000'in 400'ü) | Müşteri borcu 600; kasaya 400 gelir |
| 1.5 | Müşteri > Borç > **Tahsil Et** ile 600'ü al | Borç 0; kasaya 600 gelir |
| 1.6 | Eşantiyon (bedelsiz) satış | Müşteri geçmişinde 🎁; kasaya **alış maliyeti** kadar gider; gelir yok |
| 1.7 | Çoklu ödeme (nakit+kart) | Kasaya toplam gelir; satış detayında dağılım |
| 1.8 | Taksitli satış (peşinat + 3 taksit) | Taksit planı görünür; Tahsil Et en eski taksitten düşer |
| 1.9 | Takaslı satış | Takas cihazı "İkinci El" olarak stoğa girer; kasaya sadece nakit kısım |
| 1.10 | Satışta **Kısmi Ürün İadesi** (nakit iade) | Stok geri; kasaya iade gideri; toplam düşer |
| 1.11 | Satışı **İptal** et | Stok geri; kasada ters kayıt (eski kayıt silinmez); Mutabakat temiz |
| 1.12 | "Satışı Tamamla"ya hızlıca iki kez bas | Tek satış oluşur |

## 2) Alış ve stok
| # | Adım | Beklenen |
|---|---|---|
| 2.1 | Alışlar > Tedarikçiden Alış: yeni ürün, **Ödenmedi** | Ürün Envanter'de; Tedarikçi borcu = alış tutarı; kasa değişmez |
| 2.2 | Aynı alışa **Ödeme Yap** (tam) | Borç 0; kasaya gider |
| 2.3 | Alışta "Kısmi" ödeme | Kalan tutar borç; ödenen kasada gider |
| 2.4 | Müşteriden Alış (ikinci el cihaz, IMEI'li) | Cihaz stokta; alım belgesi yazdırılır; kasaya gider |
| 2.5 | Aynı IMEI'yi tekrar almaya çalış | "IMEI zaten stokta" hatası |
| 2.6 | Envanter ➕ → "Tedarikçiden satın alındı" | Alışlar'da yeni kayıt; borç artar |
| 2.7 | Envanter ➖ → "Hatalı alış girişini düzelt" | Stok düşer; **borç da düşer**; ödenmişse "Tedarikçi İadesi" geliri |
| 2.8 | Envanter ➖ → "Kayıp/hasar" | Stok düşer; borç aynı |
| 2.9 | Alınan ürün Satışlar'da listede | Ürün görünür ve satılır |

## 3) Teknik servis
| # | Adım | Beklenen |
|---|---|---|
| 3.1 | Yeni tamir (ön ödemeli) | Kasaya ön ödeme **bir kez** gelir |
| 3.2 | Tamirde parça ekle | Stok düşer; maliyet/kâr görünür |
| 3.3 | Teklif hazırla → WhatsApp → "Onayladı" | Aşama "Tamirde" |
| 3.4 | Kalite kontrol listesini boş bırakıp "Teslime Hazır" | Uyarı çıkar |
| 3.5 | Tamiri tamamla, kalanı tahsil et | Mutabakat temiz |
| 3.6 | Sayaç kutularına bas | Listeler açılır |

## 4) Kasa ve raporlar
| # | Adım | Beklenen |
|---|---|---|
| 4.1 | Kasa Sayımı (açılış, sonra kapanış) | Beklenen nakit hesaplanır; fark varsa açıklama ister |
| 4.2 | Ödeme Takvimi: aylık kira ekle, "Ödendi" | Kasaya gider; sonraki ay otomatik açılır |
| 4.3 | Gün Sonu raporu | Gelir/gider/net, kasayla uyumlu |
| 4.4 | Raporlar > Gerçek Kâr | Satış ve tamir kârı mantıklı |
| 4.5 | Mutabakat Merkezi (tüm testlerden sonra) | Yeni tutarsızlık yok |

## 5) Telefon
| # | Adım | Beklenen |
|---|---|---|
| 5.1 | Üst çubuk 🔍'a kod/IMEI yaz veya okut | Kayıt açılır |
| 5.2 | WhatsApp ile mesaj gönder, geri dön | ERP aynı sayfada kalır (beyaz sayfa yok) |
| 5.3 | Sarf Malzeme / Envanter kritik stoktan tedarikçiye mesaj | Mesajda ürün, kategori, kod ve 2 soru |

## 6) v39 yeni özellikler — İndirim, Toplu Alış, Excel, Kasa hızlı işlemler
**Hazırlık:** v39 yüklü (menünün altında "Sürüm v39"), `supabase-fixes-v12-migration.sql` ve `supabase-fixes-v11-migration.sql` çalıştırılmış, Ayarlar > Bağlantı Durumu'nda tüm modüller yeşil. Tüm kayıtlarda **TEST** adlarını kullanın (TEST MÜŞTERİ, TEST TEDARİKÇİ, TEST ÜRÜN A/B/C/D/E). Tutarlar küçük kalsın.

### 6A) Müşteri: indirimle kapat
| # | Adım | Beklenen |
|---|---|---|
| 6.1 | TEST MÜŞTERİ'ye 350 TL'lik TEST ÜRÜN A sat, ödeme **kısmi 0 TL** (tamamı borç) | Müşteri borcu 350 |
| 6.2 | Müşteriler > TEST MÜŞTERİ > Borç > **💰 İndirimle Kapat / Toplu Tahsilat**: Ödenen **300**, İndirim **50** (₺) | Önizleme "✅ Borç kapanır"; Kaydet sonrası borç **0**; Kasa'ya **yalnızca +300** "Borç Tahsilatı" (50 yazılmaz); satış detayında toplam **300**, iskonto **50** |
| 6.3 | 100 TL'lik yeni borçta Ödenen 90 + İndirim 20 gir | "⚠️ Borçtan fazla", **Kaydet kapalı** |
| 6.4 | 200 TL'lik borçta İndirim **10 %** seç, Ödenen 180 | İndirim ₺20 olarak görünür; borç kapanır |
| 6.5 | **Kasa > 💰 Müşteriden Tahsilat**: müşteriyi listeden seç, "Tamamını tahsil et" | Borç kapanır; kasaya gelir yazılır; listede müşterinin borcu görünür |

### 6B) Tedarikçi: indirimle kapat
| # | Adım | Beklenen |
|---|---|---|
| 6.6 | TEST TEDARİKÇİ'den 1000 TL **ödenmemiş** alış yap (TEST ÜRÜN B) | Tedarikçi borcu 1000 |
| 6.7 | Tedarikçiler > TEST TEDARİKÇİ > **Ödeme Yap**: Ödenen **950**, İndirim **50** | "Borç kapanır"; Kasa'ya **−950** gider (50 yazılmaz); Alışlar'da bu alış **Ödendi**, toplam **950**; detayda liste → net |
| 6.8 | **Kasa > 🏭 Tedarikçiye Ödeme** ile aynı akış | Tedarikçi listeden seçilir, borç görünür |
| 6.9 | Raporlar > Gerçek Kâr (tarih aralığı bugünü kapsasın) | "Tedarikçiden alınan indirim **+₺50**" ve "Müşteriye verilen tahsilat indirimi ₺50" satırları görünür |

### 6C) Toplu alış ve alışta iskonto
| # | Adım | Beklenen |
|---|---|---|
| 6.10 | Envanter > **📥 Toplu Alış**, TEST TEDARİKÇİ seç, **Çok ürün: listeyi yapıştır**: `TEST ÜRÜN C; 10; 100; 10` ve `TEST ÜRÜN D; 5; 40` | "2 satır eklendi (0 mevcut, 2 yeni)"; C net **90** (liste 100); toplam **1.100 TL** |
| 6.11 | Genel iskonto **10 %** gir, **Ödenmedi** seç, kaydet | Alış toplamı **990 TL**; borç 990; Envanter'de C stok 10 / D stok 5; detayda "İskonto kazancı **₺210**" |
| 6.12 | Tek satırlık alışta ürün iskontosu **₺ 20** (4 adet × 50) | Net 45/adet, satır toplamı 180 ("₺ iskonto satırın TOPLAMINDAN düşer" notu) |
| 6.13 | Envanter > Ürün Ekle'de tedarikçi seç | Yeşil "Toplu Alış'ı açın" kutusu çıkar; tıklayınca pencere tedarikçi dolu açılır |
| 6.14 | Listeye **hatalı satır** ekle (`Kablo; 0; 10`) | Hatalı satır uyarı verir, geçerli satırlar eklenir, hatalı satır kutuda kalır |

### 6D) Excel ile alış
| # | Adım | Beklenen |
|---|---|---|
| 6.15 | `Alis-Yukleme-Sablonu.xlsx`: TEST TEDARİKÇİ için 2 satır (biri mevcut TEST ÜRÜN C, biri yeni TEST ÜRÜN F) + 1 satır tedarikçi **"Yok Tedarik"** | Alışlar > **📥 Excel ile Alış**: hata mesajı satır numarasıyla gelir, **hiçbir kayıt yapılmaz** |
| 6.16 | Hatalı satırı silip tekrar yükle | TEST TEDARİKÇİ için **tek alış kaydı**, "Ödenmedi" (borç eklenir), C'nin stoğu artar, F yeni ürün; kasaya yazılmaz |

### 6E) Satışta iskonto
| # | Adım | Beklenen |
|---|---|---|
| 6.17 | Satış sepetine TEST ÜRÜN C ekle, "Ürün iskontosu" **10 %** | "~~liste~~ → net" görünür; ara toplam net tutarla |
| 6.18 | Genel iskonto **₺ 5** gir, sonra **%** seçip 5 yaz | % seçilince "%5 = ₺…" görünür; toplam doğru |
| 6.19 | İskontoyu ayarlardaki azami yüzdeden büyük yap | "Toplam iskonto … maksimumu aşıyor", kaydedilmez |
| 6.20 | Satışı tamamla, **Fiş** | Fişte liste fiyatı üstü çizili + net; "Liste Toplamı / Ürün İskontosu" satırları (genel iskonto varsa ayrıca "İskonto"); kasaya ödenen tutar |

### 6F) Adet düzeltme / alış silme (v33)
| # | Adım | Beklenen |
|---|---|---|
| 6.21 | TEST alışında **🔢 Adedi düzelt** 10 → 8 | Stok −2; alış toplamı ve borç düşer |
| 6.22 | (Yönetici) **🗑️ Alışı Sil** | Ürünler stoktan düşer, borç kalkar; satılmış ürün varsa **reddedilir** |

### 6G) Kapanış
| # | Adım | Beklenen |
|---|---|---|
| 6.23 | Kasa > 🔎 Mutabakat | TEST işlemlerinden yeni tutarsızlık yok |
| 6.24 | Ayarlar > Bağlantı Durumu > Test Et | Tüm modüller ✅ (İndirim Kayıtları dahil) |

### Test kayıtlarını silme
Testler bitince Supabase SQL Editor'de **`supabase-test-kayitlarini-sil.sql`**'i çalıştırın: önce olduğu gibi (deneme modu, hiçbir şey silinmez, "tablo / silinecek adet" listesi gelir), sayılar mantıklıysa son satırı `commit;` yapıp tekrar çalıştırın. Yalnızca **adı TEST ile başlayan** kayıtlar ve onlara bağlı satış/tamir/alış/borç/kasa kayıtları silinir. Silmeden önce Ayarlar > Yedekle ile yedek alın.

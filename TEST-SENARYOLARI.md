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

# SQL Çalıştırma Sırası (Supabase > SQL Editor)

Sıfırdan kurulum için dosyalar şu sırayla çalıştırılır. Her dosya tekrar çalıştırılabilir (idempotent) tasarlanmıştır.

## 1) Temel şema (yalnızca YENİ/boş bir veritabanı için)
1. `yesiltas-erp-TAM-SQL.sql` — DİKKAT: tüm tabloları siler ve yeniden oluşturur. Mevcut verisi olan veritabanında ÇALIŞTIRMAYIN.
2. Eski özellik migrasyonları (şema zaten bunlarla uyumluysa atlanabilir): `supabase-*-migration.sql` dosyaları (customers, sales, inventory, repairs, products, suppliers, ...).
3. `supabase-auth-migration.sql` — kullanıcı profilleri ve temel RLS (sonra kullanıcıları Supabase Auth'tan oluşturun).
4. `supabase-fine-permissions-migration.sql` — silme sadece Yönetici.
5. `supabase-repair-public-view-migration.sql`, `supabase-product-images-storage.sql`, `supabase-activity-log-migration.sql`.

## 2) Düzeltme paketleri (mevcut kurulumlarda sırayla)
| Sıra | Dosya | Zorunlu mu? | İçeriği |
|---|---|---|---|
| 1 | `supabase-fixes-v2-migration.sql` | Evet | satışta müşteri bağı, tedarikçi ödemeleri, atomik stok, satış kodu kilidi |
| 2 | `supabase-fixes-v3-migration.sql` | Evet | firma ayarları (cihazlar arası ortak) |
| 3 | `supabase-fixes-v4-migration.sql` | Evet | stok hareket geçmişi, tamirde parça/teknisyen |
| 4 | `supabase-fixes-v5-migration.sql` | Evet | çoklu ödeme, taksit, iade, takas, doğum günü, cihaz alımı, imza |
| 5 | `supabase-fixes-v5-security.sql` | Önerilir | personel/ayarlar yazma yetkisi, kasa düzenleme yetkisi |
| 6 | `supabase-fixes-v6-migration.sql` | **Evet** | rol yükseltme koruması, katı stok kontrolü, QR sayfasında kişisel veri azaltma, denetim kaydı/depolama yetkileri |
| 7 | `supabase-fixes-v6-security.sql` | İsteğe bağlı | pasif kullanıcıları veritabanı seviyesinde engelle (geri alma bölümü var) |
| 8 | `supabase-fixes-v7-migration.sql` | **Evet** | ek maliyet (gerçek kâr), kasa sayımı, ödeme takvimi tabloları |
| 9 | `supabase-fixes-v8-migration.sql` | **Evet** | servis iş akışı: aşama, tahmini teslim, kalite kontrol, teklif |
| 10 | `supabase-fixes-v9-migration.sql` | **Evet** | Alışlar sayfası (tedarikçiden ve müşteriden alış kayıtları) |
| 11 | `supabase-fixes-v10-migration.sql` | **Evet** | taksit planı sütunu düzeltmesi (taksitli satış için) |
| 12 | `supabase-fixes-v11-migration.sql` | **Evet** | demirbaşlara tedarikçi bilgisi (tekrar sipariş / fiyat isteme için) |
| 13 | `supabase-fixes-v12-migration.sql` | **Evet** | indirimli borç kapatma kaydı (settlement_discounts tablosu) |

## Kontrol
Çalıştırdıktan sonra Supabase > Database > Policies (veya `select * from pg_policies`) ile politikaları kontrol edin.

## Son kontrol
Tüm SQL'ler çalıştırıldıktan sonra `supabase-saglik-kontrolu.sql` dosyasını çalıştırın (sadece okur); "❌ EKSİK" satırı varsa ilgili dosyayı çalıştırın. Ardından `TEST-SENARYOLARI.md` ile uygulamayı bir kez uçtan uca deneyin.

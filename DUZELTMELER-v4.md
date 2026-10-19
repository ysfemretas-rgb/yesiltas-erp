# Paket v4 — v2 paketinin üzerine kopyalanır (v3 içeriğini de kapsar)

Bu zip, `yesiltas-erp-duzeltilmis.zip` (v2) paketinin üstüne kopyalanır. Ayrı v3 zip'ine gerek yoktur; v3'teki her şey bunun içindedir.

## 1) Önce Supabase'de SQL'leri sırayla çalıştırın (SQL Editor, her biri bir kez)
1. `supabase-fixes-v2-migration.sql` (v2 paketinde)
2. `supabase-fixes-v3-migration.sql`
3. `supabase-fixes-v4-migration.sql`

## 2) Kodu yükleyin
`package.json` değişti (karekod için `qrcode` paketi eklendi). Vercel/GitHub kullanıyorsanız yükleme sonrası kendiliğinden kurulur. Bilgisayarda çalıştırıyorsanız `npm install` yapın.

## Barkod ve karekod
- **Etiket butonu:** Müşteri kartı, Satış kartı ve Tamir QR penceresinde. Etiket: kod (YTM/YTS/YTT) + barkod + karekod. Ürün etiketi eskisi gibi Envanter'de.
- **Üst çubukta 🔍 (Ara / Kod Okut):** İsim, telefon, kod (YTM-0001), IMEI yazın ya da kamerayla okutun; kayıt doğrudan açılır. Yazarak aramada müşteri, satış, tamir ve ürünler birlikte listelenir.
- **Barkod okuyucu (USB/Bluetooth):** Sayfada bir kutuya tıklamadan okutursanız kayıt otomatik açılır. YTM/YTS/YTT/YTE kodları ve 15 haneli IMEI desteklenir. Karekodu da okuyan (2D) bir model alırsanız tek cihaz ikisini de okur.
- **Karekod:** Telefon kamerasıyla okutunca giriş yapılmışsa doğrudan kaydı açar, giriş yoksa önce giriş sayfası gelir ve sonra aynı kayda döner. Tamir karekodu eskisi gibi müşterinin görebileceği durum sayfasını açar. Karekodlar artık dış siteye bağlı değil, uygulama içinde üretilir.

## Tamir
- **Düzenle ekranında:** Teknisyen seçimi ve "Kullanılan Parçalar" (stoktan seçilir, stoktan otomatik düşer, maliyet ve tahmini kâr görünür). Parçayı çıkarırsanız stok geri eklenir; tamir silinirse parçalar stoğa döner.
- **WhatsApp butonu** artık tamirin durumuna göre mesaj hazırlar (bekliyor / devam ediyor / tamamlandı). Eskiden hep "tamamlandı" yazıyordu.

## Envanter
- **Sayım:** Kodları okutarak sayım yapın, farklar tek tuşla stoğa işlenir.
- **Sipariş Listesi:** Kritik stoktakileri tedarikçiye göre gruplar; WhatsApp ile gönderir veya kopyalar.
- **Kura Göre Fiyat:** Dövizle alınan ürünlerin satış fiyatını güncel kura göre yeniler.
- **Hareket:** Her ürünün stok geçmişi (kim, ne zaman, neden). Kayıt bu sürümden sonra başlar.
- **Excel'e Aktar.**

## Diğer
- Sayfalama: Satış, Müşteri, Envanter, Finans ve Tamir listelerinde (binlerce kayıtta yavaşlamaz).
- Excel dışa aktarma: Satış, Müşteri, Envanter, Finans ve Tamir sayfalarında.
- Müşteriler > **Borç Raporu:** borçluları en eski borca göre yaşlandırarak Excel'e aktarır.
- Satışlar > **Etiket**, **Garanti**, **Fiş**, **İptal**; satış kartı karekodla açılınca detay penceresi gelir.
- Finans > **Gün Sonu**; Ayarlar'daki IBAN/iskonto limiti cihazlar arası ortak.
- Bugün sayfası ve bildirimlerde borç hesabı düzeldi; garanti sayaçları, randevu düzenleme hatası ve mobil kur saati düzeldi.

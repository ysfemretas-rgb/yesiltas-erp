# Güncel paket — v2 paketinin üzerine kopyalanır (önceki tüm ara paketleri kapsar)

## 1) Supabase SQL Editor'de sırayla çalıştırın (her biri bir kez)
1. `supabase-fixes-v2-migration.sql` (v2 paketinde)
2. `supabase-fixes-v3-migration.sql`
3. `supabase-fixes-v4-migration.sql`
4. `supabase-fixes-v5-migration.sql`
5. `supabase-fixes-v5-security.sql` — önerilir. Bir güvenlik açığını kapatır: her kullanıcı kendi rolünü "Yönetici" yapabiliyordu. Personel tablosu ve firma ayarlarını sadece Yönetici'ye açar; kasa kayıtlarını düzenlemeyi Yönetici/Muhasebe/Kasiyer'e bırakır. Sorun olursa dosyanın altındaki "GERİ ALMA" bölümünü çalıştırın.

## 2) Kodu yükleyin
`package.json` değişti (karekod paketi). Vercel kendiliğinden kurar; bilgisayarda çalıştırıyorsanız `npm install`.

## Yeni satış özellikleri (Satışlar > Yeni Satış)
- **Çoklu ödeme:** ödeme şeklinden "🔀 Çoklu Ödeme" seçin; nakit/kart/havale tutarlarını girin. Eksik kalan borç olur.
- **Taksitli satış:** "📅 Taksitli" seçin; peşinat, taksit sayısı ve ilk vade tarihini girin, plan önizlenir (aylık eşit, faizsiz). Taksit ödemesi almak için Müşteriler > Borç > Tahsil Et; ödeme en eski taksitten başlayarak dağıtılır. Vadesi 3 gün içinde ya da geçmiş taksitler "Bugün" sayfasında WhatsApp hatırlatması olarak çıkar.
- **Takas:** "🔄 Takas" bölümüne cihaz adı ve değer girin; değer ödemeden düşer, cihaz "İkinci El" olarak stoğa girer. Kasaya sadece fiilen alınan para yazılır.
- **IMEI:** sepetteki her ürüne IMEI/seri no yazılabilir; detay ve fişte görünür.
- **Kısmi iade:** satış kartı (🔍 ile veya karekodla açılan detay penceresi) > "Kısmi Ürün İadesi". Nakit iade veya bakiyeye mahsup seçilir; stok geri eklenir, kasa ve borç düzelir.
- Taksitli, takaslı veya iade yapılmış satışlar düzenlenemez (iptal edip yeniden oluşturun). Çünkü ödeme geçmişi bozulmasın.

## Müşteri
- **Doğum tarihi** alanı; doğum günü olan müşteriler "Bugün" sayfasında WhatsApp mesajı olarak listelenir.
- **Birleştir** (sadece Yönetici): mükerrer müşterinin tüm satış, tamir, borç ve diğer kayıtlarını seçtiğiniz müşteriye taşır, eski kaydı siler.

## Tamir
- **Müşteri imzası** (parmakla). İmza küçük bir resim olarak doğrudan tamir kaydına yazılır; hiçbir dosya yüklenmez. Teslim belgesinde "Teslim Eden (Müşteri)" alanında basılır. (Fotoğraf yükleme eklenmedi.)

## Envanter
- **Cihaz Alımı:** müşteriden ikinci el cihaz alırken satıcı bilgisi, IMEI, durum ve tutar girilir; alım belgesi yazdırılır, ödeme kasaya gider yazılır, cihaz istenirse stoğa eklenir. T.C. kimlik no sadece belgeye basılır, veritabanına kaydedilmez.

## Bildirimler
- Her bildirimin yanında ✕ ile tek tek, üstte "Hepsini sil" ile toplu silme. Silinen bildirim, sorun çözülene kadar geri gelmez; sorun çözülüp tekrar oluşursa yeniden bildirilir. Bu cihazda saklanır.

## Yedekleme (Ayarlar > Yedekleme)
- Yeni indirilen yedekler **geri yüklenebilir** ("Yedekten Geri Yükle", sadece Yönetici). Kayıtlar ID'ye göre eklenir/güncellenir, silme yapılmaz. Eski sürümden indirilmiş yedekler geri yüklenemez; önce yeni bir yedek indirin.

## Çevrimdışı
- İnternet yokken uygulama anlaşılır bir "bağlantı yok" sayfası gösterir ve dosyalar daha hızlı açılır. Veri girişi/okuma için internet gerekir. (Sadece https adresinde çalışır.)

## Resmi belge tasarımı ve logo
- Satış belgesi, cihaz teslim belgesi, ikinci el alım belgesi ve gün sonu raporu aynı resmi antetli tasarımı kullanır: logo + firma adı/adres/telefon/e-posta/vergi no, başlık şeridi, tablolar, toplam kutusu, imza alanları ve alt bilgi. Satış belgesi "bilgilendirme amaçlıdır, fatura/yazar kasa fişi yerine geçmez" notunu taşır.
- Barkod etiketleri (ürün, müşteri, satış, tamir) üstte logo ve firma adı şeridi, ortada ürün/kayıt adı, barkod, kod yazısı ve (kayıt etiketlerinde) karekod içerir.
- Logo, projenizdeki `public/logo-512x512.png` dosyasıdır (ilk zipte var, yeniden yüklemenize gerek yok).
- **Önemli:** Belgelerdeki firma bilgileri Ayarlar > Firma Bilgileri'nden gelir. Orada hâlâ örnek değerler (İstanbul/Kadıköy adresi, örnek IBAN ve vergi no) duruyorsa belgelerde gizlenir; gerçek adres, telefon, vergi no ve IBAN'ınızı girip Kaydet'e basın.

## Telefon (mobil) düzeltmeleri ve son eklemeler
- **Sarf Malzemeler:** ürün satırındaki düzenleme butonları telefonda alt alta/sarılarak sığar; "Canlı Döviz Kurları" kutusu sayfadan kaldırıldı.
- **Sarf Malzemeler > Fiyat İste:** stok azalan malzeme için tedarikçiye WhatsApp ile fiyat/teklif isteme (satırdaki "Fiyat İste" butonu, kritik stok uyarısındaki WhatsApp simgesi ve üstteki toplu "Fiyat İste" penceresi). Tedarikçi telefonu Tedarikçiler sayfasında kayıtlıysa mesaj ona açılır; değilse WhatsApp'ta kişiyi siz seçersiniz.
- **Finans:** başlık ve butonlar (Gün Sonu, Excel, Yeni İşlem) telefonda sığmayınca alt satıra geçer.
- Satışlar, Teknik Servis başlık butonları ve Envanter ürün satırı da telefonda sığacak şekilde düzenlendi (bilgisayarda görünüm aynı).
- **Müşteri seçimi (Satış, Garanti, Randevu, Teknik Servis):** kutuya yazarak arama (ad, telefon, müşteri kodu) YA DA kutuya dokununca / yandaki oka basınca tüm müşteri listesi açılır, oradan doğrudan seçilir. Teknik Servis'te listenin başında "Yeni Müşteri Ekle" vardır. Garantide seçilen müşterinin adı ve telefonu otomatik dolar.

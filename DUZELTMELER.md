# Güncel paket — v2 paketinin üzerine kopyalanır (önceki tüm ara paketleri kapsar)

## 1) Supabase SQL Editor'de sırayla çalıştırın (her biri bir kez)
1. `supabase-fixes-v2-migration.sql` (v2 paketinde)
2. `supabase-fixes-v3-migration.sql`
3. `supabase-fixes-v4-migration.sql`
4. `supabase-fixes-v5-migration.sql`
5. `supabase-fixes-v5-security.sql` — önerilir (eski not; v6 ile birlikte aşağıya bakın). Bir güvenlik açığını kapatır: her kullanıcı kendi rolünü "Yönetici" yapabiliyordu. Personel tablosu ve firma ayarlarını sadece Yönetici'ye açar; kasa kayıtlarını düzenlemeyi Yönetici/Muhasebe/Kasiyer'e bırakır. Sorun olursa dosyanın altındaki "GERİ ALMA" bölümünü çalıştırın.

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

## v6 — Dış denetim sonrası düzeltmeler (iki bağımsız rapor kodla karşılaştırılıp doğrulananlar)
**SQL:** Çalıştırma sırasına `supabase-fixes-v6-migration.sql` (ZORUNLU) ve isteğe bağlı `supabase-fixes-v6-security.sql` eklendi. Tüm sıra için `MIGRATION-SIRASI.md`.
- **Rol yükseltme koruması artık zorunlu pakette:** kullanıcılar kendi rolünü "Yönetici" yapamaz.
- **QR durum sayfası:** müşteri adı "Ahmet Y." biçiminde, telefon son 2 hane, IMEI son 4 hane gösterilir; iç notlar, müşteri kodu, indirim ve ödeme türü gizlenir.
- **Denetim kaydı, stok hareketi, tedarikçi ödemesi, cihaz alım belgesi:** personel ekleyip okuyabilir; değiştirme/silme sadece Yönetici.
- **Ürün resimleri deposu:** yalnızca resim dosyası, en fazla 5 MB; güncelleme/silme sadece Yönetici.
- **Cihaz alım belgesi:** T.C. kimlik no kolonu veritabanından kaldırıldı; belge numarası benzersiz; ürün bağlantısı doğrulanır.
- **Pasif kullanıcı:** uygulama açılırken hemen kontrol edilir (isteğe bağlı SQL ile veritabanı seviyesinde de engellenir).

**Kod:**
- **Satış önce stoğu veritabanında KATI kontrolle ayırır:** yetersizse satış reddedilir; kayıt oluşmazsa stok geri verilir. İki kişi aynı son ürünü satamaz.
- **Yarım kalan adımlar artık sessiz değil:** satış/iptal/iade/düzenleme/silme sırasında borç, takas stoğu, kasa veya stok adımı başarısız olursa hangisinin tamamlanamadığı ekranda yazılır.
- **Kasa geçmişi korunur:** satış iptalinde kasa kayıtları silinmez, ters kayıt yazılır. Satış düzenlemede de eski kayıtlar silinmez, fark "düzeltme" kaydı olarak yazılır (silme yetkisi olmayan personelde gelirin ikiye katlanması engellendi).
- **Stok fonksiyonu** artık yalnızca "fonksiyon yok" durumunda eski yönteme düşer; diğer hatalar yukarı iletilir.
- **Döviz kuru alınamazsa** üst çubukta "--" görünür ve dövizli ürün kaydı/fiyat güncellemesi engellenir (eski sabit kur kullanılmaz).
- **Bildirimler:** veriler tek turda çekilir; silinen bildirimlerin işareti ancak tüm veriler alınabildiyse temizlenir.
- **Sayfalama:** kayıtlar aynı tarihli olsa bile atlanmaz/tekrarlanmaz; 200.000 sınırında sessizce kesmek yerine hata verir.
- **Eski veri aktarımı:** başarısız olursa işaret yazılmaz, bir sonraki açılışta tekrar denenir.
- Para hesapları (`lib/money.ts`) için otomatik testler eklendi: `npm test` (Node 22.6+). 10 test geçti.
- Mobilde üst çubuktaki dokunma alanları büyütüldü (bilgisayarda aynı).
- `.env.example` eklendi.

**Yapılmayanlar (bilerek):** satış/iptal/iade akışının tek bir veritabanı işlemine (RPC) taşınması; satış, borç ve stok tablolarında izin bazlı ince yazma politikaları; `package-lock.json` (kurulum yapılan makinede `npm install` sonrası oluşur, GitHub'a ekleyin). Gerekçe ve öneri raporda.

## v7 — Paket A (güven) + Paket B (para, ortaklar cari hariç)
**SQL:** `supabase-fixes-v7-migration.sql` çalıştırın (v6'dan sonra).

**Paket A — güven**
- **Finans > 🔎 Mutabakat:** satış, tamir, ikinci el alım, stok ve taksit kayıtlarını kasa ile karşılaştırıp uyuşmayanları listeler (kasada karşılığı olmayan satış, iptal edilmiş ama kasası sıfırlanmamış satış, tamirde çift gelir, alım belgesinin gideri yok, stok alınan adetten fazla, aynı IMEI iki kez stokta, taksit planı ile kalan borç uyuşmuyor). "Düzelt" eski kayıtları silmez; fark kadar düzeltme kaydı ekler. Excel'e aktarılabilir. Eski sürümlerden kalan kayıtlarda fark çıkması normaldir.
- **IMEI:** Envanter ürün formlarında IMEI alanı. Aynı IMEI ikinci kez stoğa girilemez (ürün ekleme/düzenleme, ikinci el alım ve takas). 15 haneli IMEI'yi 🔍 aramasına yazın/okutun: cihazın alışı, stok kaydı, tamirleri, satışı ve "bu cihazdan kâr" tek ekranda görünür.
- **Değişiklik kaydı (eski → yeni):** satış düzenleme/iptal/iade, ürün fiyat/stok/tedarikçi değişikliği, kasa kaydı düzenleme/silme artık "kim, neyi, neden, eski → yeni" olarak aktivite kaydına yazılır. Satış iptalinde isteğe bağlı iptal nedeni sorulur.
- **Müşteri risk uyarısı:** satışta müşteri seçilince açık borcu ve en eski borcun yaşı gösterilir; vadesi 30 günü geçmiş borcu olana yeni borç eklenecekse onay istenir.
- **Minimum kâr / maliyet altı satış:** Ayarlar'da "Minimum Kâr Oranı (%)". Satış bu oranın ya da maliyetin altındaysa sadece Yönetici onaylayabilir; onaylanan satış kayda geçer.

**Paket B — para**
- **Gerçek kâr:** satışta "ek maliyet" (kargo vb.) ve Ayarlar'da "Kredi Kartı Komisyonu (%)" (kartla alınan tutardan otomatik). Satış detayında maliyet, ek maliyet ve gerçek kâr; Raporlar'da "💎 Gerçek Kâr" kartı (satış kârı + tamir kârı, parça maliyeti dahil). Ek maliyetler sadece kâr hesabındadır, kasaya yazılmaz.
- **Finans > 💵 Kasa Sayımı:** açılış ve kapanış sayımı. Beklenen nakit = açılış + günün net kasa hareketi - kart/havale ile alınanlar (bugünkü satışlardan otomatik, elle düzeltilebilir). Fark varsa açıklama zorunlu; sayım tutanağı yazdırılabilir.
- **Finans > 📅 Ödeme Takvimi:** kira, fatura, vergi, tedarikçi vb. ödemeler (aylık tekrar seçeneğiyle). "Ödendi" tutarı kasaya gider yazar ve bir sonraki ayı açar. Beklenen taksit tahsilatları aynı ekranda; 30 günlük çıkış/giriş özeti. Gecikmiş veya 3 gün içinde vadesi gelen ödemeler bildirimlere düşer.
- Otomatik testler 21'e çıktı (`npm test`).

**Bu pakette yapılmadı:** Ortaklar arası cari hesap (isteğiniz üzerine).

## v8 — Paket C: Servis iş akışı
**SQL:** `supabase-fixes-v8-migration.sql` çalıştırın (v7'den sonra).
- **📋 Pano (Teknik Servis üst butonu):** tamirler aşamalara göre sütunlarda: Teslim Alındı → Teşhis Edildi → Müşteri Onayı Bekliyor → Parça Bekliyor → Tamirde → Kalite Kontrolde → Teslime Hazır → Teslim Edildi. Karta dokununca kayıt açılır, "→" ile sonraki aşamaya geçilir. Telefonda yatay kaydırılır. Geciken teslimler kırmızı görünür. Teslim edilenlerden son 14 gün gösterilir.
- **Aşama ve eski durum birlikte çalışır:** her aşama eski üç durumdan (Bekliyor / Devam Ediyor / Tamamlandı) birine karşılık gelir; rapor, bildirim ve WhatsApp mesajları aynen çalışır. Eski kayıtlar durumundan türetilen aşamayla görünür. Aşama değişiklikleri aktivite kaydına yazılır.
- **Tahmini teslim tarihi:** Yeni Tamir ve Düzenle ekranında tarih alanı; tamir kartında ve panoda görünür; tarihi geçen veya bugün/yarın olan teslimler bildirim olarak çıkar; Excel'e de yazılır.
- **Kalite kontrol listesi (Düzenle ekranı):** ekran/dokunmatik, kameralar, hoparlör-mikrofon, şarj, bağlantılar, tuşlar, yüz/parmak izi, pil, temizlik. İşaretler anında kaydedilir (kim, ne zaman). Liste tamamlanmadan "Teslime Hazır/Teslim Edildi" aşamasına geçilirse uyarı çıkar (engellemez).
- **Müşteri onaylı teklif (Düzenle ekranı):** tutar ve teşhis notu girilir → "Teklifi Kaydet" → WhatsApp ile gönder veya resmi "Tamir Teklif Formu" yazdır (kabul/ret kutuları ve imza alanı). Müşteri yanıtına göre "Müşteri Onayladı / Reddetti" kaydedilir (kim, ne zaman). Onayda ücret teklif tutarından farklıysa güncellensin mi diye sorulur ve tamir aşamasına geçilir.
- Otomatik testler 26'ya çıktı (`npm test`).

## v9 — Teknik servis notları (sayfa sayfa düzeltmeler, 1. tur)
- **Sayaç kutuları tıklanabilir:** Toplam Tamir, Bekleyen, Devam Eden, Biten, Toplam Gelir, Bekleyen Tahsilat (ve varsa Fazla Ödeme) kutularına basınca o kutudaki tamirlerin listesi açılır; bir satıra basınca tamir kaydı açılır.
- **Yeni "Biten" kutusu:** biten tamir sayısı ve listesi.
- **Aramada barkod:** Tamir arama kutusunun sağında 📷 barkod/karekod okut butonu; kutuya tamir kodu (YTT-), müşteri kodu, IMEI de yazılabilir (arama artık bunları da bulur). Barkod okuyucuyla okutunca (Enter) doğrudan kayıt açılır: tamir kodu/IMEI/karekod -> tamir kaydı; müşteri kodu (YTM-) -> o müşterinin tamirleri listelenir; satış (YTS-) veya ürün (YTE-) kodu -> ilgili sayfada açılır.
- **WhatsApp:** Tüm sayfalarda WhatsApp artık telefonda doğrudan uygulamaya geçer (eskiden uygulama içi tarayıcıda açılıp dönüşte bembeyaz sayfada kalıyordu). iPhone'da hiçbir web sayfası açılmaz (yedek web bağlantısı kaldırıldı, çünkü iPhone'un onay penceresi açıkken devreye girip aynı beyaz sayfayı açıyordu). İlk açılışta iPhone "WhatsApp'ta aç?" diye sorabilir, "Aç" deyin.
- **Kaldığınız yerden devam:** Telefonda uygulama kapanıp yeniden açılırsa (WhatsApp'a gidip dönünce iOS sayfayı yenileyebilir) en başa değil, en son bulunduğunuz sayfaya dönülür (6 saat içinde ve oturumun ilk açılışında).

## v10 — Tüm sayfalarda tıklanabilir sayaç kutuları
Üstteki sayı kutularına basınca, o sayının hangi kayıtlardan oluştuğunu gösteren liste penceresi açılır (10'dan fazla kayıtta pencerede arama kutusu çıkar; satıra basınca ilgili kayıt açılır):
- **Satışlar:** Toplam Satış, Bugün, Toplam Gelir, Bekleyen Tahsilat
- **Müşteriler:** Toplam, Aktif, Borçlu (en çok borçludan), Toplam Borç, Fazla Ödeme
- **Envanter:** Toplam Ürün, Kritik Stok, Toplam Maliyet / Satış Değeri / Tahmini Kâr (ürün bazında döküm)
- **Tedarikçiler:** Toplam, Aktif, Toplam Sipariş, Borcumuz, Alacağımız, Kategori
- **Finans:** Toplam Gelir, Toplam Gider, Net Bakiye (kasa kayıtları listesi)
- **Garantiler:** Toplam, Aktif, Bitmek Üzere, Süresi Dolmuş
- **Randevular:** Bekleyen, Bugün, Geçmiş, Toplam
- **Görevler:** Bekliyor, Devam Ediyor, Tamamlandı
- **Personel:** Toplam, Aktif, İzinde, Pasif, Aylık Maaş Gideri
- **Sarf Malzemeler:** Toplam, Kritik Stok, Toplam Değer, Kategori Sayısı
- **Demirbaşlar:** Toplam Kalem, Toplam Değer
- **Raporlar:** Toplam Gelir, Toplam Gider, Net Kâr, Toplam İşlem (seçili dönem)
- Teknik Servis kutuları önceden yapılmıştı; Ana Sayfa kutuları zaten ilgili sayfayı açar.

## v11 — Envanter: ürün türü / marka / model seçici ve net tedarikçi mesajı
- **⚡ Hızlı Ürün Seçimi (Yeni Stok Ürünü ekranı):** Önce **tür** seçilir (Telefon Sıfır/İkinci El, Kılıf, Ekran Koruyucu, Şarj Aleti, Kulaklık, Yedek Parça – Ekran/Batarya/Kamera/Şarj Soketi/…, Tamir Aleti vb.), modele özel türlerde **marka** ve **model** seçilir. Marka listesi: Apple, Samsung, Xiaomi, POCO, Huawei, Honor, Oppo, Realme, Vivo, OnePlus, Google, Motorola, Nokia, Tecno, Infinix, Casper, General Mobile, Reeder (yüzlerce model). Listede olmayan marka/model yazılarak eklenir ("... olarak kullan"). İsteğe bağlı **varyant** (renk, depolama, kalite) yazılır.
- Ürün adı ve kategori kendiliğinden oluşur: ör. "Apple iPhone 11 128GB Siyah", "Kılıf — Apple iPhone 11 Silikon Şeffaf", "Ekran (Yedek Parça) — Samsung Galaxy A54". Adı sonradan elle düzeltebilirsiniz.
- **Kategoriler gruplu:** Cihazlar / Telefon Aksesuarları / Genel Aksesuarlar / Yedek Parça / Diğer başlıkları altında hazır gelir (Yeni ve Düzenle ekranlarında). Eski kategorileriniz ("Ekran" gibi) "Mevcut diğer kategoriler" altında kalır.
- **Tedarikçiye giden mesaj artık ürünü net anlatıyor:** ürün adı, tür/kategori, ürün kodumuz, sizdeki kod/barkod, mevcut stok, istenen miktar. Sipariş listesi ve kritik stok uyarısı da kategori ve kodu gösterir. Sarf malzeme fiyat isteme mesajına da kategori eklendi.
- **Tedarikçi mesajlarının sonu artık 2 net soru soruyor:** 1) Bu ürün elinizde var mı? 2) Birim fiyatı nedir? (Envanter tekil mesaj, sipariş listesi ve sarf malzeme fiyat isteme mesajlarında; teslim süresi ve KDV sorulmaz.)

## v12 — "Stok var ama satış yapılamıyor" düzeltmesi
- Satış, ekrandaki (eski kalabilen) stok sayısına göre reddedilmez; stok yeterliliği **veritabanında** kontrol edilir. Yetersizse mesaj gerçek stoğu gösterir ("sistemdeki güncel stok: N").
- **Çift dokunma koruması:** "Satışı Tamamla" basılınca buton "Kaydediliyor..." olur ve ikinci basış yok sayılır. (Yavaş bağlantıda ikinci basış, birinci işlemin düştüğü stoğu görüp "stok yok" hatası veriyordu.)
- Satış penceresi açılırken stok yeniden çekilir.
- Satış kaydedilemezse gerçek hata nedeni toast'ta görünür.
- **Eksik SQL sütunları artık satışı/tamiri engellemez:** yeni sürümlerle eklenen sütunlar (ek maliyet, taksit, takas, aşama, IMEI vb.) veritabanında henüz yoksa kayıt, bu sütunlar olmadan yapılır (o özelliğin verisi kaydedilmez). SQL dosyalarını çalıştırınca tam özellikler açılır.
- **Son ürün (stok 1) artık satılabilir, stok 0'a düşer ("tükendi" olur):** Satışta stok düşme yöntemi değiştirildi; veritabanındaki özel SQL fonksiyonuna bağlı değil. Güncel stok okunur, yeterliyse "stok hâlâ aynıysa" koşuluyla düşürülür (aynı anda iki satış yapılırsa ikincisi reddedilir). Hata olursa gerçek hata metni ekranda görünür.

## v13 — 📥 Alışlar sayfası (alış ve satış tek sistemde)
**SQL:** `supabase-fixes-v9-migration.sql` çalıştırın. Menüde yeni **Alışlar** sayfası (Envanter yetkisiyle açılır).
- **Tedarikçiden Alış:** tedarikçi seç (yoksa ➕ Yeni Tedarikçi), fatura no, tarih. Satır ekle: *mevcut ürüne stok ekle* (listeden ara) ya da *yeni ürün* (tür → marka → model → varyant, adı otomatik). Adet, birim alış fiyatı (TL/USD/EUR; kur otomatik), kâr % ve satış fiyatı (boşsa maliyet+kâr), min. stok, IMEI. Çok kalemli alış yapılabilir.
- **Müşteriden Alış (ikinci el):** satıcıyı kayıtlı müşteriden seç ya da elle yaz; cihaz (tür/marka/model), IMEI, durum notu, ödenen bedel. Kaydedince resmi **alım belgesi** yazdırılır. T.C. kimlik no belgeye basılır, kaydedilmez.
- **Otomatik entegrasyon:** kaydedilen her ürün **envantere eklenir** (stok artar / yeni ürün kodu atanır) ve **Satışlar'da hemen satılabilir**. Ödenen tutar kasaya **gider** olarak yazılır. Ödemesi eksik kalan kısım **Tedarikçiler sayfasında borç** görünür. Aynı IMEI iki kez stoğa girilemez.
- **Ödeme durumu:** Ödendi / Kısmi / Ödenmedi (borç). Alış detayından "Ödeme Yap" kalan borcu kapatır ve kasaya gider yazar; Tedarikçiler sayfasındaki "Ödeme Yap" tutarı en eski borçlu alıştan başlayarak dağıtır.
- **Güvenli kayıt:** envanter adımı başarısız olursa yapılanlar geri alınır, hiçbir kayıt yarım kalmaz (eskiden cihaz stoğa eklenemese de kasaya gider yazılıp belge çıkabiliyordu — "1000 TL'ye cihaz almış görünüyor ama satışta yok" sorununun sebebi buydu).
- Alış geçmişi: arama (alış no, taraf, ürün, IMEI), tür/ödeme durumu filtresi, sayaç kutuları, alış fişi yazdırma, Excel.
- Mutabakat Merkezi artık ödenmiş ama kasada gideri olmayan alışları da gösterir.
- Envanter sayfasındaki "Cihaz Alımı" butonu yerine **Alış Yap** (Alışlar sayfasını açar).

## v14 — Envanterde stok azaltınca tedarikçi borcu da düşer
- Envanterdeki **+ / −** düğmeleri ve **Düzenle** ekranında stok değiştirme artık "alış düzeltmesi" sayılır: stok artarsa tedarikçi borcu artar, **stok azaltılırsa aynı adet kadar borç da düşer** (yanlış girilen alış geri alınır). Borçlu ürünlerde "borcundan düşüldü" bilgisi çıkar.
- Satışlar stoğu otomatik düşürür ve tedarikçi borcunu **etkilemez** (mal zaten alınmıştı). Fire/kayıp için stok azaltırsanız da borç düşer; bunu istemiyorsanız stok sayımı yerine Satış/İptal akışını kullanın.

## v14 — Envanter ➕/➖ artık alış/iade akışına bağlı
- **➕ (Stok Girişi):** düğmeye basınca pencere açılır. "🛒 Tedarikçiden satın alındı" seçilirse tedarikçi, birim alış fiyatı, para birimi ve ödeme durumu (Ödendi/Kısmi/Ödenmedi) sorulur; **Alışlar'a kaydedilir**, ödenmeyen kısım tedarikçi borcu olur, ödenen kasaya gider yazılır. "🔧 Sadece sayım düzeltmesi" seçilirse yalnızca stok artar (alış/borç oluşmaz).
- **➖ (Stok Çıkışı):** "↩️ Hatalı alış girişini düzelt / tedarikçiye iade" seçilirse ilgili alış kaydı küçülür, **tedarikçi borcu da düşer**; alış zaten ödenmişse fark kasaya "Tedarikçi İadesi" geliri olarak yazılır. "📉 Satış dışı çıkış (kayıp, hasar, sayım farkı)" seçilirse stok azalır, borç aynı kalır. (Satış yapınca stok zaten otomatik düşer; bu ekran satış için değildir.)
- **Yeni Stok Ürünü ekleme:** tedarikçi seçilip adet girildiyse alış otomatik **Alışlar'a işlenir**; ödeme durumuna göre kasaya gider yazılır ve borç oradan izlenir.
- Tedarikçiler sayfasındaki borç, Alışlar kayıtlarıyla izlenen adetleri eski ürün-bazlı hesapta tekrar saymaz (çift borç yok).
- Düzenle ekranındaki "Miktar" değişikliği alış kaydı oluşturmaz (sayım düzeltmesidir); satın alma için ➕ veya Alışlar kullanılır.

## v15 — Test sırasında bulunanlar
- **Min. stok 0 = uyarı yok:** Min. stok 0 girilen ürün (ör. ikinci el cihaz) stoğu 0'a düşünce artık "Kritik Stok" sayılmaz, bildirim üretmez, sipariş listesine girmez. (Min. stok 1 ve üzeri eskisi gibi çalışır.)
- **Finans'ta yeni kayıt en üstte:** Aynı gün yapılan kayıtlar artık oluşturulma saatine göre sıralanır (en yeni en üstte). Eskiden aynı tarihli kayıtların sırası karışıyordu.
- **Toplam Gelir / Toplam Gider şişmesi giderildi:** Satış iptali ve iadesi, eşantiyon iptali, tedarikçi iadesi gibi ters kayıtlar artık brüt gelir/gideri şişirmez; ilgili tarafa mahsup edilir (Finans, Raporlar ve Gün Sonu raporu). Kasadaki NET tutar değişmez, kayıtlar listede aynen durur.
- **Bildirim (toast) pencerelerin üstünde:** Hata/başarı mesajları artık açık pencerelerin (ör. Yeni Satış) arkasında kalmıyor; hata mesajları 12 saniye kalıyor ve dokununca kapanıyor (eskiden 3 saniyeydi ve pencerenin arkasında okunamıyordu).
- **Satış kartında "Detay / İade" butonu:** Kısmi ürün iadesi, taksit planı, ödeme dağılımı ve gerçek kâr satış detay penceresindeydi ama listeden açılmıyordu (sadece kutular/arama/karekodla açılıyordu). Artık her satış kartında "Detay / İade" butonu var.
- **Taksitli satış düzeltmesi (SQL: `supabase-fixes-v10-migration.sql`):** Eski tabloda "installments" adlı tam sayı sütunu vardı, taksit planı oraya yazılamıyor ve satış kaydedilemiyordu. Plan artık ayrı bir sütunda (`installment_plan`) tutulur. Sağlık kontrolü artık sütun tiplerini de denetler.
- **"Sil" butonu satış kartından kaldırıldı:** Yanlışlıkla basılıp kasa kayıtlarını silmesin diye "Kalıcı Sil" sadece yöneticiye ve satış detay penceresinde duruyor. Günlük kullanımda "İptal" kullanılır (kayıt ve ters kayıt korunur).
- **Stok hareket geçmişi eksiği (Bölüm 2 testinde bulundu):** Yeni ürünün ilk stoğu (Alışlar'dan, Envanter'den "Yeni Ürün" ile ya da takasla gelen) hareket geçmişinde görünmüyordu; artık "Alış ALS-…", "Yeni ürün — ilk stok", "Takas YTS-…" satırı yazılır.
- **Ürün kartındaki ödeme rozeti yanıltıcıydı:** Alışlar'dan eklenen ürün "Ödenmedi" alışta bile kartta "Ödendi" gösteriyordu (eski borç alanı çift sayım olmasın diye "ödendi" tutuluyor). Artık rozet alış kaydının gerçek durumunu gösterir (Ödendi / Kısmi / Ödenmedi).
- **Tedarikçi borcunda "sahte eski borç" hatası (Bölüm 2 testinde bulundu):** Tedarikçisi olmayan ve eski "ödeme durumu"=ödenmedi (varsayılan) kalmış bir ürüne ➕/Alışlar ile ilk kez tedarikçiden alış yapılınca, ürüne o tedarikçi atanıyordu ve ürünün ESKİ stoğu da (hiç o tedarikçiden alınmamış olsa bile) tedarikçiye borç yazılıyordu (örn. ₺5 yerine ₺13). Artık böyle üründe eski ödeme durumu "ödendi" yapılır; ürünün zaten bir ana tedarikçisi varsa değiştirilmez. Ayrıca Alışlar kayıtlarında izlenen adetler, hangi tedarikçiden olursa olsun, eski hesapta tekrar sayılmaz.
- **Tamir kartında ödeme rozeti (Bölüm 3 testinde bulundu):** "Kısmi" ya da "Ödenmedi" açılmış bir tamirin kalanı Tahsil Et ile tamamen alınınca kart hâlâ "Kısmi" gösteriyordu; artık "Ödendi" gösterir.
- **Tamir tarihi bir gün geri görünüyordu (Bölüm 3 testinde bulundu):** Saatli (timestamptz) tarih sütunları yerel güne çevrilir; Pano'daki "kaç gündür" de buna bağlı olarak düzeldi.

## Test raporu (Ekim 2026, Claude in Chrome ile uçtan uca)
32 adımın 29'u ilk denemede beklendiği gibi çalıştı; 1.12 (çift tıklama) elle denenecek. Bulunan ve bu pakette düzeltilenler: taksitli satış (1.8), tedarikçi "sahte eski borç" (2.6), stok hareketinde ilk stok eksikliği (2.1), ürün kartı ödeme rozeti (2.1), tamir tarihi bir gün geri (3.1/3.7), tamir ödeme rozeti (3.5), Gelir/Gider toplamlarının şişmesi (4.3), Finans kayıt sırası, min. stok 0 uyarısı, bildirimin pencere arkasında kalması, satış kartında iade butonunun bulunamaması, Sil butonunun İptal'in yanında olması.
Yüklemeden sonra yeniden denenecekler: 1.8 (taksitli satış), 2.1 (Hareket geçmişinde "Alış ALS-…"), 2.6 (Tedarikçiler borcu = Alışlar borcu), 3.5 (tahsilat sonrası "Ödendi" rozeti), 4.3 (Toplam Gelir/Gider şişmiyor).
- **Tahsil Et sonrası açık Borç penceresi yenilenmiyordu:** Liste yenilenince açık penceredeki müşteri de güncellenir.
- **Finans toplamlarının altına açıklama:** Toplam Gelir/Gider ters kayıtlar mahsup edilmiş değerdir (liste kategorileri ham halini gösterir; net aynı).
- **Stok hareket geçmişi boş kalıyorsa:** `supabase-stok-hareketleri-onar.sql` (tablo doluysa silmez). Sağlık kontrolü artık bu tablonun sütunlarını da denetler.
- **iPhone ana ekran uygulamasında WhatsApp (yeni yaklaşım):** ERP ana ekrandan açıldığında, kodla başka adrese geçmek iOS'un X düğmeli "uygulama içi tarayıcı" penceresini açıyordu. Bu modda WhatsApp gönderimi artık küçük bir pencerede yapılır: mesaj gösterilir/düzenlenir, **"📲 WhatsApp'ta Aç"** gerçek bir bağlantıdır (dokununca doğrudan WhatsApp açılır); olmazsa **"📋 Mesajı Kopyala"** ve **"📤 Paylaş"** yedekleri vardır. Safari, Android ve bilgisayarda davranış aynıdır. (Ana ekran uygulamasında hangi düğmenin sorunsuz çalıştığı test edilecek.)
- **WhatsApp'tan dönünce sayfa başa atıyordu:** WhatsApp'a geçmeden önce kaydırma konumu saklanır; sayfa yeniden yüklenirse aynı konuma geri kaydırılır (içerik <main> kutusunda kaydığı için window değil o kutu kullanılır).
- **Sarf malzeme Excel yüklemede Min. Stok 0 → 10 oluyordu:** Artık Excel'de 0 yazılan Min. Stok 0 kalır (boş bırakılırsa 10).

## v16 — Tedarikçi hafızası (SQL: `supabase-fixes-v11-migration.sql`)
- **Demirbaşlara "Tedarikçi" alanı:** Ekleme/Düzenleme ekranında ve Excel'de ("Tedarikçi" sütunu). Kartta 🚚 ile görünür.
- **Demirbaş kartında 💬 düğmesi:** Aynı üründen tekrar almak için kayıtlı tedarikçiye WhatsApp'ta hazır mesaj açar (ürün adı + "elinizde var mı? birim fiyatı nedir?"). Gönder'e siz basarsınız.
- **Tedarikçiler > "Ürünleri" düğmesi:** O tedarikçiden aldığımız envanter, sarf malzeme ve demirbaşları listeler; istediklerinizi seçip tek mesajda WhatsApp'tan fiyat/stok sorarsınız.
- Sarf malzemede zaten "Fiyat İste" vardı (kritik stok → tedarikçi); tedarikçi alanı doluysa aynı şekilde çalışır.
- Not: WhatsApp mesajı otomatik hazırlanır ama gönderme düğmesine sizin basmanız gerekir (tam otomatik gönderim ücretli WhatsApp Business API gerektirir).

## v17 — Tedarikçi seçimi ve çoklu kategori
- **Sarf Malzeme ve Demirbaş formlarında Tedarikçi artık açılır listeden seçilir** (elle yazmak gerekmez). Listede olmayan eski bir değer varsa "(kayıtlı değil)" ile görünür, kaybolmaz.
- **Tedarikçi eklerken/düzenlerken Kategori çoklu seçim:** Kategoriler dokunarak açılıp kapanan etiketlerdir; bir tedarikçi birden çok kategoride olabilir. **"Yeni kategori ekle"** kutusuyla istediğiniz kategoriyi ekleyebilirsiniz; kaydedilen kategori diğer tedarikçilerde de seçenek olarak görünür. Hiçbiri seçilmezse "Diğer" kaydedilir.
- Tedarikçi kartında her kategori ayrı etiket olarak görünür; Kategori filtresi ve "Kategori" kutusu çoklu kategoriyle çalışır (kutu, kullanılan kategorileri ve her birindeki tedarikçi sayısını gösterir). Eski tek kategorili kayıtlar aynen çalışır; SQL değişikliği gerekmez.
- **Ayarlar > Bağlantı Durumu** artık 10 yerine 19 modülü kontrol eder: Demirbaşlar, Alışlar, Tedarikçi Ödemeleri, Cihaz Alımları, Görevler, Kasa Sayımları, Ödeme Takvimi, Stok Hareketleri (sütun kontrolü dahil), Aktivite Logu eklendi.
- **Envanter sayfası:** "Canlı Döviz Kurları" kutusu kaldırıldı (kurlar yine arka planda otomatik alınır ve fiyat hesaplarında kullanılır; ürün ekleme penceresinde güncel kur satırı duruyor). Sayfa başlığı "Stok Yönetimi" yerine **"Envanter"** oldu.
- **"Finans" sayfası "Kasa" oldu:** Menüdeki adı, sayfa başlığı ("💰 Kasa"), "Yeni Kasa İşlemi" penceresi, personel yetki listesindeki adı ve uyarı metinleri güncellendi. Arka plandaki yetki anahtarı ("Finans") aynı kaldığı için mevcut kullanıcıların yetkileri bozulmaz; eski aktivite kayıtlarında modül adı "Finans" olarak görünmeye devam eder.
- **Alış para birimi varsayılanı TL:** Envanter ➕ "Tedarikçiden satın alındı" ve Alışlar > Yeni Alış (mevcut ürün) artık her zaman TL ile açılır (eskiden ürünün önceki dövizli alış para birimiyle, yani USD ile açılıyordu). Önceki alış dövizliyse fiyat kutusu boş başlar.
- **Yanlış girilen alışı düzeltme (borç bakiyesi):** Alış detayında her satırın yanında **"✏️ Fiyatı düzelt"** vardır (tedarikçiden alışlarda). Birim fiyat ve para birimi değiştirilince alış toplamı, kalan borç (Tedarikçiler sayfasındaki borç) ve ürünün alış fiyatı birlikte güncellenir. Ödenen tutar yeni toplamdan fazlaysa fazlası kasaya "Tedarikçi İadesi" geliri olarak yazılır. Önceki düzeltme yolu (ürünü Envanter'den düzenlemek) alış kaydını ve borcu değiştirmediği için borç aynı kalıyordu.
- **Envanter > Ürün Ekle: alış para birimi varsayılanı artık TL** (eskiden USD seçili geliyordu).
- **Envanter'de ürünün alış fiyatı/para birimi düzeltilince tedarikçi borcu da düzelir:** Borç, Alışlar kayıtlarından hesaplanır; ürün düzenlemesi bu kayıtlara dokunmuyordu (yanlış USD girilip düzeltilse de borç eski kalıyordu). Artık düzenleme kaydedilince, ürünün eski fiyatla kayıtlı alışları bulunur ve "Alış kaydı ve borç da yeni fiyata göre düzeltilsin mi?" diye sorulur. Evet derseniz alış toplamı, kalan borç ve (fazla ödeme varsa) kasaya iade geliri birlikte düzelir. Daha önce düzeltilmiş ürünler için: Alışlar > ilgili alış > Detay > "✏️ Fiyatı düzelt".
- **Alışlar sayfası açılmıyordu ("Application error: a client-side exception"):** Alış fiyatı düzeltme için eklenen 4 durum (state) kancası, sayfanın yetki kontrolünden SONRA tanımlıydı; React kancaların her çizimde aynı sayıda çağrılmasını ister, bu yüzden sayfa çöküyordu. Kancalar yetki kontrolünden önceye taşındı. Tüm sayfalar aynı hata için tarandı, başka sorun yok.
- **Hata ekranı ve sürüm yazısı (v31):** Bir sayfa çökerse artık boş "Application error" yerine hatanın metni gösterilir (menü yerinde kalır, "Yeniden dene" düğmesi vardır). Menünün altında "Sürüm vNN" yazısı görünür; canlıda hangi sürümün çalıştığı buradan anlaşılır. Alış kayıtlarındaki bozuk/eksik satırlar sayfayı çökertmeyecek şekilde güvenli okunur.
- **Envanter'de adet düzeltince Alışlar ve borç da düzelir (tek yerden düzeltme):** Tedarikçili bir ürünün adedini düzenleme ekranında değiştirip kaydedince tek soru sorulur. Azalışta "Tamam" = hatalı/iade edilen alışın düzeltmesi: stok, Alışlar kaydındaki adet ve tedarikçi borcu birlikte düşer (ödenen fazlası kasaya "Tedarikçi İadesi" yazılır). Artışta "Tamam" = tedarikçiden alınan ek ürün: stok artar, Alışlar'a yeni (ödenmemiş) alış kaydı eklenir ve borç artar. "İptal" = sadece sayım/kayıp düzeltmesi: alış kaydı ve borç değişmez. Böylece Envanter ile Alışlar arasında uyuşmazlık oluşmaz; Alışlar'da ayrıca adet düzeltmeye gerek kalmaz. Tedarikçisiz ürünlerde davranış aynıdır.

## v33 — Alışlar'da adet düzeltme ve silme
- **🔢 Adedi düzelt** (alış detayında, her ürün satırında; tedarikçiden alışlar): Stok, alış toplamı ve tedarikçi borcu birlikte düzelir. Adet azalırsa ödenen fazlası kasaya "Tedarikçi İadesi" geliri yazılır; satılmış ürünün adedi azaltılamaz (stok yetersizse reddedilir). Stok işlemi başarısız olursa alış kaydı değişmez, alış kaydı güncellenemezse stok geri alınır.
- **🗑️ Alışı Sil** (sadece yönetici): Ürünler stoktan düşer (stok yetersizse hiçbir şey silinmez, nedeni yazılır), ödenen tutar kasaya "Tedarikçi İadesi" geliri olarak yazılır (kasa geçmişi silinmez), borç alış kalkınca otomatik düşer. Alışla oluşan yeni ürünün kartı Envanter'de 0 stokla kalır. İşlem Aktivite Logu'na yazılır.

## v34 — Müşteri düzeltmeleri
- **Müşteri telefonu/adı düzeltilince satış ve tamir kayıtları da güncellenir:** Satışta müşterinin adı ve telefonu kopya olarak saklandığı için, yanlış yazılıp sonradan düzeltilen numara satış kaydında ve WhatsApp'ta eski kalıyordu. Artık müşteri kaydedilince (değişiklik olmasa da "Güncelle"ye basmak yeterli) o müşteriye bağlı bütün satışlardaki ad/telefon yenilenir; müşteriye bağlı olmayan eski satışlar eski ad+telefon eşleşmesiyle bulunur. Tamirlerde ad güncellenir, telefon ise eski numarayla aynıysa güncellenir.
- **Satışlardan WhatsApp:** Müşteri kayıtlıysa mesaj GÜNCEL müşteri telefonuna gider (satıştaki kopya yalnızca müşteri bulunamazsa kullanılır).
- **Müşteri Düzenle penceresine Şehir, Adres ve Notlar alanları eklendi** (adres değiştirilemiyordu); pencere küçük ekranda kaydırılabilir.

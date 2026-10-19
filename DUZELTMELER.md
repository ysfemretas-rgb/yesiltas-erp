# Düzeltme Paketi v2 — Ne Değişti?

## ÖNCE YAPIN (1 dakika)
Supabase Dashboard > SQL Editor'de `supabase-fixes-v2-migration.sql` dosyasının TAMAMINI bir kez çalıştırın.
(Satışa müşteri bağı, tedarikçi ödemeleri tablosu, atomik stok fonksiyonu ve alım adedi sütununu ekler. Tekrar çalıştırmak güvenlidir.)
Sonra projeyi her zamanki gibi güncelleyip yayınlayın. Arayüz, renkler, semboller ve sayfa yapısı aynı kaldı.

## Düzeltilen hatalar
- Eşantiyon satış/tamir artık müşteri geçmişinde görünüyor (🎁 ile).
- Müşteri eşleştirmesi artık isim "içeriyor mu" yerine müşteri ID / müşteri kodu / benzersiz tam isim ile yapılıyor.
- Satışlar müşteri ID'sini saklıyor (sayfa yenilenince borç/düzenleme/WhatsApp bozulmuyor). Eski satışlar SQL ile otomatik eşleniyor.
- Borç çift sayımı giderildi; borç artık gerçekten kapanıyor (Tahsil Et).
- Kasa: eşantiyon gideri alış maliyeti üzerinden; tamirde çift gelir kaldırıldı; satış düzenleme kasaya yansıyor; 0 TL gelir kaydı oluşmuyor; tahsilat, stok alımı ve tedarikçi ödemesi kasaya yazılıyor.
- Kâr: dolar/euro alışlı ürünlerde alış fiyatı TL'ye çevrilerek kaydediliyor; eşantiyon ciro/kâr sayılmıyor; iskonto kârdan düşüyor; iptal satışlar rapora girmiyor.
- Dashboard artık Supabase'den okuyor (eski localStorage değil).
- Tedarikçi borcu "alınan toplam adet" üzerinden; satış yapınca borç kaybolmuyor. Tedarikçi adı değişince ürün bağlantısı kopmuyor.
- Tarihler yerel saate göre (00:00-03:00 arası "dün" yazma sorunu).
- 1000 kayıt sınırı kaldırıldı (sayfalı çekme).
- Stok: sepette stok üstü engellendi; stok değişimi veritabanında atomik.
- Min. stok 0 girilebiliyor; yanıltıcı SKU uyarısı düzeltildi; müşteri aktif/pasif durumu artık kaydediliyor.
- Yetki: oturum ve rol/izinler Supabase'den doğrulanıyor (localStorage'dan değiştirilemez).

## Eklenen özellikler
- Envanter ürün formunda ➕ Yeni Tedarikçi (sadece ad yeterli); tedarikçi eklerken yetkili kişi zorunlu değil.
- Müşteri > Borç: satış/tamir bakiyesi için "Tahsil Et" (kısmi/tam), kasaya otomatik gelir.
- Tedarikçi: "Ödeme Yap" (kasaya gider), silmeden önce bağlı ürün kontrolü.
- Satış: İptal/İade (stok geri, borç/kasa temizlenir), Fiş yazdır.
- Kritik stok listesinde tedarikçiye WhatsApp sipariş butonu.

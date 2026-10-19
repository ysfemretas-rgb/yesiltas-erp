# Düzeltme Paketi v3 (sadece değişen dosyalar)

Bu zip, bir önceki paketin (v2) ÜZERİNE kopyalanır. Klasör yolları proje kökündekilerle aynıdır.

## Önce yapın
Supabase > SQL Editor'de sırayla çalıştırın (her biri bir kez):
1. `supabase-fixes-v2-migration.sql` (v2 paketinde var, henüz çalıştırmadıysanız)
2. `supabase-fixes-v3-migration.sql` (bu zipte)

## Bu pakette düzelenler
- Mobilde kur güncellenme tarihi ve saati kurun altında görünür.
- Bugün sayfası ve bildirimlerde borç hatırlatması doğru kişiye gider.
- Garantiler: "Bitmek Üzere" / "Süresi Dolmuş" sayaçları ve filtre doğru çalışır.
- Kayıtlı randevu düzenlenirken çıkan "Müşteri zorunlu" hatası giderildi.
- Tüm tablolarda 1000 kayıt sınırı kalktı.

## Kullanabileceğiniz özellikler
- **Satışlar > Garanti:** satış kartındaki butona basın, süreyi (ay) yazın; Garantiler sayfasına kayıt açılır.
- **Finans > 📊 Gün Sonu:** günün gelir/gider özetini açar, yazdırabilirsiniz.
- **Ayarlar > Kaydet:** IBAN, adres ve iskonto limiti bir kez kaydedilince tablet ve bilgisayarda ortak olur. Ayarları bir cihazda kaydetmeniz yeterli.
- **Satışlar > Fiş / İptal:** satış fişi yazdırır; iptal stoğu geri ekler, borç ve kasa kaydını kaldırır.
- **Müşteriler > Borç > Tahsil Et:** satış/tamir bakiyesini tam ya da kısmi tahsil eder, kasaya gelir yazar.
- **Tedarikçiler > Ödeme Yap:** tedarikçiye yapılan ödemeyi kaydeder, kasaya gider yazar.
- **Envanter > ➕ Yeni Tedarikçi:** ürün formundan çıkmadan sadece adla tedarikçi ekler.
- **Envanter > Kritik Stok Uyarısı:** yeşil WhatsApp butonu tedarikçiye hazır sipariş mesajı açar (tedarikçide telefon kayıtlı olmalı).

## Dikkat
- Önceki bir dolarlı ürün satışının kârı eski haliyle hatalı görünebilir; yeni satışlar doğru kaydedilir.

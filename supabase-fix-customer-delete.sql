-- ============================================================
-- MÜŞTERİ SİLME HATASINI DÜZELTME
-- ============================================================
-- Bir müşterinin borç kaydı varsa, müşteriyi silmeye çalışınca veritabanı
-- "bağlantılı kayıt var" diye reddediyordu. Artık bir müşteri silinince
-- borç kayıtları da otomatik siliniyor.

alter table debts drop constraint if exists debts_customer_id_fkey;
alter table debts add constraint debts_customer_id_fkey
  foreign key (customer_id) references customers(id) on delete cascade;

-- ============================================================
-- GARANTİLER (warranties) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
-- Bu dosyayı Supabase SQL Editor'de bir kez çalıştır.

alter table warranties add column if not exists customer_phone text default '';
alter table warranties add column if not exists warranty_type text default '';

-- Önce mevcut satırlardaki eski (Türkçe) durum değerlerini yeni değerlere
-- çeviriyoruz, SONRA kısıtlamayı ekliyoruz — sıra önemli.
alter table warranties drop constraint if exists warranties_status_check;

update warranties set status = 'active' where status = 'Aktif';
update warranties set status = 'expired' where status = 'Sona Erdi';
update warranties set status = 'active' where status = 'İade Edildi';

alter table warranties alter column status set default 'active';
alter table warranties add constraint warranties_status_check
  check (status in ('active','expired','expiring'));

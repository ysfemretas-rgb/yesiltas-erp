-- ============================================================
-- TEDARİKÇİLER (suppliers) TABLOSUNU GENİŞLETME
-- ============================================================
-- Uygulamanın arayüzü bu alanları kullanıyor ama orijinal tabloda yoktu.
-- Bu dosyayı Supabase SQL Editor'de bir kez çalıştırman yeterli.

alter table suppliers add column if not exists contact_person text default '';
alter table suppliers add column if not exists category text default 'Diğer';
alter table suppliers add column if not exists rating integer default 5;
alter table suppliers add column if not exists status text default 'active' check (status in ('active','inactive'));
alter table suppliers add column if not exists total_orders integer default 0;
alter table suppliers add column if not exists last_order_date date;

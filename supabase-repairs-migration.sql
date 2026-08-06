-- ============================================================
-- TEKNİK SERVİS (devices) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table devices add column if not exists customer_name text default '';
alter table devices add column if not exists phone1 text default '';
alter table devices add column if not exists phone2 text default '';
alter table devices add column if not exists device_type text default 'Telefon';
alter table devices add column if not exists cost numeric default 0;
alter table devices add column if not exists remaining_amount numeric default 0;
alter table devices add column if not exists payment_type text default 'unpaid';

-- Durum listesi (Beklemede/Tamiri Başladı/.../İptal Edildi) uygulamanın
-- kullandığı üç durumla (waiting/in_progress/completed) eşleşmiyordu.
alter table devices drop constraint if exists devices_status_check;

update devices set status = 'waiting' where status in ('Beklemede','Parça Bekleniyor');
update devices set status = 'in_progress' where status = 'Tamiri Başladı';
update devices set status = 'completed' where status in ('Tamamlandı','Teslim Edildi');
update devices set status = 'waiting' where status = 'İptal Edildi';
update devices set status = 'waiting' where status is null or status not in ('waiting','in_progress','completed');

alter table devices alter column status set default 'waiting';
alter table devices add constraint devices_status_check check (status in ('waiting','in_progress','completed'));

-- complaint (arıza açıklaması) NOT NULL idi, ama uygulama bazen boş bırakabiliyor.
alter table devices alter column complaint drop not null;

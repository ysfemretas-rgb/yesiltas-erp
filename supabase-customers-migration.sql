-- ============================================================
-- MÜŞTERİLER (customers) VE BORÇLAR (debts) TABLOLARINI
-- UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table customers add column if not exists first_name text default '';
alter table customers add column if not exists last_name text default '';
alter table customers add column if not exists phone2 text default '';
alter table customers add column if not exists city text default '';
alter table customers add column if not exists total_repairs integer default 0;
alter table customers add column if not exists last_visit date;
alter table customers add column if not exists status text default 'active';

alter table customers drop constraint if exists customers_status_check;
update customers set status = 'active' where status is null or status not in ('active','inactive');
alter table customers add constraint customers_status_check check (status in ('active','inactive'));

alter table debts add column if not exists description text default '';

alter table debts drop constraint if exists debts_status_check;
update debts set status = 'Tamamlandı' where status = 'paid';
update debts set status = 'Beklemede' where status = 'unpaid';
update debts set status = 'Beklemede' where status is null or status not in ('Beklemede','Kısmi Ödendi','Tamamlandı','Gecikti');
alter table debts add constraint debts_status_check check (status in ('Beklemede','Kısmi Ödendi','Tamamlandı','Gecikti'));

-- ============================================================
-- PERSONEL (staff) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table staff add column if not exists email text default '';
alter table staff add column if not exists department text default '';
alter table staff add column if not exists join_date date;
alter table staff add column if not exists status text default 'active';
alter table staff add column if not exists permissions text[] default '{}';
alter table staff add column if not exists salary numeric default 0;

-- Rol kontrolü, uygulamanın kullandığı farklı rol adlarıyla eşleşmiyordu
-- (Teknisyen, Muhasebeci, Satış Temsilcisi, Yönetici) — serbest metne çevriliyor.
alter table staff drop constraint if exists staff_role_check;

alter table staff drop constraint if exists staff_status_check;
update staff set status = 'active' where status is null or status not in ('active','inactive','on_leave');
alter table staff add constraint staff_status_check check (status in ('active','inactive','on_leave'));

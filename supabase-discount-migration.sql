-- ============================================================
-- İSKONTO ALANI EKLEME (Teknik Servis ve Satışlar)
-- ============================================================
alter table devices add column if not exists discount numeric default 0;
alter table sales add column if not exists discount numeric default 0;

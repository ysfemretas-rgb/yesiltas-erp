-- ============================================================
-- ENVANTER (inventory) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table inventory add column if not exists sku text default '';
alter table inventory add column if not exists profit_margin numeric default 0;
alter table inventory add column if not exists supplier text default '';
alter table inventory add column if not exists location text default '';

-- ============================================================
-- SARF MALZEME (consumables) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
alter table consumables add column if not exists purchase_currency text default 'TRY';
alter table consumables add column if not exists supplier text default '';
alter table consumables add column if not exists last_restocked date;

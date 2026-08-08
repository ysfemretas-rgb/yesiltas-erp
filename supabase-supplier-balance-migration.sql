-- ============================================================
-- TEDARİKÇİ BORÇ TAKİBİ
-- ============================================================
-- Sizin tedarikçiye olan borcunuzu takip etmek için.
alter table suppliers add column if not exists balance numeric default 0;

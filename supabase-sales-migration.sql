-- ============================================================
-- SATIŞLAR (sales) TABLOSUNU UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
-- Uygulama tek satışta birden fazla ürün (sepet) tutabiliyor, orijinal tablo
-- ise satış başına tek ürün varsayıyordu. En basit ve güvenli çözüm: sepeti
-- tek bir JSON sütununda saklamak (ayrı bir "sale_items" tablosu kurmak yerine).

alter table sales add column if not exists items jsonb default '[]'::jsonb;
alter table sales add column if not exists customer_name text default '';
alter table sales add column if not exists customer_phone text default '';
alter table sales add column if not exists paid_amount numeric default 0;
alter table sales add column if not exists sale_date date default current_date;
alter table sales add column if not exists sale_status text default 'completed';

-- Ödeme şekli listesi uygulamadakiyle (cash/card/transfer/partial/unpaid)
-- eşleşmiyordu, serbest metne çevriliyor.
alter table sales drop constraint if exists sales_payment_method_check;

alter table sales drop constraint if exists sales_sale_status_check;
alter table sales add constraint sales_sale_status_check check (sale_status in ('completed','cancelled'));

-- item_name artık tek ürün yerine "sepet özeti" için kullanılabilir, zorunlu olmaktan çıkarılıyor.
alter table sales alter column item_name drop not null;

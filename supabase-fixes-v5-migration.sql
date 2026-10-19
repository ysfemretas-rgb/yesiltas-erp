-- ============================================================
-- YEŞİLTAŞ ERP — PAKET v5 (BİR KEZ ÇALIŞTIRIN)
-- Çoklu ödeme, taksit, iade, takas, doğum günü, cihaz alımı, tamir imzası.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- Satışlar
alter table sales add column if not exists payments jsonb default '[]'::jsonb;
alter table sales add column if not exists installments jsonb default '[]'::jsonb;
alter table sales add column if not exists refunds jsonb default '[]'::jsonb;
alter table sales add column if not exists trade_in jsonb;

-- Müşteri doğum günü
alter table customers add column if not exists birth_date date;

-- Envanter: ikinci el cihaz IMEI'si
alter table inventory add column if not exists imei text;

-- Tamir: teslim imzası (küçük resim olarak kayda yazılır)
alter table devices add column if not exists signature text;

-- İkinci el cihaz alım belgeleri
create table if not exists device_purchases (
  id uuid primary key default gen_random_uuid(),
  doc_code text,
  seller_name text not null,
  seller_phone text default '',
  seller_id_no text default '',
  device_name text not null,
  imei text default '',
  condition_note text default '',
  price numeric not null default 0,
  product_id uuid,
  purchase_date date default current_date,
  created_at timestamptz not null default now()
);
alter table device_purchases enable row level security;
drop policy if exists device_purchases_all_authenticated on device_purchases;
create policy device_purchases_all_authenticated on device_purchases
  for all to authenticated using (true) with check (true);

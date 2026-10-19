-- ============================================================
-- YEŞİLTAŞ ERP — DÜZELTME PAKETİ v4 (BİR KEZ ÇALIŞTIRIN)
-- Stok hareket geçmişi + tamirde parça/teknisyen alanları.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- 1) Stok hareket geçmişi
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  product_name text default '',
  delta integer not null,
  reason text default '',
  user_name text default '',
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on stock_movements(product_id, created_at desc);
alter table stock_movements enable row level security;
drop policy if exists stock_movements_all_authenticated on stock_movements;
create policy stock_movements_all_authenticated on stock_movements
  for all to authenticated using (true) with check (true);

-- 2) Tamir: kullanılan parçalar, parça maliyeti, teknisyen
alter table devices add column if not exists parts jsonb default '[]'::jsonb;
alter table devices add column if not exists parts_cost numeric default 0;
alter table devices add column if not exists technician text default '';

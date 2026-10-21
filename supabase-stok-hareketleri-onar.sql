-- ============================================================
-- STOK HAREKETLERİ TABLOSUNU ONAR (güvenli: tablo doluysa silmez)
-- Belirti: Envanter > Hareket hep "Henüz kayıtlı hareket yok" diyor. Eski bir SQL sürümünden kalma tablo
-- farklı sütunlara sahipse kayıt yazılamaz (hata sessizce yutulur).
-- ============================================================
do $$
begin
  if to_regclass('public.stock_movements') is null or (select count(*) from public.stock_movements) = 0 then
    drop table if exists public.stock_movements;
    create table public.stock_movements (
      id uuid primary key default gen_random_uuid(),
      product_id uuid not null,
      product_name text default '',
      delta integer not null,
      reason text default '',
      user_name text default '',
      created_at timestamptz not null default now()
    );
  else
    alter table public.stock_movements add column if not exists product_id uuid;
    alter table public.stock_movements add column if not exists product_name text default '';
    alter table public.stock_movements add column if not exists delta integer;
    alter table public.stock_movements add column if not exists reason text default '';
    alter table public.stock_movements add column if not exists user_name text default '';
    alter table public.stock_movements add column if not exists created_at timestamptz default now();
  end if;
end $$;

create index if not exists stock_movements_product_idx on stock_movements(product_id, created_at desc);
alter table stock_movements enable row level security;
drop policy if exists stock_movements_all_authenticated on stock_movements;
drop policy if exists stock_movements_select_authenticated on stock_movements;
drop policy if exists stock_movements_insert_authenticated on stock_movements;
drop policy if exists stock_movements_delete_manager on stock_movements;
create policy stock_movements_select_authenticated on stock_movements for select to authenticated using (true);
create policy stock_movements_insert_authenticated on stock_movements for insert to authenticated with check (true);
create policy stock_movements_delete_manager on stock_movements for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

-- Kontrol: sütunlar
select column_name, data_type, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'stock_movements' order by ordinal_position;

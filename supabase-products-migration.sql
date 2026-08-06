-- ============================================================
-- ÜRÜN KATALOĞU (products) TABLOSUNU OLUŞTURMA
-- ============================================================
-- Satış sayfasındaki ürün kataloğu (kılıf, kablo, şarj aleti vb.) daha
-- önce hiç veritabanında değildi, tamamen yeni bir tablo.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric default 0,
  stock integer default 0,
  category text default '',
  created_at timestamptz default now()
);

alter table products enable row level security;

drop policy if exists "products_select_authenticated" on products;
create policy "products_select_authenticated" on products for select to authenticated using (true);

drop policy if exists "products_insert_authenticated" on products;
create policy "products_insert_authenticated" on products for insert to authenticated with check (true);

drop policy if exists "products_update_authenticated" on products;
create policy "products_update_authenticated" on products for update to authenticated using (true) with check (true);

drop policy if exists "products_delete_manager_only" on products;
create policy "products_delete_manager_only" on products for delete to authenticated using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici')
);

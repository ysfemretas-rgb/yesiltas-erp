-- ============================================================
-- DEMİRBAŞLAR (fixed_assets) TABLOSUNU OLUŞTURMA
-- ============================================================
create table if not exists fixed_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  quantity integer default 1,
  purchase_price numeric default 0,
  purchase_currency text default 'TRY',
  purchase_date date,
  location text default '',
  notes text default '',
  created_at timestamptz default now()
);

alter table fixed_assets enable row level security;

drop policy if exists "fixed_assets_select_authenticated" on fixed_assets;
create policy "fixed_assets_select_authenticated" on fixed_assets for select to authenticated using (true);

drop policy if exists "fixed_assets_insert_authenticated" on fixed_assets;
create policy "fixed_assets_insert_authenticated" on fixed_assets for insert to authenticated with check (true);

drop policy if exists "fixed_assets_update_authenticated" on fixed_assets;
create policy "fixed_assets_update_authenticated" on fixed_assets for update to authenticated using (true) with check (true);

drop policy if exists "fixed_assets_delete_manager_only" on fixed_assets;
create policy "fixed_assets_delete_manager_only" on fixed_assets for delete to authenticated using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici')
);

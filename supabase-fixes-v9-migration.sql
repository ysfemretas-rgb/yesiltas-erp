-- ============================================================
-- YEŞİLTAŞ ERP — PAKET v9 (BİR KEZ ÇALIŞTIRIN) — Alış sayfası
-- Önce v2..v8 çalıştırılmış olmalıdır. Tekrar çalıştırmak güvenlidir.
-- ============================================================
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_code text not null,
  kind text not null check (kind in ('supplier','customer')),
  party_name text not null default '',
  party_phone text default '',
  invoice_no text default '',
  purchase_date date not null default current_date,
  items jsonb not null default '[]'::jsonb,
  total_try numeric not null default 0,
  paid_amount numeric not null default 0,
  note text default '',
  created_by text default '',
  created_at timestamptz not null default now()
);
create unique index if not exists purchases_code_key on purchases(purchase_code);
create index if not exists purchases_party_idx on purchases(kind, party_name);
create index if not exists purchases_date_idx on purchases(purchase_date desc);

alter table purchases enable row level security;
drop policy if exists purchases_select_authenticated on purchases;
drop policy if exists purchases_insert_authenticated on purchases;
drop policy if exists purchases_update_authenticated on purchases;
drop policy if exists purchases_delete_manager on purchases;
create policy purchases_select_authenticated on purchases for select to authenticated using (true);
create policy purchases_insert_authenticated on purchases for insert to authenticated with check (true);
create policy purchases_update_authenticated on purchases for update to authenticated using (true) with check (true);
create policy purchases_delete_manager on purchases for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

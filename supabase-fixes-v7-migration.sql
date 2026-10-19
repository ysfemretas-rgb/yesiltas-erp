-- ============================================================
-- YEŞİLTAŞ ERP — PAKET v7 (BİR KEZ ÇALIŞTIRIN)
-- Önce v2..v6 migrasyonları çalıştırılmış olmalıdır. Tekrar çalıştırmak güvenlidir.
-- Gerçek kâr (ek maliyet), kasa sayımı, ödeme takvimi.
-- ============================================================

-- 1) Satışa ek maliyet (kart komisyonu, kargo vb.) — sadece kâr hesabında kullanılır, kasayı etkilemez
alter table sales add column if not exists extra_cost numeric default 0;
alter table sales add column if not exists extra_cost_note text default '';

-- 2) Kasa sayımı (açılış / kapanış)
create table if not exists cash_counts (
  id uuid primary key default gen_random_uuid(),
  count_date date not null default current_date,
  kind text not null check (kind in ('open','close')),
  counted_cash numeric not null default 0,
  expected_cash numeric,
  non_cash numeric default 0,
  difference numeric,
  note text default '',
  user_name text default '',
  created_at timestamptz not null default now()
);
create index if not exists cash_counts_date_idx on cash_counts(count_date desc, created_at desc);

-- 3) Ödeme takvimi (kira, fatura, vergi, tedarikçi vb.)
create table if not exists scheduled_payments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Diğer',
  amount numeric not null default 0,
  due_date date not null,
  repeat text not null default 'none' check (repeat in ('none','monthly')),
  status text not null default 'pending' check (status in ('pending','paid')),
  paid_date date,
  note text default '',
  created_at timestamptz not null default now()
);
create index if not exists scheduled_payments_due_idx on scheduled_payments(due_date);

-- RLS: herkes (giriş yapmış personel) okuyup ekleyebilir; kasa sayımı düzenleme/silme ve takvimde silme sadece Yönetici.
alter table cash_counts enable row level security;
alter table scheduled_payments enable row level security;

drop policy if exists cash_counts_select_authenticated on cash_counts;
drop policy if exists cash_counts_insert_authenticated on cash_counts;
drop policy if exists cash_counts_modify_manager on cash_counts;
drop policy if exists cash_counts_delete_manager on cash_counts;
create policy cash_counts_select_authenticated on cash_counts for select to authenticated using (true);
create policy cash_counts_insert_authenticated on cash_counts for insert to authenticated with check (true);
create policy cash_counts_modify_manager on cash_counts for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));
create policy cash_counts_delete_manager on cash_counts for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

drop policy if exists scheduled_payments_select_authenticated on scheduled_payments;
drop policy if exists scheduled_payments_insert_authenticated on scheduled_payments;
drop policy if exists scheduled_payments_update_authenticated on scheduled_payments;
drop policy if exists scheduled_payments_delete_manager on scheduled_payments;
create policy scheduled_payments_select_authenticated on scheduled_payments for select to authenticated using (true);
create policy scheduled_payments_insert_authenticated on scheduled_payments for insert to authenticated with check (true);
create policy scheduled_payments_update_authenticated on scheduled_payments for update to authenticated using (true) with check (true);
create policy scheduled_payments_delete_manager on scheduled_payments for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

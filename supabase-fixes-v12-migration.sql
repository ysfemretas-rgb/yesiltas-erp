-- ============================================================
-- YEŞİLTAŞ ERP — v12 (BİR KEZ ÇALIŞTIRIN) — İndirimli borç kapatma kaydı
-- Müşteri tahsilatında / tedarikçi ödemesinde "kalanı indirim yap" denildiğinde indirim burada ayrıca tutulur
-- (kasaya girmez; raporlarda "verilen / alınan indirim" olarak görünür). Tekrar çalıştırmak güvenlidir.
-- ============================================================
create table if not exists settlement_discounts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('customer', 'supplier')),
  party_name text not null default '',
  amount numeric not null default 0,
  note text default '',
  ref text default '',
  date date not null default current_date,
  created_by text default '',
  created_at timestamptz not null default now()
);

create index if not exists settlement_discounts_kind_date_idx on settlement_discounts(kind, date desc);

alter table settlement_discounts enable row level security;
drop policy if exists settlement_discounts_select_authenticated on settlement_discounts;
drop policy if exists settlement_discounts_insert_authenticated on settlement_discounts;
drop policy if exists settlement_discounts_delete_manager on settlement_discounts;
create policy settlement_discounts_select_authenticated on settlement_discounts for select to authenticated using (true);
create policy settlement_discounts_insert_authenticated on settlement_discounts for insert to authenticated with check (true);
create policy settlement_discounts_delete_manager on settlement_discounts for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

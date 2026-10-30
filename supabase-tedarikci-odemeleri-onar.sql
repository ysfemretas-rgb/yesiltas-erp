-- ============================================================
-- TEDARİKÇİ ÖDEMELERİ TABLOSUNU ONAR (güvenli: tablo doluysa silmez)
-- Belirti: supplier_payments tablosunda "supplier_name" sütunu yok (eski bir sürümden kalma tablo).
-- Bu durumda tedarikçiye yapılan genel ödemeler kaydedilemez/okunamaz ve uygulama hatayı sessizce yutar
-- (Ayarlar > Bağlantı Durumu'nda "0 kayıt" görünür).
-- ÖNCE bu sorguyla mevcut sütunlara bakın (sonucu bana da gösterebilirsiniz):
--   select column_name, data_type, is_nullable from information_schema.columns
--   where table_schema = 'public' and table_name = 'supplier_payments' order by ordinal_position;
-- ============================================================
do $$
begin
  if to_regclass('public.supplier_payments') is null or (select count(*) from public.supplier_payments) = 0 then
    drop table if exists public.supplier_payments;
    create table public.supplier_payments (
      id uuid primary key default gen_random_uuid(),
      supplier_name text not null,
      amount numeric not null check (amount > 0),
      payment_date date default current_date,
      note text default '',
      created_at timestamptz not null default now()
    );
  else
    alter table public.supplier_payments add column if not exists supplier_name text;
    alter table public.supplier_payments add column if not exists amount numeric;
    alter table public.supplier_payments add column if not exists payment_date date default current_date;
    alter table public.supplier_payments add column if not exists note text default '';
    alter table public.supplier_payments add column if not exists created_at timestamptz default now();
  end if;
end $$;

alter table supplier_payments enable row level security;
drop policy if exists supplier_payments_all_authenticated on supplier_payments;
drop policy if exists supplier_payments_select_authenticated on supplier_payments;
drop policy if exists supplier_payments_insert_authenticated on supplier_payments;
drop policy if exists supplier_payments_delete_manager on supplier_payments;
create policy supplier_payments_select_authenticated on supplier_payments for select to authenticated using (true);
create policy supplier_payments_insert_authenticated on supplier_payments for insert to authenticated with check (true);
create policy supplier_payments_delete_manager on supplier_payments for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

select column_name, data_type, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'supplier_payments' order by ordinal_position;

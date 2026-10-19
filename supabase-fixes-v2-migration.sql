-- ============================================================
-- YEŞİLTAŞ ERP — DÜZELTME PAKETİ v2 (BİR KEZ ÇALIŞTIRIN)
-- Supabase Dashboard > SQL Editor'de tamamını çalıştırın.
-- Tekrar çalıştırmak güvenlidir (idempotent).
-- ============================================================

-- 1) SATIŞA GERÇEK MÜŞTERİ BAĞI (isim eşleştirmesi yerine)
alter table sales add column if not exists customer_id uuid;

-- Eski satışları önce müşteri koduna, sonra tam isme göre eşle
update sales s set customer_id = c.id
from customers c
where s.customer_id is null
  and coalesce(s.customer_code,'') <> ''
  and c.customer_code = s.customer_code;

update sales s set customer_id = c.id
from customers c
where s.customer_id is null
  and lower(trim(c.name)) = lower(trim(s.customer_name))
  and (select count(*) from customers c2 where lower(trim(c2.name)) = lower(trim(s.customer_name))) = 1;

create index if not exists sales_customer_id_idx on sales(customer_id);

-- 2) TEDARİKÇİ ALIM ADEDİ (satılsa bile tedarikçi borcu düşmesin)
alter table inventory add column if not exists total_purchased_qty numeric;

update inventory i set total_purchased_qty = i.quantity + coalesce((
  select sum((it->>'quantity')::numeric)
  from sales s, jsonb_array_elements(s.items) it
  where it->>'productId' = i.id::text
    and coalesce(s.sale_status,'completed') = 'completed'
), 0)
where i.total_purchased_qty is null;

-- 3) TEDARİKÇİ ÖDEMELERİ
create table if not exists supplier_payments (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  amount numeric not null check (amount > 0),
  payment_date date default current_date,
  note text default '',
  created_at timestamptz not null default now()
);
alter table supplier_payments enable row level security;
drop policy if exists supplier_payments_all_authenticated on supplier_payments;
create policy supplier_payments_all_authenticated on supplier_payments
  for all to authenticated using (true) with check (true);

-- 4) ATOMİK STOK DEĞİŞİMİ (aynı anda iki satış birbirini ezmesin)
create or replace function adjust_inventory_quantity(p_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
as $$
declare new_qty integer;
begin
  update inventory
     set quantity = greatest(0, coalesce(quantity,0) + p_delta)
   where id = p_id
  returning quantity into new_qty;
  return new_qty;
end;
$$;

-- 5) SATIŞ KODU: aynı anda iki satışta çakışmayı önlemek için kilit
create or replace function assign_sale_code()
returns trigger as $$
declare
  next_num integer;
begin
  if new.sale_code is null or new.sale_code = '' then
    perform pg_advisory_xact_lock(884201);
    select coalesce(min(t.n), 1) into next_num
    from generate_series(1, (select coalesce(count(*), 0) + 1 from sales)) as t(n)
    where not exists (
      select 1 from sales where sale_code = 'YTS-' || lpad(t.n::text, 4, '0')
    );
    new.sale_code := 'YTS-' || lpad(next_num::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

-- 6) Eşantiyon (bedelsiz) satışlar için ödeme yöntemi kısıtı yoksa sorun yok;
--    olası eski kısıtı kaldır
alter table sales drop constraint if exists sales_payment_method_check;

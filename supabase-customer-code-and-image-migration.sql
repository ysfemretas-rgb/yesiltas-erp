-- ============================================================
-- MÜŞTERİ KODU (YTM-0001) + ÜRÜN RESMİ
-- ============================================================

-- 1) MÜŞTERİ KODU — envanterdeki gibi, boşluk dolduran sistem
alter table customers add column if not exists customer_code text;

create or replace function assign_customer_code()
returns trigger as $$
declare
  next_num integer;
begin
  if new.customer_code is null or new.customer_code = '' then
    select coalesce(min(t.n), 1) into next_num
    from generate_series(
      1,
      (select coalesce(count(*), 0) + 1 from customers)
    ) as t(n)
    where not exists (
      select 1 from customers
      where customer_code = 'YTM-' || lpad(t.n::text, 4, '0')
    );

    new.customer_code := 'YTM-' || lpad(next_num::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_customer_code on customers;
create trigger trg_assign_customer_code
  before insert on customers
  for each row execute function assign_customer_code();

-- Mevcut müşterileri baştan, boşluksuz numaralandır
do $$
declare
  r record;
  i integer := 1;
begin
  update customers set customer_code = 'TMP-' || id::text;
  for r in select id from customers order by created_at loop
    update customers set customer_code = 'YTM-' || lpad(i::text, 4, '0') where id = r.id;
    i := i + 1;
  end loop;
end $$;

create unique index if not exists customers_customer_code_key on customers(customer_code);

-- 2) ÜRÜN RESMİ — envanterdeki ürünler için görsel adresi
alter table inventory add column if not exists image_url text;

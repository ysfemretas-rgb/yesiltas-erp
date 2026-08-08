-- ============================================================
-- SATIŞ KODU (YTS-0001) VE TEKNİK SERVİS KODU (YTT-0001)
-- ============================================================
-- Envanter/müşteri ile aynı mantık: boşluk dolduran, tekrar kullanılabilir kod.

-- ---------- SATIŞLAR ----------
alter table sales add column if not exists sale_code text;

create or replace function assign_sale_code()
returns trigger as $$
declare
  next_num integer;
begin
  if new.sale_code is null or new.sale_code = '' then
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

drop trigger if exists trg_assign_sale_code on sales;
create trigger trg_assign_sale_code
  before insert on sales
  for each row execute function assign_sale_code();

do $$
declare r record; i integer := 1;
begin
  update sales set sale_code = 'TMP-' || id::text;
  for r in select id from sales order by created_at loop
    update sales set sale_code = 'YTS-' || lpad(i::text, 4, '0') where id = r.id;
    i := i + 1;
  end loop;
end $$;

create unique index if not exists sales_sale_code_key on sales(sale_code);

-- Satışın hangi müşteriye ait olduğunu koda göre de görebilmek için
alter table sales add column if not exists customer_code text;

-- ---------- TEKNİK SERVİS (devices) ----------
alter table devices add column if not exists repair_code text;

create or replace function assign_repair_code()
returns trigger as $$
declare
  next_num integer;
begin
  if new.repair_code is null or new.repair_code = '' then
    select coalesce(min(t.n), 1) into next_num
    from generate_series(1, (select coalesce(count(*), 0) + 1 from devices)) as t(n)
    where not exists (
      select 1 from devices where repair_code = 'YTT-' || lpad(t.n::text, 4, '0')
    );
    new.repair_code := 'YTT-' || lpad(next_num::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_repair_code on devices;
create trigger trg_assign_repair_code
  before insert on devices
  for each row execute function assign_repair_code();

do $$
declare r record; i integer := 1;
begin
  update devices set repair_code = 'TMP-' || id::text;
  for r in select id from devices order by received_date loop
    update devices set repair_code = 'YTT-' || lpad(i::text, 4, '0') where id = r.id;
    i := i + 1;
  end loop;
end $$;

create unique index if not exists devices_repair_code_key on devices(repair_code);

alter table devices add column if not exists customer_code text;

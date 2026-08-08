-- ============================================================
-- ÜRÜN KODU (YTE-0001) — OTOMATİK, TEKRAR KULLANILMAYAN SAYAÇ
-- ============================================================
-- Kod bir kez verildikten sonra ürün silinse bile o numara tekrar
-- kullanılmaz; sayaç hep ileri gider. Bunu PostgreSQL "sequence"
-- ile yapıyoruz — silme işlemi sequence'i geri almaz.

create sequence if not exists product_code_seq start 1;

alter table inventory add column if not exists product_code text;

-- Kodu otomatik atayan fonksiyon
create or replace function assign_product_code()
returns trigger as $$
begin
  if new.product_code is null or new.product_code = '' then
    new.product_code := 'YTE-' || lpad(nextval('product_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_product_code on inventory;
create trigger trg_assign_product_code
  before insert on inventory
  for each row execute function assign_product_code();

-- Mevcut (kodsuz) ürünlere de kod ata
do $$
declare
  r record;
begin
  for r in select id from inventory where product_code is null or product_code = '' order by created_at loop
    update inventory
      set product_code = 'YTE-' || lpad(nextval('product_code_seq')::text, 4, '0')
      where id = r.id;
  end loop;
end $$;

-- Aynı kodun iki kez verilmediğinden emin ol
create unique index if not exists inventory_product_code_key on inventory(product_code);

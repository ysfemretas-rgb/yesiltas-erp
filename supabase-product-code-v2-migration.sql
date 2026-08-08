-- ============================================================
-- ÜRÜN KODU: BOŞLUK DOLDURAN SİSTEM + SATICI BARKODU
-- ============================================================
-- Değişiklik: Artık silinen bir kod (örn. YTE-0003) tekrar kullanılır.
-- Böylece en yüksek kod numarası = toplam ürün adedi olur.

-- 1) Satıcının kendi barkodu için alan (Ülker vb. hazır barkodlar)
alter table inventory add column if not exists supplier_barcode text;
create index if not exists inventory_supplier_barcode_idx on inventory(supplier_barcode);

-- 2) Eski sequence tabanlı sistemi kaldır
drop trigger if exists trg_assign_product_code on inventory;
drop function if exists assign_product_code();
drop sequence if exists product_code_seq;

-- 3) Boştaki en küçük numarayı bulup atayan yeni fonksiyon
create or replace function assign_product_code()
returns trigger as $$
declare
  next_num integer;
begin
  if new.product_code is null or new.product_code = '' then
    -- Kullanılmayan en küçük numarayı bul (1'den başlayarak ilk boşluk)
    select coalesce(min(t.n), 1) into next_num
    from generate_series(
      1,
      (select coalesce(count(*), 0) + 1 from inventory)
    ) as t(n)
    where not exists (
      select 1 from inventory
      where product_code = 'YTE-' || lpad(t.n::text, 4, '0')
    );

    new.product_code := 'YTE-' || lpad(next_num::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_product_code on inventory;
create trigger trg_assign_product_code
  before insert on inventory
  for each row execute function assign_product_code();

-- 4) Mevcut kodları sıfırdan, boşluksuz olarak yeniden numaralandır
do $$
declare
  r record;
  i integer := 1;
begin
  -- Önce geçici benzersiz değerler ver (unique index çakışmasın diye)
  update inventory set product_code = 'TMP-' || id::text;

  for r in select id from inventory order by created_at loop
    update inventory
      set product_code = 'YTE-' || lpad(i::text, 4, '0')
      where id = r.id;
    i := i + 1;
  end loop;
end $$;

create unique index if not exists inventory_product_code_key on inventory(product_code);

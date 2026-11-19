-- ============================================================
-- v60 FİNANS GÜVENLİĞİ: Tedarikçiye genel ödeme tek işlemde (atomik) yapılsın
-- ============================================================
-- Önceden paySupplierDebt() şu adımları AYRI AYRI ağ istekleriyle yapıyordu:
--   1) Birden fazla alışın paid_amount'unu tek tek güncelle (her biri ayrı istek)
--   2) Kalan tutar varsa supplier_payments'a genel ödeme ekle
--   3) Kasaya (transactions) gider yaz
-- Bağlantı adımlar arasında kesilirse (örn. 1. alış güncellendi, 2. alış
-- güncellenemedi, kasa gideri hiç yazılmadı) borç ve kasa tutarsız kalabiliyordu.
-- Bu fonksiyon üçünü de TEK bir veritabanı işleminde (transaction) yapar: biri
-- başarısız olursa HİÇBİRİ kaydedilmez.

create or replace function apply_supplier_payment(
  p_supplier_name text,
  p_amount numeric,
  p_allocations jsonb, -- [{"id": "<purchase uuid>", "new_paid": <number>}, ...]
  p_leftover numeric,
  p_description text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  alloc jsonb;
begin
  if p_allocations is not null then
    for alloc in select * from jsonb_array_elements(p_allocations) loop
      update purchases set paid_amount = (alloc->>'new_paid')::numeric where id = (alloc->>'id')::uuid;
    end loop;
  end if;

  if p_leftover > 0.009 then
    insert into supplier_payments (supplier_name, amount, payment_date, note)
    values (p_supplier_name, p_leftover, current_date, 'Genel ödeme');
  end if;

  insert into transactions (type, category, amount, description, transaction_date, customer, related_table)
  values ('expense', 'Tedarikçi Ödemesi', p_amount, p_description, current_date, p_supplier_name, 'manual');
end;
$$;

grant execute on function apply_supplier_payment(text, numeric, jsonb, numeric, text) to authenticated;

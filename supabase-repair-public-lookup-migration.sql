-- ============================================================
-- MÜŞTERİNİN KENDİ KENDİNE SERVİS SORGULAMASI (QR kod OLMADAN, giriş gerektirmez)
-- ============================================================
-- Müşteri "Servis/Tamir No" (örn. TMR-0007) + telefon numarasının SON 4 HANESİNİ
-- girerek cihazının durumunu görebilsin diye. "Ne zaman hazır olacak" aramalarını
-- azaltmak içindir.
--
-- GÜVENLİK: "devices" tablosuna genel anonim SELECT izni AÇILMIYOR. Bu fonksiyon
-- SADECE servis kodu VE telefonun son 4 hanesi AYNI ANDA eşleşirse tek bir kayıt
-- döndürür (iki bilgiyi birden bilmeyen biri kayıtları tarayamaz). get_repair_public
-- (QR kod ile ID üzerinden) ile aynı veri setini döndürür.

create or replace function get_repair_public_by_code(p_code text, p_last4 text)
returns table (
  id uuid,
  repair_code text,
  customer_code text,
  customer_name text,
  phone1 text,
  device_type text,
  brand text,
  model text,
  complaint text,
  status text,
  cost numeric,
  discount numeric,
  paid_amount numeric,
  remaining_amount numeric,
  payment_type text,
  notes text,
  imei text,
  received_date text,
  completed_date text
)
language sql
security definer
set search_path = public
as $$
  select
    id, repair_code, customer_code, customer_name, phone1, device_type,
    brand, model, complaint, status, cost, discount, paid_amount,
    remaining_amount, payment_type, notes, imei,
    received_date::text, completed_date::text
  from devices
  where upper(trim(repair_code)) = upper(trim(p_code))
    and right(regexp_replace(coalesce(phone1, ''), '[^0-9]', '', 'g'), 4) = trim(p_last4)
  limit 1;
$$;

grant execute on function get_repair_public_by_code(text, text) to anon, authenticated;

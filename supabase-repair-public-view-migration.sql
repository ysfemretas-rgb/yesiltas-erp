-- ============================================================
-- QR KOD İLE GİRİŞSİZ GÖRÜNTÜLEME (SADECE OKUMA)
-- ============================================================
-- Teknik Servis'teki QR kodu telefonla okutunca, giriş yapmadan
-- SADECE o cihazın kaydını gösteren bir sayfa açılabilsin diye.
--
-- ÖNEMLİ — GÜVENLİK: "devices" tablosuna genel anonim SELECT izni
-- AÇILMIYOR (RLS hâlâ tüm satırları koruyor, biri anon key ile tüm
-- listeyi çekemez). Bunun yerine, sadece ELİNDE doğru ID (QR koddaki
-- bağlantı) olan biri için TEK bir kaydı döndüren, güvenli bir
-- fonksiyon tanımlanıyor. Düzenleme/silme bu fonksiyonla mümkün
-- değildir, sadece okuma.

create or replace function get_repair_public(p_id uuid)
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
  where id = p_id
  limit 1;
$$;

grant execute on function get_repair_public(uuid) to anon, authenticated;

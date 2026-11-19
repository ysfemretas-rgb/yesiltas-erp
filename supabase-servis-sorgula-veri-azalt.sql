-- ============================================================
-- v60 GÜVENLİK ONARIMI: /servis-sorgula fonksiyonu gereğinden fazla veri döndürüyordu
-- ============================================================
-- get_repair_public_by_code (servis no + telefonun son 4 hanesiyle, giriş
-- gerektirmeyen sorgulama — /servis-sorgula sayfası) müşteri koduyla, tam
-- telefon numarasıyla, IMEI ve iç notlarla birlikte dönüyordu. Ekranda bu
-- alanlar gösterilmiyor, ama tarayıcıya giden ağ yanıtında bulunuyorlardı.
-- Bu fonksiyon SADECE /servis-sorgula sayfasının gösterdiği alanları döndürecek
-- şekilde sınırlandırıldı.
--
-- NOT: get_repair_public (QR kod ile, id üzerinden sorgulama) BİLEREK
-- değiştirilmedi — o fonksiyonun sayfası (/repair-status/[id]) telefon, IMEI
-- ve notları gerçekten gösteriyor; QR kodu elinde olmayan biri o bağlantıyı
-- tahmin edemez (rastgele UUID).

create or replace function get_repair_public_by_code(p_code text, p_last4 text)
returns table (
  id uuid,
  repair_code text,
  customer_name text,
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
  received_date text,
  completed_date text
)
language sql
security definer
set search_path = public
as $$
  select
    id, repair_code, customer_name, device_type,
    brand, model, complaint, status, cost, discount, paid_amount,
    remaining_amount, payment_type,
    received_date::text, completed_date::text
  from devices
  where upper(trim(repair_code)) = upper(trim(p_code))
    and right(regexp_replace(coalesce(phone1, ''), '[^0-9]', '', 'g'), 4) = trim(p_last4)
  limit 1;
$$;

grant execute on function get_repair_public_by_code(text, text) to anon, authenticated;

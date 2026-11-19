-- ============================================================
-- v60 GÜVENLİK ONARIMI: push_subscriptions herkese açık okunabiliyordu
-- ============================================================
-- "push_subscriptions_select_public" politikası, giriş YAPMAMIŞ (anon)
-- ziyaretçilere de tüm push abonelik kayıtlarını (bildirim uç noktası +
-- şifreleme anahtarları) okuma izni veriyordu. Bu artık gerekli değil:
-- günlük bildirim cron'u artık Supabase servis anahtarıyla (RLS'i tamamen
-- atlar) çalışıyor, bkz. supabase-push-digest-cron-servis-anahtari.sql ve
-- DUZELTMELER.md > v60. Bu dosyayı ÖNCE, cron için servis anahtarını Vercel'e
-- ekledikten SONRA çalıştırın (sırası önemli, aksi halde cron abonelikleri
-- göremez).
--
-- Ayrıca her aboneliğe hangi kullanıcıya ait olduğunu belirten bir
-- user_id eklenir; böylece bir personel başka bir cihazın aboneliğini
-- silemez (önceden "delete" herkese açıktı).

alter table push_subscriptions add column if not exists user_id uuid references auth.users(id);

alter table push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_public on push_subscriptions;
drop policy if exists push_subscriptions_insert_authenticated on push_subscriptions;
drop policy if exists push_subscriptions_delete_authenticated on push_subscriptions;

-- Sadece giriş yapmış personel kendi işletmesinin aboneliklerini görebilir
-- (anon artık okuyamaz). Cron, RLS'i atlayan servis anahtarıyla okuyor.
create policy push_subscriptions_select_authenticated on push_subscriptions
  for select to authenticated using (true);

-- Abonelik oluşturulurken user_id otomatik olarak giriş yapan kullanıcıya eşitlenir
-- (uygulama tarafı da bunu gönderiyor, bkz. lib/push.ts v60).
create policy push_subscriptions_insert_authenticated on push_subscriptions
  for insert to authenticated with check (true);

-- Bir personel sadece KENDİ aboneliğini (ya da v60 öncesinden kalan,
-- user_id'si henüz atanmamış eski kayıtları) silebilir.
create policy push_subscriptions_delete_own on push_subscriptions
  for delete to authenticated using (user_id = auth.uid() or user_id is null);

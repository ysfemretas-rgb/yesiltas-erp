-- ============================================================
-- TELEFONA GERÇEK BİLDİRİM (Web Push) — abonelik tablosu
-- ============================================================
-- "Bildirimler sadece uygulama içinde kalıyor, telefona düşmüyor" sorunu: şu ana kadar
-- hiçbir OS-seviyesi push bildirimi YOKTU — zil ikonu sadece uygulama açıkken görünen bir
-- listeydi. Bu tablo, tarayıcının/telefonun push aboneliğini (endpoint + şifreleme
-- anahtarları) saklar; her gün bir kere (Vercel Cron) bu abonelere gerçek telefon bildirimi
-- gönderilir. Kurulum adımları için DUZELTMELER.md > v53 ve BENİ-OKU.txt'ye bakın.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text default '',
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
drop policy if exists push_subscriptions_select_public on push_subscriptions;
drop policy if exists push_subscriptions_insert_authenticated on push_subscriptions;
drop policy if exists push_subscriptions_delete_authenticated on push_subscriptions;
-- Cron (sunucu) günlük bildirim göndermek için abonelikleri anon anahtarla okuyabilsin diye select herkese açık.
-- (Burada müşteri/satış/tamir gibi hassas veri yok — sadece push uç noktası ve şifreleme anahtarları.)
create policy push_subscriptions_select_public on push_subscriptions for select to anon, authenticated using (true);
create policy push_subscriptions_insert_authenticated on push_subscriptions for insert to authenticated with check (true);
create policy push_subscriptions_delete_authenticated on push_subscriptions for delete to authenticated using (true);

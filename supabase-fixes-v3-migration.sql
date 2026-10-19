-- ============================================================
-- YEŞİLTAŞ ERP — DÜZELTME PAKETİ v3 (BİR KEZ ÇALIŞTIRIN)
-- Firma ayarlarının (IBAN, iskonto limiti vb.) tüm cihazlarda ortak olması için.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;
drop policy if exists app_settings_all_authenticated on app_settings;
create policy app_settings_all_authenticated on app_settings
  for all to authenticated using (true) with check (true);

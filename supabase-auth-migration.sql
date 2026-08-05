-- ============================================================
-- YEŞİLTAŞ ERP — GERÇEK KİMLİK DOĞRULAMA (SUPABASE AUTH) MİGRASYONU
-- ============================================================
-- Bu dosya ücretsiz (Free) Supabase planıyla tam uyumludur.
-- Supabase Auth (email/parola) ve Row Level Security (RLS) Free
-- planda sınırsız ve ücretsizdir; ekstra ödeme gerekmez.
--
-- NE YAPAR:
-- 1) auth.users tablosuna bağlı bir "profiles" tablosu oluşturur
--    (rol ve yetkiler burada tutulur — şifreler ARTIK KOD İÇİNDE
--    veya localStorage'da DEĞİL, Supabase Auth tarafında güvenli
--    şekilde (bcrypt ile) saklanır).
-- 2) Tüm iş tablolarında RLS'i açar ve sadece giriş yapmış
--    (authenticated) kullanıcıların veriye erişebilmesini sağlar.
--    Şu an RLS KAPALI olduğu için anon key'i tarayıcıdan görebilen
--    HERKES verileri doğrudan Supabase REST API üzerinden
--    okuyup/silebilir. Bu migrasyon o açığı kapatır.
--
-- ÇALIŞTIRDIKTAN SONRA YAPMAN GEREKENLER en alttaki NOT bölümünde.
-- ============================================================

-- 1) PROFİL TABLOSU
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null default 'Teknisyen'
    check (role in ('Yönetici','Teknisyen','Kasiyer','Muhasebe','Satışçı')),
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Herkes (giriş yapmış) kendi profilini ve diğer aktif personelin
-- temel bilgisini görebilir (sidebar'da isim/rol göstermek için gerekli).
drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

-- Sadece kendi profilini güncelleyebilir; rol/yetki değişikliği
-- ancak Supabase Dashboard'dan (service role) yapılmalı.
drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- 2) TÜM İŞ TABLOLARINDA RLS'İ AÇ
-- Küçük işletme senaryosu: giriş yapan tüm personel birbirine güveniyor,
-- bu yüzden "authenticated ise erişebilir" kuralı yeterli ve pratik.
-- (Sayfa/menü bazlı yetkilendirme zaten uygulama tarafında permissions
-- alanıyla yapılıyor; bu katman "dışarıdan/anonim erişimi" engeller.)
do $$
declare
  t text;
  tables text[] := array[
    'settings','customers','suppliers','inventory','devices','sales',
    'transactions','consumables','consumable_usage','appointments',
    'device_history','staff','staff_performance','warranties','debts',
    'customer_payments'
  ];
begin
  foreach t in array tables loop
    execute format('alter table if exists %I enable row level security;', t);

    execute format('drop policy if exists %I on %I;', t || '_all_authenticated', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true);',
      t || '_all_authenticated', t
    );
  end loop;
end $$;

-- ============================================================
-- NOT — ZIP'İ ALDIKTAN SONRA YAPMAN GEREKENLER:
--
-- 1) Bu SQL dosyasının tamamını Supabase Dashboard > SQL Editor'de
--    çalıştır (tek seferlik).
--
-- 2) Supabase Dashboard > Authentication > Users > "Add user" ile
--    her personel için bir kullanıcı oluştur. Uygulama kullanıcı adı
--    ile giriş yaptığı için e-posta alanına şu formatı kullan:
--       kullaniciadi@yesiltas.local   (örn: admin@yesiltas.local)
--    Parolayı orada belirlersin (artık kod içinde YAZMIYOR).
--
-- 3) Her kullanıcı için SQL Editor'de profiles tablosuna satır ekle
--    (auth.users tablosundaki id'yi Authentication > Users sayfasından
--    kopyala):
--
--    insert into profiles (id, username, full_name, role, permissions)
--    values (
--      '<AUTH_USERS_TABLOSUNDAKI_UUID>',
--      'admin',
--      'Emre',
--      'Yönetici',
--      array['Tamir','Finans','Envanter','Personel','Raporlar','Ayarlar','Satış','Müşteriler','Randevular','Tedarikçiler']
--    );
--
-- 4) .env.local dosyanda NEXT_PUBLIC_SUPABASE_URL ve
--    NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı (Supabase Dashboard
--    > Project Settings > API'den alınır). Bunlar public/anon
--    key'lerdir, RLS açık olduğu için artık güvenlidir.
-- ============================================================

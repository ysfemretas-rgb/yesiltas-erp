-- ============================================================
-- YEŞİLTAŞ ERP — v6 İSTEĞE BAĞLI GÜVENLİK: PASİF KULLANICILARI VERİTABANI SEVİYESİNDE ENGELLE
-- Önce supabase-fixes-v6-migration.sql çalıştırılmış olmalıdır.
-- Pasife alınan (profiles.is_active = false) bir kullanıcı, oturum anahtarı hâlâ geçerli olsa bile
-- hiçbir tabloya erişemez. ÖNCE yönetici hesabınızla giriş yapıp uygulamanın normal çalıştığını
-- deneyin; sorun olursa en alttaki GERİ ALMA bölümünü çalıştırın.
-- ============================================================

create or replace function app_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from profiles where id = auth.uid()), false)
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'customers','suppliers','inventory','devices','sales','transactions','debts','warranties',
    'appointments','consumables','tasks','staff','fixed_assets','repair_notes','supplier_payments',
    'stock_movements','device_purchases','activity_log','products','app_settings'
  ] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('drop policy if exists %I on %I;', t || '_active_only', t);
      execute format(
        'create policy %I on %I as restrictive for all to authenticated using (app_user_is_active()) with check (app_user_is_active());',
        t || '_active_only', t);
    end if;
  end loop;
end $$;

-- ============================================================
-- GERİ ALMA (sorun olursa çalıştırın)
-- do $$ declare t text; begin
--   foreach t in array array['customers','suppliers','inventory','devices','sales','transactions','debts','warranties','appointments','consumables','tasks','staff','fixed_assets','repair_notes','supplier_payments','stock_movements','device_purchases','activity_log','products','app_settings'] loop
--     if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
--       execute format('drop policy if exists %I on %I;', t || '_active_only', t);
--     end if;
--   end loop;
-- end $$;
-- ============================================================

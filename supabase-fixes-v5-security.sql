-- ============================================================
-- YEŞİLTAŞ ERP — GÜVENLİK SIKILAŞTIRMA (v5, İSTEĞE BAĞLI AMA ÖNERİLİR)
-- Önce supabase-fine-permissions-migration.sql çalıştırılmış olmalıdır.
-- Geri almak için en alttaki "GERİ ALMA" bölümünü çalıştırın.
-- ============================================================

-- 1) KRİTİK AÇIK: Her kullanıcı kendi profilindeki rolü "Yönetici" yapabiliyordu.
--    Bu tetikleyici, yönetici olmayanların rol/izin/aktiflik/kullanıcı adı değiştirmesini engeller.
create or replace function protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not exists (select 1 from profiles where id = auth.uid() and role = 'Yönetici') then
    new.role := old.role;
    new.permissions := old.permissions;
    new.is_active := old.is_active;
    new.username := old.username;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_profile_columns on profiles;
create trigger trg_protect_profile_columns
  before update on profiles
  for each row execute function protect_profile_columns();

-- 2) Personel tablosu ve firma ayarları: sadece Yönetici yazabilir (herkes okuyabilir)
do $$
declare t text;
begin
  foreach t in array array['staff','app_settings'] loop
    execute format('drop policy if exists %I on %I;', t || '_insert_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_update_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_all_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_write_manager', t);
    execute format('drop policy if exists %I on %I;', t || '_select_authenticated', t);
    execute format('create policy %I on %I for select to authenticated using (true);', t || '_select_authenticated', t);
    execute format(
      'create policy %I on %I for all to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici'')) with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici''));',
      t || '_write_manager', t);
  end loop;
end $$;

-- 3) Kasa kayıtlarını DÜZENLEME (güncelleme): Teknisyen yapamasın.
--    (Ekleme açık kalır: satış ve tamir kasaya otomatik kayıt yazar.)
drop policy if exists transactions_update_authenticated on transactions;
drop policy if exists transactions_update_roles on transactions;
create policy transactions_update_roles on transactions
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Yönetici','Muhasebe','Kasiyer')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('Yönetici','Muhasebe','Kasiyer')));

-- ============================================================
-- GERİ ALMA (sorun olursa çalıştırın)
-- drop trigger if exists trg_protect_profile_columns on profiles;
-- drop policy if exists staff_write_manager on staff;
-- drop policy if exists app_settings_write_manager on app_settings;
-- create policy staff_all_authenticated on staff for all to authenticated using (true) with check (true);
-- create policy app_settings_all_authenticated on app_settings for all to authenticated using (true) with check (true);
-- drop policy if exists transactions_update_roles on transactions;
-- create policy transactions_update_authenticated on transactions for update to authenticated using (true) with check (true);
-- ============================================================

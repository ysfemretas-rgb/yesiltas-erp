-- ============================================================
-- SAYFA İÇİ İNCE YETKİLENDİRME: SADECE YÖNETİCİ SİLEBİLİR
-- ============================================================
-- Şu ana kadar, giriş yapmış HERKES (hangi rolde olursa olsun) her tabloda
-- her şeyi silebiliyordu. Bu migration, SİLME işlemini sadece "Yönetici"
-- rolündeki kullanıcılarla sınırlıyor — görüntüleme/ekleme/güncelleme
-- herkese açık kalıyor (teknisyenler tamir durumunu değiştirebilsin diye).
--
-- Önemli: Bu kontrol veritabanı seviyesinde (RLS) yapılıyor, yani sadece
-- arayüzdeki bir düğmeyi gizlemek değil — bir teknisyen tarayıcı konsolundan
-- doğrudan Supabase'e istek atsa bile silme işlemi reddedilir.

do $$
declare
  t text;
  tables text[] := array[
    'suppliers','warranties','appointments','customers','debts',
    'transactions','inventory','consumables','staff','sales','devices','tasks'
  ];
begin
  foreach t in array tables loop
    -- Eski "hepsini yapabilir" kuralını kaldır
    execute format('drop policy if exists %I on %I;', t || '_all_authenticated', t);

    -- Görüntüleme, ekleme, güncelleme: herkes (giriş yapmış personel)
    execute format('drop policy if exists %I on %I;', t || '_select_authenticated', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true);',
      t || '_select_authenticated', t
    );

    execute format('drop policy if exists %I on %I;', t || '_insert_authenticated', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (true);',
      t || '_insert_authenticated', t
    );

    execute format('drop policy if exists %I on %I;', t || '_update_authenticated', t);
    execute format(
      'create policy %I on %I for update to authenticated using (true) with check (true);',
      t || '_update_authenticated', t
    );

    -- Silme: sadece Yönetici rolü
    execute format('drop policy if exists %I on %I;', t || '_delete_manager_only', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici''));',
      t || '_delete_manager_only', t
    );
  end loop;
end $$;

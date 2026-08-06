-- ============================================================
-- SİLME SORUNU TEŞHİS VE DÜZELTME
-- ============================================================

-- 1) ÖNCE BUNU ÇALIŞTIR: Kendi rolünü kontrol et.
-- Sonuçta "role" sütunu tam olarak "Yönetici" yazmalı (büyük/küçük harf
-- ve Türkçe karakterler dahil birebir aynı olmalı). Başka bir şey
-- yazıyorsa (örn. "Teknisyen" ya da boş), silme işlemleri reddedilir.
select username, full_name, role, is_active from profiles where id = auth.uid();

-- 2) Eğer yukarıdaki sorguda role "Yönetici" DEĞİLSE, aşağıdaki satırı
-- kendi kullanıcı adınla güncelleyip çalıştır (başındaki -- işaretini kaldır):
-- update profiles set role = 'Yönetici' where username = 'admin';

-- 3) Silme kurallarını (RLS policy) tüm tablolarda güvenli şekilde
-- yeniden oluştur — daha önce çalıştırdıysan tekrar çalıştırman zararsız.
do $$
declare
  t text;
  tables text[] := array[
    'suppliers','warranties','appointments','customers','debts',
    'transactions','inventory','consumables','staff','sales','devices',
    'tasks','products','repair_notes'
  ];
begin
  foreach t in array tables loop
    if to_regclass(t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on %I;', t || '_delete_manager_only', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici''));',
      t || '_delete_manager_only', t
    );
  end loop;
end $$;

-- 4) Kontrol: bu tabloların hepsinde bir "delete" policy'si olmalı.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and cmd = 'DELETE'
order by tablename;

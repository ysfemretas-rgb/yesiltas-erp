-- ============================================================
-- YEŞİLTAŞ ERP — PAKET v6 (BİR KEZ ÇALIŞTIRIN) — ZORUNLU
-- Önce v2, v3, v4, v5 migrasyonları çalıştırılmış olmalıdır.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- 1) KRİTİK: Kullanıcıların kendi rolünü "Yönetici" yapmasını engelle.
--    (Önceden bu koruma isteğe bağlı güvenlik dosyasındaydı; artık zorunlu pakette.)
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

-- 2) Stok: yetersiz stokta işlemi REDDEDEN fonksiyon (satışlar bunu kullanır).
--    İki kişi aynı anda son ürünü satamaz.
create or replace function adjust_inventory_quantity_strict(p_id uuid, p_delta integer)
returns integer
language plpgsql
security invoker
as $$
declare new_qty integer;
begin
  update inventory
     set quantity = coalesce(quantity, 0) + p_delta
   where id = p_id
     and coalesce(quantity, 0) + p_delta >= 0
  returning quantity into new_qty;
  if new_qty is null then
    if exists (select 1 from inventory where id = p_id) then
      raise exception 'INSUFFICIENT_STOCK';
    else
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
  end if;
  return new_qty;
end;
$$;

-- 3) QR ile girişsiz tamir sayfası: kişisel veri azaltıldı.
--    Aynı sütunlar döndürülür (sayfa bozulmaz) ama telefon/ad maskelenir, IMEI kısaltılır,
--    iç notlar, müşteri kodu, indirim ve ödeme türü gizlenir.
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
    d.id,
    d.repair_code,
    ''::text,
    -- "Ahmet Yılmaz" -> "Ahmet Y."
    case
      when position(' ' in trim(coalesce(d.customer_name, ''))) > 0
        then split_part(trim(d.customer_name), ' ', 1) || ' ' || left(split_part(trim(d.customer_name), ' ', 2), 1) || '.'
      else trim(coalesce(d.customer_name, ''))
    end,
    -- telefon: sadece son 2 hane
    case when length(regexp_replace(coalesce(d.phone1, ''), '\D', '', 'g')) >= 4
      then '*** *** ** ' || right(regexp_replace(d.phone1, '\D', '', 'g'), 2)
      else '' end,
    d.device_type, d.brand, d.model, d.complaint, d.status,
    d.cost,
    0::numeric,
    d.paid_amount,
    d.remaining_amount,
    ''::text,
    ''::text,
    -- IMEI: sadece son 4 hane
    case when length(coalesce(d.imei, '')) >= 6 then '***' || right(d.imei, 4) else '' end,
    d.received_date::text,
    d.completed_date::text
  from devices d
  where d.id = p_id
  limit 1;
$$;
grant execute on function get_repair_public(uuid) to anon, authenticated;

-- 4) Denetim kaydı: personel sadece ekleyebilir ve okuyabilir; değiştiremez/silemez.
drop policy if exists activity_log_all_authenticated on activity_log;
drop policy if exists activity_log_select_authenticated on activity_log;
drop policy if exists activity_log_insert_authenticated on activity_log;
drop policy if exists activity_log_delete_manager on activity_log;
create policy activity_log_select_authenticated on activity_log for select to authenticated using (true);
create policy activity_log_insert_authenticated on activity_log for insert to authenticated with check (true);
create policy activity_log_delete_manager on activity_log for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

-- 5) Stok hareketleri: eklenir/okunur, değiştirilemez; silme sadece Yönetici.
drop policy if exists stock_movements_all_authenticated on stock_movements;
drop policy if exists stock_movements_select_authenticated on stock_movements;
drop policy if exists stock_movements_insert_authenticated on stock_movements;
drop policy if exists stock_movements_delete_manager on stock_movements;
create policy stock_movements_select_authenticated on stock_movements for select to authenticated using (true);
create policy stock_movements_insert_authenticated on stock_movements for insert to authenticated with check (true);
create policy stock_movements_delete_manager on stock_movements for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

-- 6) Tedarikçi ödemeleri ve cihaz alım belgeleri: ekleme/okuma herkes; düzenleme ve silme Yönetici.
do $$
declare t text;
begin
  foreach t in array array['supplier_payments','device_purchases'] loop
    execute format('drop policy if exists %I on %I;', t || '_all_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_select_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_insert_authenticated', t);
    execute format('drop policy if exists %I on %I;', t || '_modify_manager', t);
    execute format('create policy %I on %I for select to authenticated using (true);', t || '_select_authenticated', t);
    execute format('create policy %I on %I for insert to authenticated with check (true);', t || '_insert_authenticated', t);
    execute format(
      'create policy %I on %I for update to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici'')) with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici''));',
      t || '_modify_manager', t);
    -- silme
    execute format('drop policy if exists %I on %I;', t || '_delete_manager', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = ''Yönetici''));',
      t || '_delete_manager', t);
  end loop;
end $$;

-- 7) Cihaz alım belgeleri: T.C. kimlik no kolonu artık kullanılmıyor (veritabanına yazılmıyor), kaldır.
alter table device_purchases drop column if exists seller_id_no;
-- Belge numarası benzersiz olsun; ürün bağlantısı geçerli ürüne işaret etsin
create unique index if not exists device_purchases_doc_code_key on device_purchases(doc_code) where doc_code is not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'device_purchases_product_fk') then
    alter table device_purchases
      add constraint device_purchases_product_fk foreign key (product_id) references inventory(id) on delete set null;
  end if;
exception when others then
  raise notice 'device_purchases FK eklenemedi: %', sqlerrm;
end $$;

-- 8) Ürün resimleri deposu: yalnızca resim dosyası ve en fazla 5 MB; güncelleme/silme sadece Yönetici.
do $$
begin
  update storage.buckets
     set file_size_limit = 5242880,
         allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
   where id = 'product-images';
exception when others then
  raise notice 'Bucket kısıtları uygulanamadı: %', sqlerrm;
end $$;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;
drop policy if exists "product_images_update_manager" on storage.objects;
drop policy if exists "product_images_delete_manager" on storage.objects;
create policy "product_images_update_manager" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));
create policy "product_images_delete_manager" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici'));

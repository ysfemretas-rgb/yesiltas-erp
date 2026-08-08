-- ============================================================
-- ÜRÜN FOTOĞRAFLARI İÇİN DEPOLAMA ALANI
-- ============================================================
-- Telefondan doğrudan fotoğraf çekip yükleyebilmek için Supabase'de
-- bir "bucket" (dosya deposu) oluşturuyoruz.
--
-- NOT: Aşağıdaki SQL'i çalıştırmadan önce Supabase panelinden de
-- yapabilirsiniz: Storage > New bucket > isim: "product-images",
-- "Public bucket" seçeneğini AÇIK bırakın. SQL yolu da aynı işi yapar.

-- 1) Bucket'ı oluştur (herkese açık okuma — resimlerin görünmesi için gerekli)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 2) Giriş yapmış personel resim yükleyebilsin
drop policy if exists "product_images_upload" on storage.objects;
create policy "product_images_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

-- 3) Giriş yapmış personel resim güncelleyebilsin/silebilsin
drop policy if exists "product_images_update" on storage.objects;
create policy "product_images_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_delete" on storage.objects;
create policy "product_images_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- 4) Resimler herkese açık görünsün (uygulamada gösterilebilmesi için)
drop policy if exists "product_images_read" on storage.objects;
create policy "product_images_read"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

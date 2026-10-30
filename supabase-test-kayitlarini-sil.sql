-- ============================================================
-- YEŞİLTAŞ ERP — SADECE "TEST" KAYITLARINI SİL (tek komut, güvenli deneme modlu)
--
-- Neye dokunur: adı "TEST" ile başlayan (kelime başında) müşteri, tedarikçi, ürün, ödeme/tahsilat başlığı
--   ve bunlara BAĞLI satış, tamir, alış, borç, stok hareketi, kasa kaydı, indirim kaydı.
-- Neye dokunmaz: adında "TEST" kelimesi geçmeyen hiçbir kayıt, kullanıcılar, ayarlar, aktivite logu.
--
-- KULLANIM (Supabase uyarı penceresinde "Run without RLS"):
--  1) OLDUĞU GİBİ çalıştırın (aşağıda dry := true). "ERROR: ÖNİZLEME — HİÇBİR ŞEY SİLİNMEDİ" ve silinecek
--     kayıt sayıları görünür. Bu hata beklenen sonuçtur: işlem bilerek geri alınır.
--  2) Sayılar mantıklıysa aşağıdaki "dry boolean := true;" satırını "dry boolean := false;" yapıp tekrar çalıştırın.
--     "Success" görünürse silindi.
-- Betik TEK komuttur: ne begin/commit ne de başka bir satıra bağımlıdır.
-- Çalıştırmadan önce uygulamada Ayarlar > Yedekle ile yedek alın.
-- ============================================================
do $$
declare
  dry boolean := true;   -- <<< true = DENEME (hiçbir şey silinmez)   false = GERÇEKTEN SİL
  n int;
  netv numeric := 0;
  rep text := '';
  pur_ids uuid[] := '{}';
  pur_codes text[] := '{}';
begin
  -- Aranan desen: kelime başında TEST (TEST ÜRÜN, TEST MÜŞTERİ, TEST TEDARİKÇİ, TEST FATURA ...)
  create temp table t_cust on commit drop as select id, customer_code from customers where name ~* '\mtest';
  create temp table t_inv  on commit drop as select id from inventory where name ~* '\mtest' or coalesce(supplier,'') ~* '\mtest';
  create temp table t_sale on commit drop as
    select id from sales where coalesce(customer_name,'') ~* '\mtest' or customer_id in (select id from t_cust) or customer_code in (select customer_code from t_cust where customer_code is not null);
  create temp table t_dev  on commit drop as
    select id from devices where coalesce(customer_name,'') ~* '\mtest' or customer_code in (select customer_code from t_cust where customer_code is not null);

  -- Alışlar (TEST tedarikçisi / TEST ürünü içeren)
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'purchases' and column_name in ('party_name','purchase_code','items')) = 3 then
    select coalesce(array_agg(id), '{}'), coalesce(array_agg(purchase_code), '{}') into pur_ids, pur_codes
      from purchases where coalesce(party_name,'') ~* '\mtest' or items::text ~* '"name":\s*"test';
  end if;

  -- 1) Kasa kayıtları: TEST adı/açıklaması ya da TEST satış/tamir/alışına bağlı olanlar
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name in ('customer','description','related_table','related_id')) = 4 then
    create temp table t_tx on commit drop as
      select id, type, amount from transactions
      where coalesce(customer,'') ~* '\mtest' or coalesce(description,'') ~* '\mtest'
         or (related_table = 'sale' and related_id::text in (select id::text from t_sale))
         or (related_table in ('repair','device') and related_id::text in (select id::text from t_dev))
         or exists (select 1 from unnest(pur_codes) c where transactions.description like '%' || c || '%');
    select coalesce(sum(case when lower(type) in ('gelir','income') then amount else -amount end), 0) into netv from t_tx;
    delete from transactions where id in (select id from t_tx);
    get diagnostics n = row_count; rep := rep || format(E'transactions (kasa): %s\n', n);
    rep := rep || format(E'KASA NET ETKİSİ (TL, gelir - gider): %s\n', netv);
  else rep := rep || E'transactions: ATLANDI (sütun yok)\n'; end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'stock_movements' and column_name in ('product_name','product_id')) = 2 then
    delete from stock_movements where coalesce(product_name,'') ~* '\mtest' or product_id in (select id from t_inv);
    get diagnostics n = row_count; rep := rep || format(E'stock_movements: %s\n', n);
  else rep := rep || E'stock_movements: ATLANDI\n'; end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'settlement_discounts' and column_name = 'party_name') = 1 then
    delete from settlement_discounts where coalesce(party_name,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'settlement_discounts: %s\n', n);
  else rep := rep || E'settlement_discounts: ATLANDI\n'; end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'supplier_payments' and column_name = 'supplier_name') = 1 then
    delete from supplier_payments where coalesce(supplier_name,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'supplier_payments: %s\n', n);
  else rep := rep || E'supplier_payments: ATLANDI\n'; end if;

  -- 2) Borçlar ve onlara bağlı kayıtlar
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'debts' and column_name in ('customer_id','source_id')) = 2 then
    delete from debts where customer_id in (select id from t_cust) or source_id::text in (select id::text from t_sale union select id::text from t_dev);
    get diagnostics n = row_count; rep := rep || format(E'debts: %s\n', n);
  else rep := rep || E'debts: ATLANDI\n'; end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'warranties' and column_name in ('sale_id','customer_name')) = 2 then
    delete from warranties where sale_id in (select id from t_sale) or coalesce(customer_name,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'warranties: %s\n', n);
  else rep := rep || E'warranties: ATLANDI\n'; end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'repair_notes' and column_name = 'repair_id') = 1 then
    delete from repair_notes where repair_id in (select id from t_dev);
    get diagnostics n = row_count; rep := rep || format(E'repair_notes: %s\n', n);
  end if;

  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'appointments' and column_name = 'customer_name') = 1 then
    delete from appointments where coalesce(customer_name,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'appointments: %s\n', n);
  end if;

  -- 3) Satış, tamir, alış
  delete from sales where id in (select id from t_sale);
  get diagnostics n = row_count; rep := rep || format(E'sales (satis): %s\n', n);
  delete from devices where id in (select id from t_dev);
  get diagnostics n = row_count; rep := rep || format(E'devices (tamir): %s\n', n);
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'purchases' and column_name = 'party_name') = 1 then
    delete from purchases where id = any(pur_ids);
    get diagnostics n = row_count; rep := rep || format(E'purchases (alis): %s\n', n);
  end if;
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'device_purchases' and column_name in ('seller_name','device_name')) = 2 then
    delete from device_purchases where coalesce(seller_name,'') ~* '\mtest' or coalesce(device_name,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'device_purchases: %s\n', n);
  end if;

  -- 4) Kasa yardımcıları
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'scheduled_payments' and column_name = 'title') = 1 then
    delete from scheduled_payments where coalesce(title,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'scheduled_payments (odeme takvimi): %s\n', n);
  end if;
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'cash_counts' and column_name = 'note') = 1 then
    delete from cash_counts where coalesce(note,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'cash_counts (kasa sayimi): %s\n', n);
  end if;
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'tasks' and column_name = 'title') = 1 then
    delete from tasks where coalesce(title,'') ~* '\mtest';
    get diagnostics n = row_count; rep := rep || format(E'tasks: %s\n', n);
  end if;

  -- 5) Ana kayıtlar
  delete from inventory where id in (select id from t_inv);
  get diagnostics n = row_count; rep := rep || format(E'inventory (urun): %s\n', n);
  delete from customers where id in (select id from t_cust);
  get diagnostics n = row_count; rep := rep || format(E'customers (musteri): %s\n', n);
  delete from suppliers where name ~* '\mtest';
  get diagnostics n = row_count; rep := rep || format(E'suppliers (tedarikci): %s\n', n);

  if dry then
    -- Hata vermek BİLEREK: tüm silmeler geri alınır, silinecek sayılar mesajda görünür.
    raise exception E'ONIZLEME - HICBIR SEY SILINMEDI. Silinecek kayit sayilari:\n%\nGercekten silmek icin "dry boolean := true" satirini "false" yapip tekrar calistirin.', rep;
  else
    raise notice E'SILINDI:\n%', rep;
  end if;
end $$;

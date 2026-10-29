-- ============================================================
-- YEŞİLTAŞ ERP — SADECE "TEST" KAYITLARINI SİL (güvenli, geri alınabilir deneme modlu)
--
-- Neye dokunur: adı "TEST" ile başlayan/kelime olarak içeren müşteri, tedarikçi, ürün, ödeme/tahsilat başlığı
--   ve bunlara BAĞLI satış, tamir, alış, borç, stok hareketi, kasa kaydı, indirim kaydı.
-- Neye dokunmaz: adında "TEST" kelimesi geçmeyen hiçbir kayıt, kullanıcılar, ayarlar, aktivite logu.
--
-- KULLANIM:
--  1) Dosyayı OLDUĞU GİBİ çalıştırın. En altta rollback olduğu için HİÇBİR ŞEY kalıcı silinmez;
--     sadece "tablo / silinecek adet" listesini görürsünüz. Sayıları kontrol edin.
--  2) Sayılar mantıklıysa EN ALTTAKİ "rollback;" satırını "commit;" yapıp tekrar çalıştırın. O zaman silinir.
-- Çalıştırmadan önce uygulamada Ayarlar > Yedekle ile yedek alın.
-- ============================================================
begin;

-- Aranan desen: kelime başında TEST (TEST ÜRÜN, TEST MÜŞTERİ, TEST TEDARİKÇİ, TEST FATURA ...)
create temp table t_cust    on commit drop as select id, customer_code from customers where name ~* '\mtest';
create temp table t_inv     on commit drop as select id from inventory where name ~* '\mtest' or coalesce(supplier,'') ~* '\mtest';
create temp table t_sale    on commit drop as
  select id from sales where coalesce(customer_name,'') ~* '\mtest' or customer_id in (select id from t_cust) or customer_code in (select customer_code from t_cust where customer_code is not null);
create temp table t_dev     on commit drop as
  select id from devices where coalesce(customer_name,'') ~* '\mtest' or customer_code in (select customer_code from t_cust where customer_code is not null);
create temp table t_report (tablo text, adet int) on commit drop;

do $$
declare
  n int;
  pur_ids uuid[];
  pur_codes text[];
begin
  -- Alışlar (TEST tedarikçisi / TEST ürünü içeren)
  if to_regclass('public.purchases') is not null then
    select coalesce(array_agg(id), '{}'), coalesce(array_agg(purchase_code), '{}') into pur_ids, pur_codes
      from purchases where coalesce(party_name,'') ~* '\mtest' or items::text ~* '"name":\s*"test';
  else
    pur_ids := '{}'; pur_codes := '{}';
  end if;

  -- 1) Kasa kayıtları: TEST adı/açıklaması ya da TEST satış/tamir/alışına bağlı olanlar
  delete from transactions where coalesce(customer,'') ~* '\mtest' or coalesce(description,'') ~* '\mtest'
     or (source = 'sale' and source_id::text in (select id::text from t_sale))
     or (source in ('repair','device') and source_id::text in (select id::text from t_dev))
     or exists (select 1 from unnest(pur_codes) c where transactions.description like '%' || c || '%');
  get diagnostics n = row_count; insert into t_report values ('transactions (kasa)', n);

  if to_regclass('public.stock_movements') is not null then
    delete from stock_movements where coalesce(product_name,'') ~* '\mtest' or product_id in (select id from t_inv);
    get diagnostics n = row_count; insert into t_report values ('stock_movements', n);
  end if;
  if to_regclass('public.settlement_discounts') is not null then
    delete from settlement_discounts where coalesce(party_name,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('settlement_discounts', n);
  end if;
  if to_regclass('public.supplier_payments') is not null then
    delete from supplier_payments where coalesce(supplier_name,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('supplier_payments', n);
  end if;

  -- 2) Borçlar ve onlara bağlı kayıtlar
  delete from debts where customer_id in (select id from t_cust) or source_id::text in (select id::text from t_sale union select id::text from t_dev);
  get diagnostics n = row_count; insert into t_report values ('debts', n);
  delete from warranties where sale_id in (select id from t_sale) or coalesce(customer_name,'') ~* '\mtest';
  get diagnostics n = row_count; insert into t_report values ('warranties', n);
  if to_regclass('public.repair_notes') is not null then
    delete from repair_notes where repair_id in (select id from t_dev);
    get diagnostics n = row_count; insert into t_report values ('repair_notes', n);
  end if;
  delete from appointments where coalesce(customer_name,'') ~* '\mtest';
  get diagnostics n = row_count; insert into t_report values ('appointments', n);

  -- 3) Satış, tamir, alış
  delete from sales where id in (select id from t_sale);
  get diagnostics n = row_count; insert into t_report values ('sales (satış)', n);
  delete from devices where id in (select id from t_dev);
  get diagnostics n = row_count; insert into t_report values ('devices (tamir)', n);
  if to_regclass('public.purchases') is not null then
    delete from purchases where id = any(pur_ids);
    get diagnostics n = row_count; insert into t_report values ('purchases (alış)', n);
  end if;
  if to_regclass('public.device_purchases') is not null then
    delete from device_purchases where coalesce(seller_name,'') ~* '\mtest' or coalesce(device_name,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('device_purchases', n);
  end if;

  -- 4) Kasa yardımcıları
  if to_regclass('public.scheduled_payments') is not null then
    delete from scheduled_payments where coalesce(title,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('scheduled_payments (ödeme takvimi)', n);
  end if;
  if to_regclass('public.cash_counts') is not null then
    delete from cash_counts where coalesce(note,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('cash_counts (kasa sayımı)', n);
  end if;
  if to_regclass('public.tasks') is not null then
    delete from tasks where coalesce(title,'') ~* '\mtest';
    get diagnostics n = row_count; insert into t_report values ('tasks', n);
  end if;

  -- 5) Ana kayıtlar
  delete from inventory where id in (select id from t_inv);
  get diagnostics n = row_count; insert into t_report values ('inventory (ürün)', n);
  delete from customers where id in (select id from t_cust);
  get diagnostics n = row_count; insert into t_report values ('customers (müşteri)', n);
  delete from suppliers where name ~* '\mtest';
  get diagnostics n = row_count; insert into t_report values ('suppliers (tedarikçi)', n);
end $$;

-- Silinecek (deneme modunda: silinmiş gibi sayılan) kayıt sayıları:
select tablo, adet as "silinecek adet" from t_report order by tablo;

-- DENEME MODU: aşağıdaki satır bırakılırsa hiçbir şey kalıcı silinmez.
-- Gerçekten silmek için "rollback;" yerine "commit;" yazıp dosyayı tekrar çalıştırın.
rollback;

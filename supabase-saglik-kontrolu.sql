-- ============================================================
-- YEŞİLTAŞ ERP — VERİTABANI SAĞLIK KONTROLÜ (sadece okur, hiçbir şeyi değiştirmez)
-- Supabase > SQL Editor'de çalıştırın. Sonuçta "❌ EKSİK" yazan satırlar için ilgili SQL dosyası
-- (MIGRATION-SIRASI.md) henüz çalıştırılmamış demektir.
-- ============================================================
with checks as (
  -- Tablolar
  select 'tablo: ' || v.t as item, to_regclass('public.' || v.t) is not null as ok
  from (values ('purchases'),('cash_counts'),('scheduled_payments'),('stock_movements'),('supplier_payments'),('device_purchases'),('app_settings'),('activity_log'),('settlement_discounts'),('profiles')) as v(t)

  union all
  -- Sütunlar
  select 'sütun: ' || v.t || '.' || v.c,
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = v.t and column_name = v.c)
  from (values
    ('sales','customer_id'),('sales','payments'),('sales','installment_plan'),('sales','refunds'),('sales','trade_in'),('sales','extra_cost'),('sales','extra_cost_note'),
    ('customers','birth_date'),
    ('supplier_payments','supplier_name'),('supplier_payments','amount'),('supplier_payments','payment_date'),('supplier_payments','note'),
    ('stock_movements','product_id'),('stock_movements','product_name'),('stock_movements','delta'),('stock_movements','reason'),('stock_movements','user_name'),
    ('purchases','purchase_code'),('purchases','kind'),('purchases','party_name'),('purchases','items'),('purchases','total_try'),('purchases','paid_amount'),
    ('cash_counts','count_date'),('cash_counts','counted_cash'),('cash_counts','expected_cash'),
    ('scheduled_payments','title'),('scheduled_payments','due_date'),('scheduled_payments','status'),
    ('device_purchases','seller_name'),('device_purchases','device_name'),
    ('settlement_discounts','kind'),('settlement_discounts','party_name'),('settlement_discounts','amount'),
    ('inventory','imei'),('inventory','total_purchased_qty'),
    ('fixed_assets','supplier'),('devices','parts'),('devices','parts_cost'),('devices','technician'),('devices','signature'),('devices','stage'),('devices','estimated_delivery'),('devices','qc'),('devices','quote')
  ) as v(t,c)

  union all
  -- Fonksiyonlar
  select 'fonksiyon: ' || v.f,
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = v.f)
  from (values ('adjust_inventory_quantity'),('get_repair_public'),('protect_profile_columns'),('assign_sale_code')) as v(f)

  union all
  -- Sütun TİPLERİ (aynı adlı eski sütun farklı tipteyse kayıt başarısız olur)
  select 'tip: ' || v.t || '.' || v.c || ' = ' || v.ty,
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = v.t and column_name = v.c and data_type = v.ty)
  from (values
    ('sales','payments','jsonb'),('sales','installment_plan','jsonb'),('sales','refunds','jsonb'),('sales','trade_in','jsonb'),('sales','extra_cost','numeric'),
    ('devices','parts','jsonb'),('devices','qc','jsonb'),('devices','quote','jsonb'),('devices','parts_cost','numeric'),('devices','estimated_delivery','date'),
    ('stock_movements','product_id','uuid'),('stock_movements','product_name','text'),('stock_movements','delta','integer'),('stock_movements','reason','text'),('stock_movements','user_name','text'),('stock_movements','created_at','timestamp with time zone'),
    ('inventory','imei','text'),('inventory','total_purchased_qty','numeric'),('customers','birth_date','date'),('purchases','items','jsonb')
  ) as v(t,c,ty)

  union all
  select 'tetikleyici: trg_protect_profile_columns (rol yükseltme koruması)',
         exists (select 1 from pg_trigger where tgname = 'trg_protect_profile_columns')

  union all
  select 'QR sayfası kişisel veri maskeleme (v6) uygulanmış',
         exists (select 1 from pg_proc p where p.proname = 'get_repair_public' and pg_get_functiondef(p.oid) like '%split_part%')

  union all
  -- Yetki politikaları
  select 'politika: ' || v.p,
         exists (select 1 from pg_policies where policyname = v.p)
  from (values ('activity_log_delete_manager'),('stock_movements_insert_authenticated'),('purchases_select_authenticated'),('cash_counts_select_authenticated'),('scheduled_payments_select_authenticated')) as v(p)
)
select item as kontrol, case when ok then '✅ var' else '❌ EKSİK' end as durum
from checks
order by ok, item;

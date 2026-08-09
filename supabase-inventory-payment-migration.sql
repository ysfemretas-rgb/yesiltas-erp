-- ============================================================
-- ENVANTER ALIŞLARI İÇİN ÖDEME DURUMU (TEDARİKÇİ BORCU OTOMATİK HESAPLANSIN)
-- ============================================================
-- Envanterde bir ürünü eklerken/düzenlerken tedarikçiye o alış için
-- ödeme yapılıp yapılmadığı burada tutulur. Tedarikçiler sayfasındaki
-- "borcumuz" ve "sipariş sayısı" artık elle girilmiyor, bu veriden
-- otomatik hesaplanıyor.
alter table inventory add column if not exists payment_status text default 'unpaid';
alter table inventory drop constraint if exists inventory_payment_status_check;
alter table inventory add constraint inventory_payment_status_check
  check (payment_status in ('paid','unpaid','partial'));

alter table inventory add column if not exists paid_amount numeric default 0;

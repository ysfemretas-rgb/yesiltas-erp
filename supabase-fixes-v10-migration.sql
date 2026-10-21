-- ============================================================
-- YEŞİLTAŞ ERP — v10 (BİR KEZ ÇALIŞTIRIN) — Taksit planı sütunu düzeltmesi
-- Test sırasında bulundu: sales tablosunda eskiden "installments" adlı bir TAM SAYI sütunu vardı;
-- taksit planı (liste) buraya yazılamadığı için taksitli satış kaydedilemiyordu.
-- Taksit planı artık ayrı bir sütunda tutulur. Tekrar çalıştırmak güvenlidir.
-- ============================================================
alter table sales add column if not exists installment_plan jsonb default '[]'::jsonb;

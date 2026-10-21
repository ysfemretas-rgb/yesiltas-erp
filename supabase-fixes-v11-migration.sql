-- ============================================================
-- YEŞİLTAŞ ERP — v11 (BİR KEZ ÇALIŞTIRIN) — Demirbaşlara tedarikçi bilgisi
-- Demirbaşın nereden alındığı kaydedilir; ileride aynı üründen tekrar alırken o tedarikçiye WhatsApp'tan
-- fiyat/stok sorulabilir. Tekrar çalıştırmak güvenlidir.
-- ============================================================
alter table fixed_assets add column if not exists supplier text default '';

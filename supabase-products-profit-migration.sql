-- ============================================================
-- ÜRÜNLERE ALIŞ FİYATI EKLEME (Gerçek Kâr Hesabı İçin)
-- ============================================================
alter table products add column if not exists purchase_price numeric default 0;

-- Satış kalemlerinde de o anki alış fiyatının "anlık görüntüsünü" (snapshot)
-- saklayabilmek için (ürünün fiyatı sonradan değişse bile geçmiş satışın
-- kârı doğru hesaplanabilsin diye) items JSON alanı zaten yeterli — ek bir
-- sütuna gerek yok, uygulama tarafında ekleniyor.

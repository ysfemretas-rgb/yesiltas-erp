-- ============================================================
-- "YEDEK ALDIM AMA HALA YEDEK AL DİYOR" — app_settings yazma izni onarımı
-- ============================================================
-- v5 güvenlik güncellemesi (supabase-fixes-v5-security.sql), app_settings tablosuna
-- yazmayı (ekleme/güncelleme) SADECE Yönetici rolüyle sınırlamıştı. O sırada bu tablo
-- yalnızca "firma ayarları" için kullanılıyordu. v48'den beri bu tablo, son yedek tarihi,
-- stok uyarı istisnaları, "Çıkanlar" listesi gibi PAYLAŞILAN uygulama durumları için de
-- kullanılıyor ve bunları her personelin (sadece Yönetici değil) yazabilmesi gerekiyor.
-- Bu betik, app_settings yazma iznini tekrar TÜM giriş yapmış kullanıcılara açar
-- (personel/staff tablosu Yönetici kısıtlaması DEĞİŞMEDEN kalır).
drop policy if exists app_settings_write_manager on app_settings;
drop policy if exists app_settings_select_authenticated on app_settings;
drop policy if exists app_settings_all_authenticated on app_settings;
create policy app_settings_all_authenticated on app_settings for all to authenticated using (true) with check (true);

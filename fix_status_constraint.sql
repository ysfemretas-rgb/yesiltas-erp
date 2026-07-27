-- devices tablosundaki status CHECK constraint'ini kaldır
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Eğer başka constraint adları varsa onları da kaldır
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check1;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check2;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check3;

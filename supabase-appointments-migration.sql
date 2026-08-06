-- ============================================================
-- RANDEVULAR (appointments) DURUM DEĞERLERİNİ UYGULAMAYA UYUMLU HALE GETİRME
-- ============================================================
-- Önce mevcut satırlardaki eski (Türkçe) durum değerlerini yeni değerlere
-- çeviriyoruz, SONRA kısıtlamayı (constraint) ekliyoruz — sıra önemli,
-- aksi halde eski satırlar yeni kurala takılır.

alter table appointments drop constraint if exists appointments_status_check;

update appointments set status = 'scheduled' where status in ('Beklemede','Onaylandı');
update appointments set status = 'completed' where status = 'Tamamlandı';
update appointments set status = 'cancelled' where status = 'İptal Edildi';

alter table appointments alter column status set default 'scheduled';
alter table appointments add constraint appointments_status_check
  check (status in ('scheduled','completed','cancelled'));

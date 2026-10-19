-- ============================================================
-- YEŞİLTAŞ ERP — PAKET v8 (BİR KEZ ÇALIŞTIRIN) — Servis iş akışı
-- Önce v2..v7 çalıştırılmış olmalıdır. Tekrar çalıştırmak güvenlidir.
-- ============================================================
alter table devices add column if not exists stage text;                -- servis aşaması
alter table devices add column if not exists estimated_delivery date;   -- tahmini teslim tarihi
alter table devices add column if not exists qc jsonb;                  -- kalite kontrol listesi
alter table devices add column if not exists quote jsonb;               -- müşteri onaylı teklif
create index if not exists devices_stage_idx on devices(stage);

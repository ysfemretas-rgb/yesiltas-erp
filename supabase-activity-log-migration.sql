-- ============================================================
-- AKTİVİTE LOGU (activity_log) TABLOSUNU OLUŞTURMA
-- ============================================================
-- "Kim neyi ne zaman değiştirdi/sildi" kaydı için yeni bir tablo.

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text default 'Bilinmeyen',
  action text not null check (action in ('created','updated','deleted')),
  module text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

drop policy if exists "activity_log_all_authenticated" on activity_log;
create policy "activity_log_all_authenticated"
  on activity_log for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- GÖREVLER (tasks) TABLOSUNU OLUŞTURMA
-- ============================================================
-- Bu tablo daha önce hiç yoktu, yeni bir özellik için oluşturuluyor.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  assigned_to text default '',
  status text default 'pending' check (status in ('pending','in_progress','done')),
  priority text default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

drop policy if exists "tasks_all_authenticated" on tasks;
create policy "tasks_all_authenticated"
  on tasks for all
  to authenticated
  using (true)
  with check (true);

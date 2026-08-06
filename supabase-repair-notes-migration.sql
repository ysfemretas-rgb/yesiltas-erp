-- ============================================================
-- TAMİR NOTLARI (repair_notes) TABLOSUNU OLUŞTURMA
-- ============================================================
create table if not exists repair_notes (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid references devices(id) on delete cascade,
  text text not null,
  author text default 'Teknisyen',
  created_at timestamptz default now()
);

alter table repair_notes enable row level security;

drop policy if exists "repair_notes_select_authenticated" on repair_notes;
create policy "repair_notes_select_authenticated" on repair_notes for select to authenticated using (true);

drop policy if exists "repair_notes_insert_authenticated" on repair_notes;
create policy "repair_notes_insert_authenticated" on repair_notes for insert to authenticated with check (true);

drop policy if exists "repair_notes_delete_manager_only" on repair_notes;
create policy "repair_notes_delete_manager_only" on repair_notes for delete to authenticated using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'Yönetici')
);

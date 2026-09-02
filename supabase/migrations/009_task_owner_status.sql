-- Tasks: switch from single-assignee suggestions to owner-based tasks, mirroring
-- projects (owner_id + current/previous status) so the Tasks list can use the
-- same 4-tab filter (all / mine / current / previous) as Projects.
alter table public.tasks add column if not exists owner_id uuid references public.profiles (id) on delete set null;
alter table public.tasks add column if not exists status text not null default 'current' check (status in ('current', 'previous'));

-- Backfill existing rows: whoever was assigned becomes the owner.
update public.tasks set owner_id = assignee_id where owner_id is null;

-- Members now add tasks directly (no admin approval step) — allow inserting
-- your own task; admins still manage (update/delete) all tasks via the
-- existing "admins manage tasks" policy.
drop policy if exists "members create their own tasks" on public.tasks;
create policy "members create their own tasks"
  on public.tasks for insert
  with check (auth.uid() = owner_id);

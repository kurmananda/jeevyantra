-- Tasks: lightweight, single-assignee to-dos — distinct from Projects (no
-- roadmap/progress, no team, just what/description/who).
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks are viewable by everyone" on public.tasks;
create policy "tasks are viewable by everyone"
  on public.tasks for select using (true);

drop policy if exists "admins manage tasks" on public.tasks;
create policy "admins manage tasks"
  on public.tasks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Members pitch a task; an admin approves it into public.tasks (same flow as
-- project_requests -> projects).
create table if not exists public.task_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'declined')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.task_requests enable row level security;

drop policy if exists "task requests viewable by everyone" on public.task_requests;
create policy "task requests viewable by everyone"
  on public.task_requests for select using (true);

drop policy if exists "users create their own task requests" on public.task_requests;
create policy "users create their own task requests"
  on public.task_requests for insert with check (auth.uid() = requested_by);

drop policy if exists "admins update task requests" on public.task_requests;
create policy "admins update task requests"
  on public.task_requests for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

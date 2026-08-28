-- Jeevyantra Robotics Club — Supabase schema
-- Run this whole file once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ── PROFILES ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  sccode text,
  bio text,
  avatar_url text,
  points integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- auto-create a blank profile row when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, sccode)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'sccode'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── PROJECTS ────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'current' check (status in ('current', 'previous')),
  tags text[] default '{}',
  image_url text,
  link text,
  is_flagship boolean not null default false,
  progress_admin_only boolean not null default false,
  created_at timestamptz not null default now()
);

-- drop the old 'upcoming' status entirely — only current/previous remain,
-- with the single flagship project called out separately via is_flagship.
update public.projects set status = 'current' where status = 'upcoming';
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('current', 'previous'));

-- if this table already existed before is_flagship/progress_admin_only were added:
alter table public.projects add column if not exists is_flagship boolean not null default false;
alter table public.projects add column if not exists progress_admin_only boolean not null default false;

alter table public.projects enable row level security;

drop policy if exists "projects are viewable by everyone" on public.projects;
create policy "projects are viewable by everyone"
  on public.projects for select using (true);

drop policy if exists "owners manage their own projects" on public.projects;
drop policy if exists "owners and admins manage projects" on public.projects;
create policy "owners and admins manage projects"
  on public.projects for all
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ── PROJECT TEAMS ───────────────────────────────────────────────────────
-- The project owner (or an admin) can add existing members onto the build team.
create table if not exists public.project_teams (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_teams enable row level security;

drop policy if exists "project teams are viewable by everyone" on public.project_teams;
create policy "project teams are viewable by everyone"
  on public.project_teams for select using (true);

drop policy if exists "owner or admin can add teammates" on public.project_teams;
create policy "owner or admin can add teammates"
  on public.project_teams for insert
  with check (
    exists (select 1 from public.projects pr where pr.id = project_id and pr.owner_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "owner or admin can remove teammates" on public.project_teams;
create policy "owner or admin can remove teammates"
  on public.project_teams for delete
  using (
    exists (select 1 from public.projects pr where pr.id = project_id and pr.owner_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ── PROJECT PROGRESS (roadmap) ──────────────────────────────────────────
-- Regular projects: owner, teammates, or admins can log progress.
-- Flagship projects (progress_admin_only = true, e.g. "Venture X"): admins only.
create table if not exists public.project_progress (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  month text not null,
  title text not null,
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.project_progress enable row level security;

create or replace function public.can_add_progress(pid uuid)
returns boolean
language sql
stable
as $$
  select case
    when (select progress_admin_only from public.projects where id = pid) then
      exists (select 1 from public.profiles where id = auth.uid() and is_admin)
    else
      exists (select 1 from public.profiles where id = auth.uid() and is_admin)
      or (select owner_id from public.projects where id = pid) = auth.uid()
      or exists (
        select 1 from public.project_teams t
        where t.project_id = pid and t.user_id = auth.uid()
      )
  end;
$$;

drop policy if exists "progress is viewable by everyone" on public.project_progress;
create policy "progress is viewable by everyone"
  on public.project_progress for select using (true);

drop policy if exists "team or admin can add progress" on public.project_progress;
create policy "team or admin can add progress"
  on public.project_progress for insert
  with check (public.can_add_progress(project_id));

drop policy if exists "team or admin can edit progress" on public.project_progress;
create policy "team or admin can edit progress"
  on public.project_progress for update
  using (public.can_add_progress(project_id))
  with check (public.can_add_progress(project_id));

drop policy if exists "team or admin can delete progress" on public.project_progress;
create policy "team or admin can delete progress"
  on public.project_progress for delete
  using (public.can_add_progress(project_id));

-- ── INVENTORY ───────────────────────────────────────────────────────────
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  quantity integer not null default 1,
  available_quantity integer not null default 1,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory viewable by everyone" on public.inventory_items;
create policy "inventory viewable by everyone"
  on public.inventory_items for select using (true);

drop policy if exists "admins manage inventory" on public.inventory_items;
create policy "admins manage inventory"
  on public.inventory_items for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── BOOKINGS ────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  quantity integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'returned')),
  assigned_by uuid references public.profiles (id),
  pickup_time timestamptz,
  return_by timestamptz,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bookings add column if not exists return_by timestamptz;
alter table public.bookings add column if not exists approved_at timestamptz;

alter table public.bookings enable row level security;

drop policy if exists "users view their own bookings, admins view all" on public.bookings;
create policy "users view their own bookings, admins view all"
  on public.bookings for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "users create their own bookings" on public.bookings;
create policy "users create their own bookings"
  on public.bookings for insert with check (auth.uid() = user_id);

drop policy if exists "admins update bookings" on public.bookings;
create policy "admins update bookings"
  on public.bookings for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── PROJECT REQUESTS ────────────────────────────────────────────────────
-- Anyone signed in can pitch an idea for a project the club should start.
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'declined')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.project_requests enable row level security;

drop policy if exists "requests viewable by everyone" on public.project_requests;
create policy "requests viewable by everyone"
  on public.project_requests for select using (true);

drop policy if exists "users create their own requests" on public.project_requests;
create policy "users create their own requests"
  on public.project_requests for insert with check (auth.uid() = requested_by);

drop policy if exists "admins update requests" on public.project_requests;
create policy "admins update requests"
  on public.project_requests for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── ACTIVITY LOG ────────────────────────────────────────────────────────
-- A record of admin actions: booking approvals/returns, project pitch
-- reviews, inventory changes. Admin-only, for transparency/audit.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

drop policy if exists "logs viewable by admins" on public.activity_log;
create policy "logs viewable by admins"
  on public.activity_log for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "admins can log actions" on public.activity_log;
create policy "admins can log actions"
  on public.activity_log for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- To make yourself an admin after signing up, run:
-- update public.profiles set is_admin = true where id = '<your-auth-uid>';

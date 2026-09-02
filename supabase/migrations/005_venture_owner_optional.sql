-- Allow projects (namely "Venture X") to exist without an owner, so a
-- flagship project's team can be reassigned later without needing a
-- placeholder user to hold owner_id.
alter table public.projects alter column owner_id drop not null;
alter table public.projects alter column owner_id drop default;

-- an owner being deleted should no longer take the project down with it
alter table public.projects drop constraint if exists projects_owner_id_fkey;
alter table public.projects
  add constraint projects_owner_id_fkey
  foreign key (owner_id) references public.profiles (id) on delete set null;

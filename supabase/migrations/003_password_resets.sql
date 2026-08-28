-- An admin flags an email as "allowed to reset." The member then picks
-- their own new password from the sign-in page's Forgot password flow.
-- A row's mere presence means "pending reset allowed" — completing the
-- reset deletes the row, removing that email from the list.
-- Only ever touched by server routes using the service-role key, so RLS
-- just locks it out entirely for normal clients.
create table if not exists public.password_resets (
  email text primary key,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.password_resets drop column if exists temp_password;
alter table public.password_resets drop column if exists claimed;

alter table public.password_resets enable row level security;

drop policy if exists "no direct access" on public.password_resets;
create policy "no direct access"
  on public.password_resets for all
  using (false)
  with check (false);

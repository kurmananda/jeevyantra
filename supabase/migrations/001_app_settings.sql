-- Single-row settings table. Right now it just holds which member is
-- featured in the homepage "Member spotlight" card.
create table if not exists public.app_settings (
  id boolean primary key default true,
  featured_member_id uuid references public.profiles (id),
  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "settings viewable by everyone" on public.app_settings;
create policy "settings viewable by everyone"
  on public.app_settings for select using (true);

drop policy if exists "admins update settings" on public.app_settings;
create policy "admins update settings"
  on public.app_settings for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Extend the single "featured member" spotlight into a 3-position leaderboard
-- (#1 / #2 / #3), sharing one editable card title.
alter table public.app_settings add column if not exists featured_member_id_2 uuid references public.profiles (id);
alter table public.app_settings add column if not exists featured_member_id_3 uuid references public.profiles (id);

update public.app_settings set featured_title = 'Leaderboard' where featured_title = 'Member spotlight';

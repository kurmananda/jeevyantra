-- Surface member email on profiles (previously only in auth.users, which the
-- browser client can't query) so the Members page can display it.
alter table public.profiles add column if not exists email text;

update public.profiles p set email = u.email from auth.users u where p.id = u.id and p.email is null;

-- Keep new signups in sync.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, sccode, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'sccode',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

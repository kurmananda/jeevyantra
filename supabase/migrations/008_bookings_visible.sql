-- Members page shows everyone's currently-borrowed items (who has what), but
-- the original bookings select policy only let a user see their own rows
-- (or an admin see everything) — so any new/non-admin user's Members page
-- couldn't show other members' borrowed items at all.
-- Approved (currently on loan) bookings are meant to be public info, same as
-- who owns which project. Keep pending/rejected/returned rows private to the
-- owner and admins — only "approved" opens up to everyone.
drop policy if exists "users view their own bookings, admins view all" on public.bookings;
create policy "approved bookings are public, own and admin see the rest"
  on public.bookings for select
  using (
    status = 'approved'
    or auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

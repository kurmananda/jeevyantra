-- The points/leaderboard feature was removed from the app in favor of
-- "most projects" — this column has been unused ever since. Dropping it.
alter table public.profiles drop column if exists points;

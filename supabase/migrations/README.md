# Migrations

`../schema.sql` is the original baseline — don't add to it anymore.

From now on, every new database change goes in its own file here, named
`NNN_short_description.sql` (zero-padded, incrementing — e.g.
`001_booking_notes.sql`, `002_venture_owner.sql`).

Run new migration files in order in the Supabase SQL editor. Each one should
be idempotent (`create table if not exists`, `drop policy if exists` before
`create policy`, `add column if not exists`, etc.) so it's safe to re-run.

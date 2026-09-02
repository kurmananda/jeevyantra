// One-off maintenance script: deletes every auth user except the owner of
// "Venture X" (profiles cascade-delete via FK, which cascades project_teams/
// project_progress/bookings/etc — and projects.owner_id is a required FK, so
// deleting Venture X's owner would delete Venture X too).
// Run with: node --env-file=.env.local scripts/delete-all-users.mjs
const KEEP_USER_ID = "07d8197e-2667-41ae-94a1-b7b207e84a29"; // owner of "Venture X"
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let page = 1;
  const perPage = 200;
  let total = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!data.users.length) break;

    for (const user of data.users) {
      if (user.id === KEEP_USER_ID) {
        console.log(`Skipped ${user.email ?? user.id} (Venture X owner)`);
        continue;
      }
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) throw delErr;
      total += 1;
      console.log(`Deleted ${user.email ?? user.id}`);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  console.log(`Done. Deleted ${total} user(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

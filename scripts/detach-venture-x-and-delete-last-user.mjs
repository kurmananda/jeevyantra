// One-off: clears Venture X's owner and team, then deletes the last remaining user.
// Requires migrations/005_venture_owner_optional.sql to have been applied first
// (owner_id must be nullable).
// Run with: node --env-file=.env.local scripts/detach-venture-x-and-delete-last-user.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: project, error: findErr } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("title", "Venture X")
    .single();
  if (findErr) throw findErr;

  const { error: teamErr } = await supabase.from("project_teams").delete().eq("project_id", project.id);
  if (teamErr) throw teamErr;
  console.log("Cleared Venture X's team.");

  const { error: ownerErr } = await supabase.from("projects").update({ owner_id: null }).eq("id", project.id);
  if (ownerErr) throw ownerErr;
  console.log("Cleared Venture X's owner.");

  const { data: users, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;

  for (const user of users.users) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;
    console.log(`Deleted ${user.email ?? user.id}`);
  }

  console.log(`Done. Deleted ${users.users.length} user(s), Venture X now has no owner/team.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

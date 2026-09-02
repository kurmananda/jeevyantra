// One-off: null out non-cascading profile FK references so users can be deleted.
// Run with: node --env-file=.env.local scripts/clear-fk-refs.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targets = [
  ["activity_log", "actor_id"],
  ["bookings", "assigned_by"],
  ["project_progress", "created_by"],
  ["project_teams", "added_by"],
  ["project_requests", "reviewed_by"],
];

async function main() {
  for (const [table, col] of targets) {
    const idCol = table === "project_teams" ? "project_id" : "id";
    const { error, data } = await supabase.from(table).update({ [col]: null }).not(col, "is", null).select(idCol);
    if (error) {
      console.log(`${table}.${col}: error`, error.message);
    } else {
      console.log(`${table}.${col}: cleared ${data.length} row(s)`);
    }
  }
}

main();

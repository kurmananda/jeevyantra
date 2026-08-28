export async function logActivity(supabase, actorId, action, detail) {
  if (!actorId) return;
  const { error } = await supabase.from("activity_log").insert({ actor_id: actorId, action, detail });
  if (error) console.warn("activity_log:", error.message);
}

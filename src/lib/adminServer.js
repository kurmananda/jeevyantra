import { createClient } from "@supabase/supabase-js";

export const anonServerClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const adminServerClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Verifies the bearer token belongs to a signed-in user whose profile has
// is_admin = true. Returns the caller's profile id, or null if not an admin.
export async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: userData, error } = await anonServerClient.auth.getUser(token);
  if (error || !userData?.user) return null;
  const { data: profile } = await adminServerClient.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  return profile?.is_admin ? userData.user.id : null;
}

export async function findAuthUserByEmail(email) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data: list, error } = await adminServerClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !list?.users?.length) break;
    const match = list.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (list.users.length < 200) break;
  }
  return null;
}

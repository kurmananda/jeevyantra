import { adminServerClient } from "@/lib/adminServer";

// Public — no auth, since this powers "Forgot password" for a signed-out
// visitor. Just checks whether an admin has flagged this email for reset.
export async function POST(request) {
  const { email } = await request.json();
  if (!email) return Response.json({ ok: false });

  const { data: reset } = await adminServerClient
    .from("password_resets")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  return Response.json({ ok: Boolean(reset) });
}

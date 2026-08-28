import { adminServerClient, findAuthUserByEmail } from "@/lib/adminServer";

// Public — no auth (this is the signed-out "Forgot password" flow itself).
// Only works if an admin flagged this exact email as pending; the member
// supplies their own new password. On success the email is removed from
// the pending-reset list so it can't be reused.
export async function POST(request) {
  const { email, newPassword } = await request.json();
  if (!email || !newPassword || newPassword.length < 6) {
    return Response.json({ error: "An email and a password (6+ chars) are required." }, { status: 400 });
  }

  const target = email.trim().toLowerCase();
  const { data: reset } = await adminServerClient.from("password_resets").select("email").eq("email", target).maybeSingle();
  if (!reset) return Response.json({ error: "No reset pending for that email." }, { status: 404 });

  const targetUser = await findAuthUserByEmail(target);
  if (!targetUser) return Response.json({ error: "No account found with that email." }, { status: 404 });

  const { error: updateError } = await adminServerClient.auth.admin.updateUserById(targetUser.id, { password: newPassword });
  if (updateError) return Response.json({ error: updateError.message }, { status: 400 });

  await adminServerClient.from("password_resets").delete().eq("email", target);

  return Response.json({ ok: true });
}

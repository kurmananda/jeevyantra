import { requireAdmin, adminServerClient, findAuthUserByEmail } from "@/lib/adminServer";

// Admin picks a member by email and flags them eligible for a self-service
// reset — no password is generated here. The member types their own new
// password from the sign-in page's Forgot password flow.
export async function POST(request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return Response.json({ error: "Not an admin." }, { status: 403 });

  const { email } = await request.json();
  if (!email) return Response.json({ error: "An email is required." }, { status: 400 });

  const targetUser = await findAuthUserByEmail(email);
  if (!targetUser) return Response.json({ error: "No account found with that email." }, { status: 404 });

  const { error: upsertError } = await adminServerClient
    .from("password_resets")
    .upsert({ email: targetUser.email.toLowerCase(), created_by: adminId });
  if (upsertError) return Response.json({ error: upsertError.message }, { status: 400 });

  const { data: targetProfile } = await adminServerClient.from("profiles").select("name").eq("id", targetUser.id).single();
  return Response.json({ ok: true, name: targetProfile?.name ?? targetUser.email });
}

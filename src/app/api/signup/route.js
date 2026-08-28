import { createClient } from "@supabase/supabase-js";

// Server-only: uses the service-role key so account creation never triggers
// Supabase's own confirmation email (and its rate limit). Sign-in afterwards
// happens on the client as normal.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request) {
  const { email, password, name, phone, sccode } = await request.json();

  if (!email || !password || !name) {
    return Response.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, sccode },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}

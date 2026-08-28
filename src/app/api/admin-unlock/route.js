// Server-only check — the real password lives in an env var and never
// reaches the client bundle, so it can't be read via devtools/view-source.
export async function POST(request) {
  const { password } = await request.json();
  const ok = Boolean(password) && password === process.env.ADMIN_PORTAL_PASSWORD;
  return Response.json({ ok });
}

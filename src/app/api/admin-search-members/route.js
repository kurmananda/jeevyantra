import { requireAdmin, adminServerClient } from "@/lib/adminServer";

export async function GET(request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return Response.json({ error: "Not an admin." }, { status: 403 });

  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) return Response.json({ results: [] });

  const matches = [];
  for (let page = 1; page <= 20 && matches.length < 8; page++) {
    const { data: list, error } = await adminServerClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !list?.users?.length) break;
    for (const u of list.users) {
      if (u.email?.toLowerCase().includes(q)) matches.push({ id: u.id, email: u.email });
      if (matches.length >= 8) break;
    }
    if (list.users.length < 200) break;
  }

  const ids = matches.map((m) => m.id);
  const { data: profiles } = ids.length
    ? await adminServerClient.from("profiles").select("id, name, sccode").in("id", ids)
    : { data: [] };

  const results = matches.map((m) => ({
    ...m,
    name: profiles?.find((p) => p.id === m.id)?.name ?? "Unknown",
    sccode: profiles?.find((p) => p.id === m.id)?.sccode ?? null,
  }));

  return Response.json({ results });
}

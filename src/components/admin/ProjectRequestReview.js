"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function ProjectRequestReview({ adminId }) {
  const [requests, setRequests] = useState(null);

  function load() {
    getSupabaseClient()
      .from("project_requests")
      .select("*, profiles!project_requests_requested_by_fkey(id, name)")
      .eq("status", "requested")
      .order("created_at", { ascending: true })
      .then(({ data }) => setRequests(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function decline(request) {
    const supabase = getSupabaseClient();
    await supabase.from("project_requests").update({ status: "declined", reviewed_by: adminId }).eq("id", request.id);
    setRequests((r) => r.filter((x) => x.id !== request.id));
    await logActivity(supabase, adminId, "project pitch declined", request.title);
  }

  async function approve(request) {
    const supabase = getSupabaseClient();
    const { error: projectError } = await supabase.from("projects").insert({
      owner_id: request.requested_by,
      title: request.title,
      description: request.description,
      status: "current",
    });
    if (projectError) {
      alert(projectError.message);
      return;
    }
    await supabase.from("project_requests").update({ status: "approved", reviewed_by: adminId }).eq("id", request.id);
    setRequests((r) => r.filter((x) => x.id !== request.id));
    await logActivity(supabase, adminId, "project pitch approved", `${request.title} (by ${request.profiles?.name ?? "member"})`);
  }

  if (requests === null) return null;
  if (!requests.length) return <p className="text-sm text-muted">No pending project pitches.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => (
        <div key={r.id} className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="font-bold">{r.title}</p>
              <StatusPill status={r.status} />
            </div>
            <p className="text-sm text-muted">{r.description}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">
              pitched by {r.profiles?.name ?? "a member"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConfirmButton
              label="Approve → make project"
              question={`Approve "${r.title}"?`}
              primary
              onConfirm={() => approve(r)}
            />
            <ConfirmButton label="Decline" question={`Decline "${r.title}"?`} danger onConfirm={() => decline(r)} />
          </div>
        </div>
      ))}
    </div>
  );
}

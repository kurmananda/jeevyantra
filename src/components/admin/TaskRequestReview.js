"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function TaskRequestReview({ adminId }) {
  const [requests, setRequests] = useState(null);

  function load() {
    getSupabaseClient()
      .from("task_requests")
      .select("*, profiles!task_requests_requested_by_fkey(id, name), assignee:profiles!task_requests_assignee_id_fkey(name)")
      .eq("status", "requested")
      .order("created_at", { ascending: true })
      .then(({ data }) => setRequests(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function decline(request) {
    const supabase = getSupabaseClient();
    await supabase.from("task_requests").update({ status: "declined", reviewed_by: adminId }).eq("id", request.id);
    setRequests((r) => r.filter((x) => x.id !== request.id));
    await logActivity(supabase, adminId, "task declined", request.title);
  }

  async function approve(request) {
    const supabase = getSupabaseClient();
    const { error: taskError } = await supabase.from("tasks").insert({
      title: request.title,
      description: request.description,
      assignee_id: request.assignee_id,
    });
    if (taskError) {
      alert(taskError.message);
      return;
    }
    await supabase.from("task_requests").update({ status: "approved", reviewed_by: adminId }).eq("id", request.id);
    setRequests((r) => r.filter((x) => x.id !== request.id));
    await logActivity(supabase, adminId, "task approved", `${request.title} (for ${request.assignee?.name ?? "member"})`);
  }

  if (requests === null) return null;
  if (!requests.length) return <p className="text-sm text-muted">No pending task requests.</p>;

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
              for {r.assignee?.name ?? "unassigned"} · suggested by {r.profiles?.name ?? "a member"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConfirmButton
              label="Approve → make task"
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

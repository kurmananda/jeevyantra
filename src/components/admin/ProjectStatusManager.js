"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function ProjectStatusManager({ adminId }) {
  const [projects, setProjects] = useState(null);

  function load() {
    getSupabaseClient()
      .from("projects")
      .select("*, profiles!projects_owner_id_fkey(name)")
      .eq("status", "current")
      .eq("is_flagship", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function markCompleted(project) {
    const supabase = getSupabaseClient();
    await supabase.from("projects").update({ status: "previous" }).eq("id", project.id);
    setProjects((p) => p.filter((x) => x.id !== project.id));
    await logActivity(supabase, adminId, "project marked completed", `${project.title} (by ${project.profiles?.name ?? "member"})`);
  }

  if (projects === null) return null;
  if (!projects.length) return <p className="text-sm text-muted">No current projects to close out.</p>;

  return (
    <div className="flex flex-col gap-2">
      {projects.map((p) => (
        <div key={p.id} className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{p.title}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">by {p.profiles?.name ?? "unknown"}</p>
          </div>
          <ConfirmButton
            label="Mark completed"
            question={`Mark "${p.title}" completed?`}
            primary
            onConfirm={() => markCompleted(p)}
          />
        </div>
      ))}
    </div>
  );
}

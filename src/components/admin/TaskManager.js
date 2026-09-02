"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function TaskManager({ adminId }) {
  const [tasks, setTasks] = useState(null);

  function load() {
    getSupabaseClient()
      .from("tasks")
      .select("*, profiles!tasks_owner_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTasks(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function markCompleted(task) {
    const supabase = getSupabaseClient();
    await supabase.from("tasks").update({ status: "previous" }).eq("id", task.id);
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "previous" } : x)));
    await logActivity(supabase, adminId, "task marked completed", `${task.title} (by ${task.profiles?.name ?? "member"})`);
  }

  async function remove(task) {
    const supabase = getSupabaseClient();
    await supabase.from("tasks").delete().eq("id", task.id);
    setTasks((t) => t.filter((x) => x.id !== task.id));
    await logActivity(supabase, adminId, "task deleted", `${task.title} (by ${task.profiles?.name ?? "member"})`);
  }

  if (tasks === null) return null;
  if (!tasks.length) return <p className="text-sm text-muted">No tasks yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div key={t.id} className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="font-bold">{t.title}</p>
              <StatusPill status={t.status} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">by {t.profiles?.name ?? "unknown"}</p>
          </div>
          <div className="flex items-center gap-2">
            {t.status !== "previous" && (
              <ConfirmButton
                label="Mark completed"
                question={`Mark "${t.title}" completed?`}
                primary
                onConfirm={() => markCompleted(t)}
              />
            )}
            <ConfirmButton label="Delete" question={`Delete "${t.title}"?`} danger onConfirm={() => remove(t)} />
          </div>
        </div>
      ))}
    </div>
  );
}

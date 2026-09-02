"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import RequestTaskModal from "@/components/RequestTaskModal";
import AuthGate from "@/components/AuthGate";

function TaskCard({ task }) {
  return (
    <div className="circuit-card flex flex-col gap-2 p-5">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-muted">{task.description}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">
        {task.assignee?.name ?? "Unassigned"}
      </p>
    </div>
  );
}

export default function TasksPageGate() {
  return (
    <AuthGate>
      <TasksPage />
    </AuthGate>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState(null);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  function loadRequests() {
    getSupabaseClient()
      .from("task_requests")
      .select("*, profiles!task_requests_requested_by_fkey(name), assignee:profiles!task_requests_assignee_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("task_requests:", error.message);
          return;
        }
        setRequests(data ?? []);
      });
  }

  useEffect(() => {
    getSupabaseClient()
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.warn("tasks:", error.message);
        setTasks(data ?? []);
      });

    loadRequests();
  }, []);

  const filtered = (tasks ?? []).filter((t) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.assignee?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Tasks</h1>
          <p className="text-sm text-muted">
            Quick one-off to-dos for one person — not the same as a Project. Projects are builds with a roadmap and
            a team; Tasks are just: what, why, and who&apos;s on it.
          </p>
        </div>
        <button onClick={() => setShowRequest(true)} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          + Suggest a task
        </button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search tasks by title, description, or assignee..." />

      {tasks === null ? (
        <Servo label="Loading tasks" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No tasks match.</p>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Pending task requests</h2>
          <p className="-mt-2 text-sm text-muted">Suggested tasks waiting on admin approval.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.map((r) => (
              <div key={r.id} className="circuit-card p-5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-bold">{r.title}</h3>
                  <StatusPill status={r.status} />
                </div>
                <p className="text-sm text-muted">{r.description}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">
                  for {r.assignee?.name ?? "unassigned"} · suggested by {r.profiles?.name ?? "a member"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRequest && (
        <RequestTaskModal
          onClose={() => setShowRequest(false)}
          onSubmitted={() => {
            setShowRequest(false);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}

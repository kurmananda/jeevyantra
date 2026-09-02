"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import RequestTaskModal from "@/components/RequestTaskModal";
import AuthGate from "@/components/AuthGate";

const FILTERS = [
  { value: "all", label: "all" },
  { value: "mine", label: "my tasks" },
  { value: "current", label: "current" },
  { value: "previous", label: "completed" },
];

const STRIPE = {
  current: "bg-[var(--led-strong)]",
  previous: "bg-[var(--border)]",
};

function TaskCard({ task }) {
  return (
    <div className="circuit-card flex overflow-hidden">
      <span className={`w-2 shrink-0 ${STRIPE[task.status] ?? "bg-border"}`} />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{task.title}</h3>
          <StatusPill status={task.status} />
        </div>
        <p className="text-sm text-muted">{task.description}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">
          by {task.profiles?.name ?? "unknown"}
        </p>
      </div>
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showRequest, setShowRequest] = useState(false);

  function loadTasks() {
    getSupabaseClient()
      .from("tasks")
      .select("*, profiles!tasks_owner_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.warn("tasks:", error.message);
        setTasks(data ?? []);
      });
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    loadTasks();

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setCurrentUserId(sessionData.session?.user?.id ?? null);
    });
  }, []);

  const filtered = useMemo(() => {
    return (tasks ?? [])
      .filter((t) => {
        if (filter === "all") return true;
        if (filter === "mine") return t.owner_id === currentUserId;
        return t.status === filter;
      })
      .filter((t) => {
        const q = query.toLowerCase();
        if (!q) return true;
        return (
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.profiles?.name?.toLowerCase().includes(q)
        );
      });
  }, [tasks, query, filter, currentUserId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Tasks</h1>
          <p className="text-sm text-muted">
            Quick one-off to-dos — not the same as a Project. Projects are builds with a roadmap and a team; Tasks
            are just: what, why, and who&apos;s on it.
          </p>
          <p className="mt-1 text-xs text-muted">
            Looking for a full build instead?{" "}
            <Link href="/projects" className="font-bold underline decoration-2 underline-offset-2">
              Projects
            </Link>
            .
          </p>
        </div>
        <button onClick={() => setShowRequest(true)} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          + Add a task
        </button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search tasks by title, description, or owner..." />

      <div className="flex gap-1 rounded-xl border-2 border-border bg-surface p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`lever-tab text-sm capitalize ${filter === f.value ? "active bg-yellow rounded-lg" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

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

      {showRequest && (
        <RequestTaskModal
          onClose={() => setShowRequest(false)}
          onSubmitted={() => {
            setShowRequest(false);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import RequestProjectModal from "@/components/RequestProjectModal";
import AuthGate from "@/components/AuthGate";
import { buildByline } from "@/lib/team";

const FILTERS = [
  { value: "all", label: "all" },
  { value: "mine", label: "my projects" },
  { value: "current", label: "current" },
  { value: "previous", label: "completed" },
];

const STRIPE = {
  current: "bg-[var(--led-strong)]",
  previous: "bg-[var(--border)]",
};

function ProjectFeature({ project, teammateNames = [] }) {
  return (
    <Link href={`/projects/${project.id}`} className="circuit-card group flex overflow-hidden">
      <span className={`w-2.5 shrink-0 sm:w-3.5 ${STRIPE[project.status] ?? "bg-border"}`} />
      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{project.title}</h3>
          <StatusPill status={project.status} />
        </div>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{project.description}</p>
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="status-pill normal-case text-muted">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t-2 border-dashed border-border pt-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            {buildByline(project.profiles?.name ?? "unknown", teammateNames)}
          </span>
          <span className="text-sm font-bold text-foreground underline decoration-2 underline-offset-2 group-hover:text-orange">
            View project →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPageGate() {
  return (
    <AuthGate>
      <ProjectsPage />
    </AuthGate>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = useState(null);
  const [teamsByProject, setTeamsByProject] = useState({});
  const [myTeamProjectIds, setMyTeamProjectIds] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showRequest, setShowRequest] = useState(false);

  function loadRequests() {
    getSupabaseClient()
      .from("project_requests")
      .select("*, profiles!project_requests_requested_by_fkey(name)")
      .eq("status", "requested")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("project_requests:", error.message);
          return;
        }
        setRequests(data ?? []);
      });
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("projects")
      .select("*, profiles!projects_owner_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.warn("projects:", error.message);
        setProjects((data ?? []).filter((p) => !p.is_flagship));
      });

    supabase
      .from("project_teams")
      .select("project_id, user_id, profiles!project_teams_user_id_fkey(name)")
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach((row) => {
          map[row.project_id] = map[row.project_id] || [];
          if (row.profiles?.name) map[row.project_id].push(row.profiles.name);
        });
        setTeamsByProject(map);

        supabase.auth.getSession().then(({ data: sessionData }) => {
          const uid = sessionData.session?.user?.id ?? null;
          setCurrentUserId(uid);
          if (uid) {
            setMyTeamProjectIds(new Set((data ?? []).filter((r) => r.user_id === uid).map((r) => r.project_id)));
          }
        });
      });

    loadRequests();
  }, []);

  const filtered = useMemo(() => {
    return (projects ?? [])
      .filter((p) => {
        if (filter === "all") return true;
        if (filter === "mine") return p.owner_id === currentUserId || myTeamProjectIds.has(p.id);
        return p.status === filter;
      })
      .filter((p) => {
        const q = query.toLowerCase();
        if (!q) return true;
        return (
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.profiles?.name?.toLowerCase().includes(q)
        );
      });
  }, [projects, query, filter, currentUserId, myTeamProjectIds]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Projects</h1>
          <p className="text-sm text-muted">Every build the club has fired up — powered on, wired up, or archived.</p>
          <p className="mt-1 text-xs text-muted">
            Looking for a quick one-person to-do instead of a full build? That&apos;s{" "}
            <Link href="/tasks" className="font-bold underline decoration-2 underline-offset-2">
              Tasks
            </Link>
            .
          </p>
        </div>
        <button onClick={() => setShowRequest(true)} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          + Request a project
        </button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search projects, tags, or builders..." />

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

      {projects === null ? (
        <Servo label="Loading projects" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No projects match.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((p) => (
            <ProjectFeature key={p.id} project={p} teammateNames={teamsByProject[p.id]} />
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Community requests</h2>
          <p className="-mt-2 text-sm text-muted">Ideas members have pitched for the club to build next.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.map((r) => (
              <div key={r.id} className="circuit-card p-5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-bold">{r.title}</h3>
                  <StatusPill status={r.status} />
                </div>
                <p className="text-sm text-muted">{r.description}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">
                  pitched by {r.profiles?.name ?? "a member"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRequest && (
        <RequestProjectModal
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

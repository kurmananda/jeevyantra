"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import Roadmap from "@/components/Roadmap";
import AddProgressModal from "@/components/AddProgressModal";
import AddTeammateModal from "@/components/AddTeammateModal";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { buildByline, waLink } from "@/lib/team";

const STRIPE = {
  current: "bg-[var(--led-strong)]",
  previous: "bg-[var(--border)]",
};

export default function ProjectDetail({ id }) {
  const [project, setProject] = useState(undefined);
  const [otherProjects, setOtherProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [progress, setProgress] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showTeammate, setShowTeammate] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("projects")
        .select("*, profiles!projects_owner_id_fkey(id, name, bio, sccode, phone)")
        .eq("id", id)
        .single();
      setProject(data ?? null);
      if (!data) return;

      const [{ data: others }, { data: teamRows }, { data: progressRows }, { data: sessionData }] = await Promise.all([
        supabase.from("projects").select("id, title, status").eq("owner_id", data.owner_id).neq("id", id),
        supabase.from("project_teams").select("user_id, profiles!project_teams_user_id_fkey(id, name, phone)").eq("project_id", id),
        supabase.from("project_progress").select("*").eq("project_id", id).order("created_at", { ascending: true }),
        supabase.auth.getSession(),
      ]);
      setOtherProjects(others ?? []);
      setTeam((teamRows ?? []).map((r) => r.profiles).filter(Boolean));
      setProgress(progressRows ?? []);

      const uid = sessionData.session?.user?.id ?? null;
      setCurrentUser(uid);
      if (uid) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", uid).single();
        setIsAdmin(!!profile?.is_admin);
      }
    })();
  }, [id]);

  if (project === undefined) return <Servo label="Loading project" />;

  if (project === null) {
    return (
      <div className="circuit-card mx-auto max-w-md p-8 text-center">
        <p className="mb-4 font-bold">Project not found.</p>
        <Link href="/projects" className="push-btn primary rounded-lg px-4 py-2 text-sm">
          Back to projects
        </Link>
      </div>
    );
  }

  const isOwner = currentUser === project.owner_id;
  const isTeamMember = team.some((t) => t.id === currentUser);
  const canManageTeam = isOwner || isAdmin;
  // the flagship project's roadmap is managed from the Admin panel only
  const canAddProgress = project.is_flagship ? false : isOwner || isTeamMember || isAdmin;
  const teammateNames = team.filter((t) => t.id !== project.owner_id).map((t) => t.name);
  const existingIds = [project.owner_id, ...team.map((t) => t.id)];

  async function deleteProgress(entry) {
    const supabase = getSupabaseClient();
    await supabase.from("project_progress").delete().eq("id", entry.id);
    setProgress((p) => p.filter((x) => x.id !== entry.id));
  }

  async function removeTeammate(member) {
    const supabase = getSupabaseClient();
    await supabase.from("project_teams").delete().eq("project_id", id).eq("user_id", member.id);
    setTeam((t) => t.filter((x) => x.id !== member.id));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/projects" className="w-fit text-sm font-bold text-muted underline decoration-2 underline-offset-2">
        ← All projects
      </Link>

      <div className="circuit-card flex overflow-hidden">
        <span className={`w-3 shrink-0 sm:w-4 ${STRIPE[project.status] ?? "bg-border"}`} />
        <div className="flex-1 p-6 sm:p-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
            <StatusPill status={project.status} />
          </div>
          <p className="max-w-2xl text-[16px] leading-relaxed text-muted">{project.description}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">
            {project.is_flagship
              ? "No single owner — built by the whole crew"
              : buildByline(project.profiles?.name ?? "unknown", teammateNames)}
          </p>

          {project.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="status-pill normal-case text-muted">
                  {t}
                </span>
              ))}
            </div>
          )}

          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="push-btn primary mt-6 inline-block rounded-lg px-5 py-2 text-sm"
            >
              Open project link →
            </a>
          )}
        </div>
      </div>

      {project.is_flagship ? (
        <div className="circuit-card p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">Team</p>
          <p className="text-sm text-muted">
            Built by the whole crew — no individual names called out here.{" "}
            <Link href="/team" className="font-bold underline decoration-2 underline-offset-2">
              See the core team →
            </Link>
          </p>
        </div>
      ) : (
        <div className="circuit-card p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Team</p>
            {canManageTeam && (
              <button onClick={() => setShowTeammate(true)} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
                + Add teammate
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {[project.profiles, ...team.filter((t) => t.id !== project.owner_id)].map((m, i) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border-2 border-border bg-surface px-3 py-2">
                <span className="text-sm font-bold">
                  {m.name} {i === 0 && <span className="text-xs font-semibold text-muted">(owner)</span>}
                </span>
                <div className="flex items-center gap-3">
                  {m.phone && waLink(m.phone) && (
                    <a
                      href={waLink(m.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[var(--led-strong-text)] underline decoration-2 underline-offset-2"
                    >
                      {m.phone} ↗
                    </a>
                  )}
                  {i !== 0 && canManageTeam && project.status === "current" && (
                    <ConfirmButton
                      label="Remove"
                      question={`Remove ${m.name} from this project?`}
                      danger
                      onConfirm={() => removeTeammate(m)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="circuit-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Progress roadmap</p>
          {canAddProgress && (
            <button onClick={() => setShowProgress(true)} className="push-btn primary rounded-lg px-3 py-1.5 text-xs font-bold">
              + Log progress
            </button>
          )}
          {project.is_flagship && isAdmin && (
            <Link href="/admin" className="text-xs font-bold underline decoration-2 underline-offset-2">
              Manage in Admin →
            </Link>
          )}
        </div>
        <Roadmap entries={progress} onDelete={canAddProgress ? deleteProgress : undefined} />
      </div>

      {!project.is_flagship && project.profiles && (
        <div className="circuit-card p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Built by</p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-border bg-orange font-display text-xl font-bold">
              {project.profiles.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-bold">{project.profiles.name}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {project.profiles.sccode || "—"} · {otherProjects.length + 1}{" "}
                {otherProjects.length + 1 === 1 ? "project" : "projects"}
              </p>
            </div>
          </div>
          {project.profiles.bio && <p className="mt-3 text-sm text-muted">{project.profiles.bio}</p>}

          {otherProjects.length > 0 && (
            <div className="mt-5 border-t-2 border-dashed border-border pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
                Other projects by {project.profiles.name}
              </p>
              <div className="flex flex-col gap-2">
                {otherProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg border-2 border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-orange"
                  >
                    {p.title}
                    <StatusPill status={p.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/members" className="mt-4 inline-block text-sm font-bold underline decoration-2 underline-offset-2">
            View full member roster →
          </Link>
        </div>
      )}

      {showProgress && (
        <AddProgressModal
          projectId={id}
          onClose={() => setShowProgress(false)}
          onAdded={(entry) => {
            setProgress((p) => [...p, entry]);
            setShowProgress(false);
          }}
        />
      )}
      {showTeammate && (
        <AddTeammateModal
          projectId={id}
          existingIds={existingIds}
          onClose={() => setShowTeammate(false)}
          onAdded={(member) => setTeam((t) => [...t, member])}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import Led from "@/components/Led";
import AuthGate from "@/components/AuthGate";

function MemberCard({ member }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="circuit-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border font-semibold">
            {member.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-muted">
              {member.projects?.length ?? 0} {member.projects?.length === 1 ? "project" : "projects"}
            </p>
          </div>
        </div>
        <span className={`inline-flex transition-transform ${open ? "rotate-180" : ""}`}>
          <Led on size={9} />
        </span>
      </button>

      {open && (
        <div className="border-t border-border bg-background/50 p-5">
          {member.bio && <p className="mb-3 text-sm text-muted">{member.bio}</p>}
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-3">
            <span>Phone: {member.phone || "—"}</span>
            <span>SC code: {member.sccode || "—"}</span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Projects</p>
          {!member.projects?.length ? (
            <p className="text-sm text-muted">No projects logged yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {member.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted">{p.description}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MembersPageGate() {
  return (
    <AuthGate>
      <MembersPage />
    </AuthGate>
  );
}

function MembersPage() {
  const [members, setMembers] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    Promise.all([supabase.from("profiles").select("*"), supabase.from("projects").select("*")]).then(
      ([{ data: profiles }, { data: projects }]) => {
        const byOwner = {};
        (projects ?? []).forEach((p) => {
          byOwner[p.owner_id] = byOwner[p.owner_id] || [];
          byOwner[p.owner_id].push(p);
        });
        const withProjects = (profiles ?? []).map((m) => ({ ...m, projects: byOwner[m.id] || [] }));
        withProjects.sort((a, b) => b.projects.length - a.projects.length);
        setMembers(withProjects);
      }
    );
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (members ?? []).filter((m) => !q || m.name?.toLowerCase().includes(q) || m.sccode?.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Members</h1>
          <p className="text-sm text-muted">The people behind the circuits — click a member to open their build log.</p>
        </div>
        <Link href="/members/profile" className="push-btn primary rounded-lg px-4 py-2 text-sm font-medium">
          Edit my profile
        </Link>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search members by name or SC code..." />

      {members === null ? (
        <Servo label="Loading members" />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

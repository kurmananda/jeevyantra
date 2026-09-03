"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import Led from "@/components/Led";
import AuthGate from "@/components/AuthGate";

function MemberDetailModal({ member, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#15130f]/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="circuit-card max-h-[80vh] w-full max-w-lg overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border font-semibold">
              {member.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-xs text-muted">
                {member.projects?.length ?? 0} {member.projects?.length === 1 ? "project" : "projects"}
                {" · "}
                {member.tasks?.length ?? 0} {member.tasks?.length === 1 ? "task" : "tasks"}
                {" · "}
                {member.borrowed?.length ?? 0} borrowed
              </p>
            </div>
          </div>
          <button onClick={onClose} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
            Close
          </button>
        </div>

        {member.bio && <p className="mb-3 text-sm text-muted">{member.bio}</p>}
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-3">
          <span>Email: {member.email || "—"}</span>
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

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-muted">Tasks</p>
        {!member.tasks?.length ? (
          <p className="text-sm text-muted">No tasks logged yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {member.tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted">{t.description}</p>
                </div>
                <StatusPill status={t.status} />
              </div>
            ))}
          </div>
        )}

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-muted">Borrowed items</p>
        {!member.borrowed?.length ? (
          <p className="text-sm text-muted">Nothing currently borrowed.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {member.borrowed.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-sm font-medium">
                  {b.inventory_items?.name} × {b.quantity}
                </p>
                {b.return_by && (
                  <span className="text-xs text-muted">Due {new Date(b.return_by).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({ member, onOpen }) {
  return (
    <button onClick={onOpen} className="circuit-card flex w-full items-center justify-between gap-4 p-5 text-left">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border font-semibold">
          {member.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{member.name}</p>
          {member.email && <p className="text-xs text-muted">{member.email}</p>}
          <p className="text-xs text-muted">
            {member.projects?.length ?? 0} {member.projects?.length === 1 ? "project" : "projects"}
            {" · "}
            {member.tasks?.length ?? 0} {member.tasks?.length === 1 ? "task" : "tasks"}
            {" · "}
            {member.borrowed?.length ?? 0} borrowed
          </p>
        </div>
      </div>
      <Led on size={9} />
    </button>
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
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("bookings").select("*, inventory_items(name)").eq("status", "approved"),
    ]).then(([{ data: profiles }, { data: projects }, { data: tasks }, { data: bookings }]) => {
      const byOwner = {};
      (projects ?? []).forEach((p) => {
        byOwner[p.owner_id] = byOwner[p.owner_id] || [];
        byOwner[p.owner_id].push(p);
      });
      const tasksByOwner = {};
      (tasks ?? []).forEach((t) => {
        tasksByOwner[t.owner_id] = tasksByOwner[t.owner_id] || [];
        tasksByOwner[t.owner_id].push(t);
      });
      const byBorrower = {};
      (bookings ?? []).forEach((b) => {
        byBorrower[b.user_id] = byBorrower[b.user_id] || [];
        byBorrower[b.user_id].push(b);
      });
      const withProjects = (profiles ?? []).map((m) => ({
        ...m,
        projects: byOwner[m.id] || [],
        tasks: tasksByOwner[m.id] || [],
        borrowed: byBorrower[m.id] || [],
      }));
      withProjects.sort((a, b) => b.projects.length - a.projects.length);
      setMembers(withProjects);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (members ?? []).filter(
      (m) =>
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.sccode?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
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

      <SearchBar value={query} onChange={setQuery} placeholder="Search members by name, email, or SC code..." />

      {members === null ? (
        <Servo label="Loading members" />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      )}

      {openId &&
        (() => {
          const openMember = (members ?? []).find((m) => m.id === openId);
          if (!openMember) return null;
          return <MemberDetailModal member={openMember} onClose={() => setOpenId(null)} />;
        })()}
    </div>
  );
}

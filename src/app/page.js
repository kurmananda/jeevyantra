"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import Led from "@/components/Led";
import RoverIcon from "@/components/RoverIcon";
import ArmIcon from "@/components/ArmIcon";
import QuadrupedIcon from "@/components/QuadrupedIcon";
import VentureBanner from "@/components/VentureBanner";

function StatTile({ label, value, accent = "led-strong" }) {
  return (
    <div className="circuit-card flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
          {value === null ? "—" : String(value).padStart(2, "0")}
        </p>
      </div>
      <Led on={value !== null} color={accent} pulse={value !== null} size={9} />
    </div>
  );
}

function NavTile({ href, label }) {
  return (
    <Link
      href={href}
      className="rounded-lg border-2 border-border bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted hover:bg-orange hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function ProjectRow({ project }) {
  return (
    <Link href={`/projects/${project.id}`} className="circuit-card flex items-start justify-between gap-4 p-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-display text-xl font-bold">{project.title}</h3>
          <StatusPill status={project.status} />
        </div>
        <p className="line-clamp-3 text-[15px] text-muted">{project.description}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">
          by {project.profiles?.name ?? "unknown"}
        </p>
      </div>
    </Link>
  );
}

function MemberSpotlight({ title, member, accent }) {
  if (!member) return null;
  return (
    <div className="circuit-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{title}</p>
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-lg font-semibold"
          style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 20%, transparent)` }}
        >
          {member.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{member.name}</p>
          <p className="text-xs text-muted">
            {member.projectCount ?? 0} {member.projectCount === 1 ? "project" : "projects"}
          </p>
        </div>
      </div>
      <Link href="/members" className="push-btn mt-4 inline-block rounded-lg px-3 py-1.5 text-xs font-medium">
        View members
      </Link>
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState(null);
  const [topMember, setTopMember] = useState(null);
  const [randomMember, setRandomMember] = useState(null);
  const [spotlightTitle, setSpotlightTitle] = useState("Member spotlight");
  const [stats, setStats] = useState({ members: null, activeProjects: null, inventory: null, pending: null });

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase
      .from("projects")
      .select("*, profiles!projects_owner_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects(data ?? []));

    Promise.all([supabase.from("profiles").select("*"), supabase.from("projects").select("id, owner_id")]).then(
      ([{ data: allProfiles }, { data: allProjects }]) => {
        if (!allProfiles?.length) return;
        const counts = {};
        (allProjects ?? []).forEach((p) => {
          counts[p.owner_id] = (counts[p.owner_id] ?? 0) + 1;
        });
        const withCounts = allProfiles.map((p) => ({ ...p, projectCount: counts[p.id] ?? 0 }));
        const mostProjects = [...withCounts].sort((a, b) => b.projectCount - a.projectCount)[0];
        setTopMember(mostProjects ?? null);

        supabase
          .from("app_settings")
          .select("featured_member_id, featured_title")
          .eq("id", true)
          .maybeSingle()
          .then(({ data: settings }) => {
            const featured = settings?.featured_member_id
              ? withCounts.find((p) => p.id === settings.featured_member_id)
              : null;
            setRandomMember(featured ?? withCounts[Math.floor(Math.random() * withCounts.length)]);
            if (settings?.featured_title) setSpotlightTitle(settings.featured_title);
          });
      }
    );

    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "current"),
      supabase.from("inventory_items").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([members, activeProjects, inventory, pending]) => {
      setStats({
        members: members.count ?? 0,
        activeProjects: activeProjects.count ?? 0,
        inventory: inventory.count ?? 0,
        pending: pending.count ?? 0,
      });
    });
  }, []);

  const grouped = { current: [], previous: [] };
  (projects ?? [])
    .filter((p) => !p.is_flagship)
    .forEach((p) => grouped[p.status]?.push(p));

  return (
    <div className="flex flex-col gap-12">
      <section className="circuit-card relative overflow-hidden p-10 text-center">
        <RoverIcon className="pointer-events-none absolute -bottom-3 -left-3 h-20 w-28 text-border opacity-40 sm:h-28 sm:w-36" />
        <ArmIcon className="pointer-events-none absolute -top-6 -right-4 h-16 w-24 rotate-12 text-border opacity-30 sm:h-20 sm:w-28" />
        <QuadrupedIcon className="robot-drive pointer-events-none absolute bottom-6 right-10 hidden h-12 w-16 text-border opacity-30 sm:block" />
        <ArmIcon className="arm-wave pointer-events-none absolute top-8 left-6 hidden h-10 w-14 text-border opacity-25 md:block" />
        <RoverIcon className="robot-drive-fast pointer-events-none absolute top-1/2 left-1/3 hidden h-9 w-12 -translate-y-1/2 text-border opacity-15 lg:block" />
        <QuadrupedIcon className="robot-bob pointer-events-none absolute bottom-10 left-1/2 hidden h-9 w-12 text-border opacity-20 lg:block" />
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-muted">
          Powered by
        </p>
        <h1 className="glow-text font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">
          Jeevyantra
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The place where every project adds up into a portfolio — and the shared inventory that builds it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/projects" className="push-btn primary rounded-lg px-5 py-2 text-sm font-medium">
            Explore projects
          </Link>
          <Link href="/inventory" className="push-btn rounded-lg px-5 py-2 text-sm font-medium">
            Browse inventory
          </Link>
        </div>
      </section>

      <div className="-mt-6 flex flex-wrap justify-center gap-1">
        <NavTile href="/team" label="Team" />
        <NavTile href="/help" label="Help / How to use" />
        <NavTile href="/admin" label="Admin" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Members" value={stats.members} accent="led-strong" />
        <StatTile label="Active builds" value={stats.activeProjects} accent="led-strong" />
        <StatTile label="Inventory SKUs" value={stats.inventory} accent="led" />
        <StatTile label="Pending bookings" value={stats.pending} accent="led-amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MemberSpotlight title="Most projects" member={topMember} accent="var(--led-strong)" />
        <MemberSpotlight title={spotlightTitle} member={randomMember} accent="var(--led-amber)" />
      </div>

      <VentureBanner />

      {projects === null ? (
        <Servo label="Booting project feed" />
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {[
            ["current", "Current Projects"],
            ["previous", "Completed Projects"],
          ].map(([key, title]) => (
            <div key={key} className="flex flex-col gap-3">
              <h2 className="font-display text-base font-bold uppercase tracking-tight">{title}</h2>
              {grouped[key].length === 0 && (
                <p className="text-sm text-muted">Nothing here yet.</p>
              )}
              {grouped[key].map((p) => (
                <ProjectRow key={p.id} project={p} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import RoverIcon from "@/components/RoverIcon";

export default function VentureBanner() {
  const [venture, setVenture] = useState(undefined);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: v } = await supabase.from("projects").select("*").eq("is_flagship", true).maybeSingle();
      setVenture(v ?? null);
      if (!v) return;

      const { count } = await supabase
        .from("project_teams")
        .select("*", { count: "exact", head: true })
        .eq("project_id", v.id);
      setTeamCount(count ?? 0);
    })();
  }, []);

  if (!venture) return null;

  return (
    <Link
      href={`/projects/${venture.id}`}
      className="relative block min-h-[16rem] overflow-hidden rounded-[14px] border-[4px] border-border bg-surface p-8 transition-transform hover:-translate-y-0.5 sm:p-12"
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <span className="absolute inset-x-0 top-0 h-3 bg-orange" />
      <RoverIcon className="pointer-events-none absolute -bottom-4 -right-6 h-36 w-48 text-border opacity-30 sm:h-48 sm:w-64" />

      <p className="status-pill mb-3 w-fit" style={{ color: "var(--orange)", borderColor: "var(--orange)" }}>
        ★ The club&apos;s flagship build
      </p>
      <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-6xl">{venture.title}</h2>
      <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted">{venture.description}</p>

      {venture.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {venture.tags.map((t) => (
            <span key={t} className="status-pill normal-case text-muted">
              {t}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted">
        {teamCount} on the crew — no single owner, built by the whole team
      </p>

      <span className="relative mt-4 inline-block text-sm font-bold underline decoration-2 underline-offset-2">
        Open full project page →
      </span>
    </Link>
  );
}

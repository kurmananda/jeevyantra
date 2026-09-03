"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

const MEMBER_COLS = ["featured_member_id", "featured_member_id_2", "featured_member_id_3"];

function PositionPicker({ rank, adminId, current, onChosen }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const q = query.trim();
    const request = q
      ? supabase.from("profiles").select("id, name, sccode").ilike("name", `%${q}%`).limit(8)
      : supabase.from("profiles").select("id, name, sccode").order("name").limit(8);
    request.then(({ data }) => setResults(data ?? []));
  }, [query]);

  async function choose(member) {
    setSaving(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .update({ [MEMBER_COLS[rank - 1]]: member.id })
      .eq("id", true);
    setSaving(false);
    if (!error) {
      onChosen(member);
      await logActivity(supabase, adminId, `leaderboard #${rank} set`, member.name);
    } else {
      alert(`Couldn't save #${rank}: ${error.message}`);
    }
  }

  async function clear() {
    setSaving(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("app_settings")
      .update({ [MEMBER_COLS[rank - 1]]: null })
      .eq("id", true);
    setSaving(false);
    if (!error) onChosen(null);
  }

  return (
    <div className="circuit-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">#{rank}</p>
          <p className="font-bold">{current?.name ?? "Unassigned"}</p>
        </div>
        {current && <ConfirmButton label="Clear" question="Clear this spot?" onConfirm={clear} />}
      </div>

      <input
        className="circuit-card px-3 py-2 text-sm outline-none"
        placeholder="Search members by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex flex-col gap-2">
        {results.map((m) => (
          <button
            key={m.id}
            disabled={saving}
            onClick={() => choose(m)}
            className="push-btn flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
          >
            <span>
              <span className="font-bold">{m.name}</span> <span className="text-xs text-muted">{m.sccode}</span>
            </span>
            <span className="text-xs font-bold text-muted">Pick →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardEditor({ adminId }) {
  const [title, setTitle] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [members, setMembers] = useState(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("app_settings")
      .select(
        "featured_title, featured_member_id, featured_member_id_2, featured_member_id_3, m1:profiles!featured_member_id(id, name), m2:profiles!featured_member_id_2(id, name), m3:profiles!featured_member_id_3(id, name)"
      )
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        setTitle(data?.featured_title ?? "Leaderboard");
        setMembers([data?.m1 ?? null, data?.m2 ?? null, data?.m3 ?? null]);
      });
  }, []);

  async function saveTitle(e) {
    e.preventDefault();
    setTitleSaving(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("app_settings").update({ featured_title: title }).eq("id", true);
    setTitleSaving(false);
    if (!error) await logActivity(supabase, adminId, "leaderboard title changed", title);
  }

  if (members === undefined) return null;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={saveTitle} className="circuit-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Card title</label>
          <input
            className="circuit-card w-full px-3 py-2 text-sm outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leaderboard"
          />
        </div>
        <button disabled={titleSaving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          {titleSaving ? "Saving..." : "Save title"}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((rank) => (
          <PositionPicker
            key={rank}
            rank={rank}
            adminId={adminId}
            current={members[rank - 1]}
            onChosen={(member) =>
              setMembers((prev) => prev.map((m, i) => (i === rank - 1 ? member : m)))
            }
          />
        ))}
      </div>
    </div>
  );
}

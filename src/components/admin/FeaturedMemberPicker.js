"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function FeaturedMemberPicker({ adminId }) {
  const [current, setCurrent] = useState(undefined);
  const [title, setTitle] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("app_settings")
      .select("featured_member_id, featured_title, profiles(id, name)")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        setCurrent(data?.profiles ?? null);
        setTitle(data?.featured_title ?? "Member spotlight");
      });
  }, []);

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
    const { error } = await supabase.from("app_settings").update({ featured_member_id: member.id }).eq("id", true);
    setSaving(false);
    if (!error) {
      setCurrent(member);
      await logActivity(supabase, adminId, "featured member set", member.name);
    }
  }

  async function clear() {
    setSaving(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("app_settings").update({ featured_member_id: null }).eq("id", true);
    setSaving(false);
    if (!error) setCurrent(null);
  }

  async function saveTitle(e) {
    e.preventDefault();
    setTitleSaving(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("app_settings").update({ featured_title: title }).eq("id", true);
    setTitleSaving(false);
    if (!error) await logActivity(supabase, adminId, "spotlight title changed", title);
  }

  if (current === undefined) return null;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={saveTitle} className="circuit-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted">Card title</label>
          <input
            className="circuit-card w-full px-3 py-2 text-sm outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Member spotlight"
          />
        </div>
        <button disabled={titleSaving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          {titleSaving ? "Saving..." : "Save title"}
        </button>
      </form>

      <div className="circuit-card flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Currently featured</p>
          <p className="font-bold">{current?.name ?? "None — showing a random member"}</p>
        </div>
        {current && <ConfirmButton label="Clear" question="Clear the spotlight?" onConfirm={clear} />}
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
            <span className="text-xs font-bold text-muted">Feature →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

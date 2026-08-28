"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AddTeammateModal({ projectId, existingIds = [], onClose, onAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [addedIds, setAddedIds] = useState(existingIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    const q = query.trim();
    const request = q
      ? supabase.from("profiles").select("*").ilike("name", `%${q}%`).limit(8)
      : supabase.from("profiles").select("*").order("name").limit(8);
    request.then(({ data }) => setResults(data ?? []));
  }, [query]);

  async function addMember(member) {
    if (addedIds.includes(member.id)) return;
    setSaving(true);
    setError("");
    setAddedIds((ids) => [...ids, member.id]);
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const addedBy = sessionData.session?.user?.id;
    const { error } = await supabase
      .from("project_teams")
      .insert({ project_id: projectId, user_id: member.id, added_by: addedBy });
    setSaving(false);
    if (error) {
      if (error.code !== "23505") {
        setError(error.message);
        setAddedIds((ids) => ids.filter((id) => id !== member.id));
      }
      return;
    }
    onAdded(member);
  }

  const visible = results.filter((m) => !addedIds.includes(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15130f]/50 p-4">
      <div className="circuit-card w-full max-w-md p-6">
        <h3 className="font-display mb-4 text-xl font-bold uppercase tracking-tight">Add teammate</h3>
        <input
          autoFocus
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
          placeholder="Search members by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {visible.length === 0 && <p className="text-sm text-muted">No members found.</p>}
          {visible.map((m) => (
            <button
              key={m.id}
              disabled={saving}
              onClick={() => addMember(m)}
              className="push-btn flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
            >
              <span>
                <span className="font-bold">{m.name}</span>{" "}
                <span className="text-xs text-muted">{m.sccode}</span>
              </span>
              <span className="text-xs font-bold text-muted">+ add</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="push-btn mt-4 w-full rounded-lg px-4 py-2 text-sm">
          Done
        </button>
      </div>
    </div>
  );
}

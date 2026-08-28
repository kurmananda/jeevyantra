"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AddProgressModal({ projectId, onClose, onAdded }) {
  const [month, setMonth] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const { data, error } = await supabase
      .from("project_progress")
      .insert({ project_id: projectId, month, title, description, created_by: userId })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onAdded(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15130f]/50 p-4">
      <form onSubmit={submit} className="circuit-card w-full max-w-md p-6">
        <h3 className="font-display mb-4 text-xl font-bold uppercase tracking-tight">Log progress</h3>
        <input
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
          placeholder="Month (e.g. March 2026)"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
        <input
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
          placeholder="Milestone title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
          placeholder="What got done?"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="push-btn rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
            {saving ? "Saving..." : "Add to roadmap"}
          </button>
        </div>
      </form>
    </div>
  );
}

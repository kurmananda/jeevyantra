"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

const EMPTY = { month: "", title: "", description: "" };

export default function VentureRoadmapManager({ adminId }) {
  const [venture, setVenture] = useState(undefined);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient();
      const { data: v } = await supabase.from("projects").select("id, title").eq("is_flagship", true).maybeSingle();
      setVenture(v ?? null);
      if (!v) return;
      const { data } = await supabase
        .from("project_progress")
        .select("*")
        .eq("project_id", v.id)
        .order("created_at", { ascending: true });
      setEntries(data ?? []);
    })();
  }, []);

  async function addEntry(e) {
    e.preventDefault();
    if (!venture) return;
    setSaving(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("project_progress")
      .insert({ ...form, project_id: venture.id, created_by: adminId })
      .select()
      .single();
    setSaving(false);
    if (!error) {
      setEntries((e) => [...e, data]);
      setForm(EMPTY);
      await logActivity(supabase, adminId, "roadmap entry added", `${venture.title}: ${data.title}`);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditDraft({ month: entry.month, title: entry.title, description: entry.description ?? "" });
  }

  async function saveEdit(entry) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("project_progress").update(editDraft).eq("id", entry.id);
    if (!error) {
      setEntries((es) => es.map((x) => (x.id === entry.id ? { ...x, ...editDraft } : x)));
      setEditingId(null);
      await logActivity(supabase, adminId, "roadmap entry edited", `${venture.title}: ${editDraft.title}`);
    }
  }

  async function removeEntry(entry) {
    const supabase = getSupabaseClient();
    await supabase.from("project_progress").delete().eq("id", entry.id);
    setEntries((es) => es.filter((x) => x.id !== entry.id));
    await logActivity(supabase, adminId, "roadmap entry removed", `${venture.title}: ${entry.title}`);
  }

  if (venture === undefined) return null;
  if (venture === null) return <p className="text-sm text-muted">No flagship project set up yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={addEntry} className="grid gap-3 sm:grid-cols-3">
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Month (e.g. April 2026)"
          value={form.month}
          onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
          required
        />
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Milestone title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm sm:col-span-3 sm:w-fit">
          {saving ? "Adding..." : "+ Add roadmap entry"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="circuit-card grid gap-2 p-3 sm:grid-cols-3">
              <input
                className="circuit-card px-2 py-1.5 text-sm outline-none"
                value={editDraft.month}
                onChange={(e) => setEditDraft((d) => ({ ...d, month: e.target.value }))}
              />
              <input
                className="circuit-card px-2 py-1.5 text-sm outline-none"
                value={editDraft.title}
                onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
              />
              <input
                className="circuit-card px-2 py-1.5 text-sm outline-none"
                value={editDraft.description}
                onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
              />
              <div className="flex gap-2 sm:col-span-3">
                <button onClick={() => saveEdit(entry)} className="push-btn primary rounded-lg px-3 py-1.5 text-xs font-bold">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={entry.id} className="circuit-card flex items-center justify-between gap-3 p-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted">{entry.month}</p>
                <p className="font-bold">{entry.title}</p>
                {entry.description && <p className="text-sm text-muted">{entry.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startEdit(entry)} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
                  Edit
                </button>
                <ConfirmButton
                  label="Delete"
                  question={`Delete "${entry.title}"?`}
                  danger
                  onConfirm={() => removeEntry(entry)}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

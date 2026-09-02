"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function RequestTaskModal({ onClose, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeResults, setAssigneeResults] = useState([]);
  const [assignee, setAssignee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const q = assigneeQuery.trim();
    const request = q
      ? supabase.from("profiles").select("id, name").ilike("name", `%${q}%`).limit(8)
      : supabase.from("profiles").select("id, name").order("name").limit(8);
    request.then(({ data }) => setAssigneeResults(data ?? []));
  }, [assigneeQuery]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setNeedsAuth(true);
      setSaving(false);
      return;
    }
    if (!assignee) {
      setError("Pick who this task is for.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("task_requests").insert({
      requested_by: userId,
      title,
      description,
      assignee_id: assignee.id,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSubmitted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15130f]/50 p-4">
      <form onSubmit={submit} className="circuit-card w-full max-w-md p-6">
        <h3 className="font-display mb-1 text-xl font-bold uppercase tracking-tight">Suggest a task</h3>
        <p className="mb-4 text-xs text-muted">
          A one-off to-do, not a full project — admins will review and add it to the task list.
        </p>

        {needsAuth ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted">Sign in to submit a task.</p>
            <Link href="/login" className="push-btn primary rounded-lg px-4 py-2 text-sm">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <input
              className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
              placeholder="What needs to be done?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <label className="mb-1 block text-xs font-medium text-muted">Assign to</label>
            {assignee ? (
              <div className="circuit-card mb-3 flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-bold">{assignee.name}</span>
                <button type="button" onClick={() => setAssignee(null)} className="text-xs text-muted underline">
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  className="circuit-card mb-2 w-full px-3 py-2 text-sm outline-none"
                  placeholder="Search members by name..."
                  value={assigneeQuery}
                  onChange={(e) => setAssigneeQuery(e.target.value)}
                />
                <div className="mb-3 flex max-h-32 flex-col gap-1 overflow-y-auto">
                  {assigneeResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAssignee(m)}
                      className="push-btn rounded-lg px-3 py-1.5 text-left text-sm"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
          </>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="push-btn rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          {!needsAuth && (
            <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
              {saving ? "Sending..." : "Submit task"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

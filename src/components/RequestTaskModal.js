"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function RequestTaskModal({ onClose, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);

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
    const { error } = await supabase.from("tasks").insert({
      owner_id: userId,
      title,
      description,
      status: "current",
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
        <h3 className="font-display mb-1 text-xl font-bold uppercase tracking-tight">Add a task</h3>
        <p className="mb-4 text-xs text-muted">A one-off to-do under your name — shows up on the Tasks list right away.</p>

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

"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function RequestProjectModal({ onClose, onSubmitted }) {
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
    const { error } = await supabase.from("project_requests").insert({
      requested_by: userId,
      title,
      description,
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
        <h3 className="font-display mb-1 text-xl font-bold uppercase tracking-tight">Pitch a project</h3>
        <p className="mb-4 text-xs text-muted">
          Got an idea the club should build? Drop it here — admins will review and greenlight it.
        </p>

        {needsAuth ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted">Sign in to submit a project request.</p>
            <Link href="/login" className="push-btn primary rounded-lg px-4 py-2 text-sm">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <input
              className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
              placeholder="Project idea title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
              placeholder="What is it, why should the club build it, what would it need?"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <p className="mb-3 text-xs text-muted">
              Once an admin approves this, it becomes a real project on your profile — you&apos;ll be able to add
              teammates and log progress on it then.
            </p>
            {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
          </>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="push-btn rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          {!needsAuth && (
            <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
              {saving ? "Sending..." : "Submit request"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

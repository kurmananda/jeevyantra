"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function MemberPasswordReset({ adminId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`/api/admin-search-members?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    setResults(body.results ?? []);
    setSearched(true);
    setSearching(false);
  }

  async function resetPassword(member) {
    setError("");
    setMessage("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/admin-reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: member.email }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Could not reset password.");
      return;
    }
    setMessage(
      `${body.name} can now set a new password themselves from Sign in → Forgot password using ${member.email}.`
    );
    await logActivity(supabase, adminId, "member password reset allowed", `${body.name} (${member.email})`);
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Search a member by their login email, select them, and allow a reset. They then set their own new password
        from the sign-in page&apos;s Forgot password flow — no email is sent, and you never see or choose the
        password.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="flex gap-2"
      >
        <input
          className="circuit-card flex-1 px-3 py-2 text-sm outline-none"
          placeholder="Search by email..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setSearched(false);
          }}
        />
        <button
          type="submit"
          disabled={query.trim().length < 2 || searching}
          className="push-btn primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {!selected && searched && results.length === 0 && (
        <p className="text-sm text-muted">No members match that email.</p>
      )}

      {!selected && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="push-btn flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
            >
              <span>
                <span className="font-bold">{m.name}</span>{" "}
                <span className="text-xs text-muted">{m.email}</span>
              </span>
              <span className="text-xs font-bold text-muted">Select →</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{selected.name}</p>
            <p className="text-xs text-muted">{selected.email}</p>
          </div>
          <ConfirmButton
            label="Reset password"
            question={`Reset the password for ${selected.email}?`}
            primary
            onConfirm={() => resetPassword(selected)}
          />
        </div>
      )}

      {error && <p className="text-sm text-[var(--led-red)]">{error}</p>}
      {message && <p className="text-sm text-[var(--led-strong)]">{message}</p>}
    </div>
  );
}

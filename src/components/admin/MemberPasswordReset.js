"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default function MemberPasswordReset({ adminId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/admin-search-members?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!cancelled) setResults(body.results ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

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

      <input
        className="circuit-card px-3 py-2 text-sm outline-none"
        placeholder="Search by email..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
      />

      {!selected && (
        <div className="flex flex-col gap-2">
          {(query.trim().length >= 2 ? results : []).map((m) => (
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

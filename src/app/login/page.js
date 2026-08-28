"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Led from "@/components/Led";

function ForgotPasswordBox({ onReset, onClose }) {
  const [email, setEmail] = useState("");
  const [eligible, setEligible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  async function check(e) {
    e.preventDefault();
    setChecking(true);
    setNotFound(false);
    const res = await fetch("/api/claim-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    setChecking(false);
    if (body.ok) {
      setEligible(true);
    } else {
      setNotFound(true);
    }
  }

  async function save(e) {
    e.preventDefault();
    setChecking(true);
    setError("");
    const res = await fetch("/api/complete-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });
    const body = await res.json();
    setChecking(false);
    if (!res.ok) {
      setError(body.error || "Could not set your new password.");
      return;
    }
    onReset(email, newPassword);
  }

  if (eligible) {
    return (
      <form onSubmit={save} className="circuit-card mt-3 flex flex-col gap-2 p-4">
        <p className="text-xs text-muted">An admin cleared you for a reset — set your new password below.</p>
        <input
          type="password"
          autoFocus
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="New password (6+ characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="text-xs text-[var(--led-red)]">{error}</p>}
        <div className="flex gap-2">
          <button disabled={checking} className="push-btn primary rounded-lg px-3 py-1.5 text-xs font-bold">
            {checking ? "Saving..." : "Save password"}
          </button>
          <button type="button" onClick={onClose} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={check} className="circuit-card mt-3 flex flex-col gap-2 p-4">
      <p className="text-xs text-muted">Ask an admin to reset it for you, then try your email here.</p>
      <input
        type="email"
        autoFocus
        className="circuit-card px-3 py-2 text-sm outline-none"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {notFound && (
        <p className="text-xs text-[var(--led-red)]">
          No reset waiting for that email yet — ask an admin to reset it for you and try again.
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={checking} className="push-btn primary rounded-lg px-3 py-1.5 text-xs font-bold">
          {checking ? "Checking..." : "Check"}
        </button>
        <button type="button" onClick={onClose} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sccode, setSccode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function signIn(signInEmail, signInPassword) {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (error) {
      const wait = error.message.match(/after (\d+) seconds?/i);
      if (wait) {
        setCooldown(Number(wait[1]));
        setError(`Too many attempts — please wait a moment before trying again.`);
      } else {
        setError(error.message);
      }
      return;
    }
    router.push("/members/profile");
    router.refresh();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, sccode }),
      });
      const body = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(body.error || "Could not create account.");
        return;
      }
    }

    setLoading(false);
    await signIn(email, password);
  }

  function handleReset(resetEmail, resetPassword) {
    setShowForgot(false);
    setEmail(resetEmail);
    setPassword(resetPassword);
    signIn(resetEmail, resetPassword);
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="circuit-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex w-fit"><Led on pulse size={10} /></div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            {mode === "signin" ? "Power on" : "Join the club"}
          </h1>
          <p className="text-sm text-muted">
            {mode === "signin" ? "Sign in to manage your profile." : "Create an account to add your projects."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input
                className="circuit-card px-3 py-2 text-sm outline-none"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="circuit-card px-3 py-2 text-sm outline-none"
                  placeholder="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <input
                  className="circuit-card px-3 py-2 text-sm outline-none"
                  placeholder="SC code"
                  value={sccode}
                  onChange={(e) => setSccode(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <input
            type="email"
            className="circuit-card px-3 py-2 text-sm outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="circuit-card px-3 py-2 text-sm outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && (
            <p className="text-sm text-[var(--led-red)]">
              {error}
              {cooldown > 0 && ` (${cooldown}s)`}
            </p>
          )}
          <button
            disabled={loading || cooldown > 0}
            className="push-btn primary mt-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {cooldown > 0
              ? `Try again in ${cooldown}s`
              : loading
                ? "Wiring up..."
                : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted underline"
        >
          {mode === "signin" ? "New here? Create an account" : "Already a member? Sign in"}
        </button>

        {mode === "signin" &&
          (showForgot ? (
            <ForgotPasswordBox onReset={handleReset} onClose={() => setShowForgot(false)} />
          ) : (
            <button
              onClick={() => setShowForgot(true)}
              className="mt-3 w-full text-center text-xs text-muted underline"
            >
              Forgot password?
            </button>
          ))}
      </div>
    </div>
  );
}

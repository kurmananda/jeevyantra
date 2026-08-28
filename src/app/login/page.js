"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Led from "@/components/Led";

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
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabaseClient();

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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

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
      </div>
    </div>
  );
}

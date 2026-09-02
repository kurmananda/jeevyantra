"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import AuthGate from "@/components/AuthGate";
import Servo from "@/components/Servo";
import BookingApprovals from "@/components/admin/BookingApprovals";
import InventoryManager from "@/components/admin/InventoryManager";
import ProjectRequestReview from "@/components/admin/ProjectRequestReview";
import TaskRequestReview from "@/components/admin/TaskRequestReview";
import ActivityLog from "@/components/admin/ActivityLog";
import VentureRoadmapManager from "@/components/admin/VentureRoadmapManager";
import ProjectStatusManager from "@/components/admin/ProjectStatusManager";
import FeaturedMemberPicker from "@/components/admin/FeaturedMemberPicker";
import MemberPasswordReset from "@/components/admin/MemberPasswordReset";

const TABS = [
  { key: "roadmap", label: "Venture X" },
  { key: "projects", label: "Projects" },
  { key: "spotlight", label: "Spotlight" },
  { key: "pitches", label: "Pitches" },
  { key: "tasks", label: "Tasks" },
  { key: "bookings", label: "Bookings" },
  { key: "inventory", label: "Inventory" },
  { key: "members", label: "Pass Reset" },
  { key: "logs", label: "Logs" },
];

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setChecking(true);
    setError("");
    const res = await fetch("/api/admin-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: value }),
    });
    const { ok } = await res.json();
    setChecking(false);
    if (ok) {
      onUnlock();
    } else {
      setError("Wrong password.");
    }
  }

  if (checking) return <Servo label="Checking password" />;

  return (
    <form onSubmit={submit} className="circuit-card mx-auto max-w-sm p-8 text-center">
      <p className="font-display mb-2 text-xl font-bold uppercase tracking-tight">Admin lock</p>
      <p className="mb-4 text-sm text-muted">Enter the admin password to continue.</p>
      <input
        type="password"
        autoFocus
        className="circuit-card mb-3 w-full px-3 py-2 text-center text-sm outline-none"
        placeholder="Password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
      <button className="push-btn primary w-full rounded-lg px-4 py-2 text-sm">Unlock</button>
      <p className="mt-4 text-xs text-muted">Forgot the password? Please contact the club core team.</p>
    </form>
  );
}

function AdminDashboard() {
  const [profile, setProfile] = useState(undefined);
  const [tab, setTab] = useState("logs");

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) {
        setProfile(null);
        return;
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(p ?? null);
    });
  }, []);

  if (profile === undefined) return <Servo label="Checking admin access" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Admin</h1>
        <p className="text-sm text-muted">Manage inventory, approve bookings, and review project pitches.</p>
      </div>

      {!profile?.is_admin && (
        <div className="circuit-card p-4 text-sm" style={{ borderColor: "var(--led-red)" }}>
          <p className="font-bold text-[var(--led-red)]">You&apos;re not a real admin yet — that&apos;s why nothing shows up.</p>
          <p className="mt-1 text-muted">
            The password only unlocks this page in your browser. Every list below (pending bookings, pitches,
            other members&apos; requests) is filtered by the database itself, and it only shows those to accounts
            with <code className="font-mono">is_admin = true</code> on their profile. Your account doesn&apos;t
            have that yet — ask an existing admin to run:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-2 text-xs">
            update public.profiles set is_admin = true where id = &apos;{profile?.id ?? "<your-user-id>"}&apos;;
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-xl border-2 border-border bg-surface p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`lever-tab text-sm ${tab === t.key ? "active bg-orange rounded-lg" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roadmap" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Venture X roadmap</h2>
          <VentureRoadmapManager adminId={profile?.id} />
        </section>
      )}

      {tab === "projects" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Current projects</h2>
          <p className="-mt-2 text-sm text-muted">Mark a project completed once it&apos;s wrapped up.</p>
          <ProjectStatusManager adminId={profile?.id} />
        </section>
      )}

      {tab === "spotlight" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Member spotlight</h2>
          <p className="-mt-2 text-sm text-muted">Rename the card and pick who shows up in it — reuse it for any award later.</p>
          <FeaturedMemberPicker adminId={profile?.id} />
        </section>
      )}

      {tab === "pitches" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Project pitches</h2>
          <ProjectRequestReview adminId={profile?.id} />
        </section>
      )}

      {tab === "tasks" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Task requests</h2>
          <p className="-mt-2 text-sm text-muted">Approving turns a request into a task on the public Tasks page.</p>
          <TaskRequestReview adminId={profile?.id} />
        </section>
      )}

      {tab === "bookings" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Booking approvals</h2>
          <BookingApprovals adminId={profile?.id} />
        </section>
      )}

      {tab === "inventory" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Inventory</h2>
          <InventoryManager adminId={profile?.id} />
        </section>
      )}

      {tab === "members" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Password Reset</h2>
          <p className="-mt-2 text-sm text-muted">Reset a member&apos;s password by their login email if they forget it.</p>
          <MemberPasswordReset adminId={profile?.id} />
        </section>
      )}

      {tab === "logs" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">Activity log</h2>
          <ActivityLog />
        </section>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AuthGate>
      {unlocked ? <AdminDashboard /> : <PasswordGate onUnlock={() => setUnlocked(true)} />}
    </AuthGate>
  );
}

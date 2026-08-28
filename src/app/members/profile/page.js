"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import RequestProjectModal from "@/components/RequestProjectModal";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", sccode: "", bio: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  async function load(userId) {
    const supabase = getSupabaseClient();
    const [{ data: p }, { data: pr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("projects").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    ]);
    if (p) setForm({ name: p.name || "", phone: p.phone || "", sccode: p.sccode || "", bio: p.bio || "" });
    setProfile(p);
    setProjects(pr ?? []);
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (!u) return;
      load(u.id);
    });
  }, []);

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setMessage("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setSavingProfile(false);
      setMessage("Your session expired — sign in again.");
      return;
    }
    const { error } = await supabase.from("profiles").update(form).eq("id", userId);
    setSavingProfile(false);
    setMessage(error ? error.message : "Profile saved.");
    if (!error) {
      setProfile((p) => ({ ...p, ...form }));
      setEditing(false);
    }
  }

  if (user === undefined) return <Servo label="Checking credentials" />;

  if (user === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-muted">Sign in to view and edit your profile.</p>
        <button onClick={() => router.push("/login")} className="push-btn primary rounded-lg px-4 py-2 text-sm font-medium">
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">My Profile</h1>
        <p className="text-sm text-muted">Your personal details and project CV — visible to the whole club.</p>
      </div>

      {editing ? (
        <form onSubmit={saveProfile} className="circuit-card flex flex-col gap-3 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Personal details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="circuit-card px-3 py-2 text-sm outline-none"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="circuit-card px-3 py-2 text-sm outline-none"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
            <input
              className="circuit-card px-3 py-2 text-sm outline-none"
              placeholder="SC code"
              value={form.sccode}
              onChange={(e) => setForm((f) => ({ ...f, sccode: e.target.value }))}
            />
          </div>
          <textarea
            className="circuit-card px-3 py-2 text-sm outline-none"
            placeholder="Short bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <button disabled={savingProfile} className="push-btn primary w-fit rounded-lg px-4 py-2 text-sm font-medium">
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({
                  name: profile?.name || "",
                  phone: profile?.phone || "",
                  sccode: profile?.sccode || "",
                  bio: profile?.bio || "",
                });
              }}
              className="push-btn w-fit rounded-lg px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            {message && <span className="text-xs text-muted">{message}</span>}
          </div>
        </form>
      ) : (
        <div className="circuit-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-border bg-orange font-display text-xl font-bold">
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-lg font-bold">{profile?.name}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {profile?.sccode || "no SC code"} · {profile?.phone || "no phone"} · {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"}
              </p>
              {profile?.bio && <p className="mt-1 max-w-md text-sm text-muted">{profile.bio}</p>}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setEditing(true)} className="push-btn primary w-fit rounded-lg px-4 py-2 text-sm font-medium">
              Edit my profile
            </button>
            <button onClick={handleSignOut} className="push-btn w-fit rounded-lg px-4 py-2 text-sm font-medium text-muted">
              Sign out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">My projects</h2>
          <button onClick={() => setShowRequest(true)} className="push-btn primary rounded-lg px-4 py-2 text-sm font-medium">
            + Request a project
          </button>
        </div>
        {projects.length === 0 && (
          <p className="text-sm text-muted">
            No projects yet — request one above and it&apos;ll show up here once an admin approves it.
          </p>
        )}
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="circuit-card flex items-start justify-between gap-4 p-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-semibold">{p.title}</h3>
                <StatusPill status={p.status} />
              </div>
              <p className="text-sm text-muted">{p.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {showRequest && (
        <RequestProjectModal
          onClose={() => setShowRequest(false)}
          onSubmitted={() => {
            setShowRequest(false);
            setMessage("Request submitted — an admin will review it soon.");
          }}
        />
      )}
    </div>
  );
}

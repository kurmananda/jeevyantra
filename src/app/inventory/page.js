"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import StatusPill from "@/components/StatusPill";
import Servo from "@/components/Servo";
import AuthGate from "@/components/AuthGate";

function BookModal({ item, onClose, onBooked }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [returnBy, setReturnBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setError("Sign in to book an item.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("bookings").insert({
      item_id: item.id,
      user_id: userId,
      quantity,
      notes,
      return_by: returnBy ? new Date(returnBy).toISOString() : null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onBooked();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="circuit-card w-full max-w-sm p-6">
        <h3 className="mb-1 font-semibold">Book “{item.name}”</h3>
        <p className="mb-4 text-xs text-muted">{item.available_quantity} available. Your request needs admin approval.</p>
        <label className="mb-1 block text-xs font-medium text-muted">Quantity</label>
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="push-btn h-9 w-9 shrink-0 rounded-lg text-lg font-bold leading-none disabled:opacity-40"
          >
            −
          </button>
          <span className="flex-1 text-center text-lg font-bold tabular-nums">{quantity}</span>
          <button
            type="button"
            disabled={quantity >= item.available_quantity}
            onClick={() => setQuantity((q) => Math.min(item.available_quantity, q + 1))}
            className="push-btn h-9 w-9 shrink-0 rounded-lg text-lg font-bold leading-none disabled:opacity-40"
          >
            +
          </button>
        </div>
        <label className="mb-1 block text-xs font-medium text-muted">When will you return it?</label>
        <input
          type="date"
          value={returnBy}
          onChange={(e) => setReturnBy(e.target.value)}
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
        />
        <label className="mb-1 block text-xs font-medium text-muted">Notes (what for)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="circuit-card mb-3 w-full px-3 py-2 text-sm outline-none"
          placeholder="e.g. Needed for line-follower demo"
        />
        {error && <p className="mb-3 text-sm text-[var(--led-red)]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="push-btn rounded-lg px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm font-medium">
            {saving ? "Sending..." : "Request booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

function isOverdue(returnBy) {
  return Boolean(returnBy) && new Date(returnBy).getTime() < Date.now();
}

function MyBookings({ userId, refreshKey }) {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    if (!userId) return;
    getSupabaseClient()
      .from("bookings")
      .select("*, inventory_items(name), assigned:profiles!bookings_assigned_by_fkey(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setBookings(data ?? []));
  }, [userId, refreshKey]);

  if (!userId || !bookings?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">My bookings</h2>
      {bookings.map((b) => (
        <div key={b.id} className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{b.inventory_items?.name} × {b.quantity}</p>
            <p className="text-xs text-muted">{b.notes}</p>
            {b.status === "approved" && (
              <p className="mt-1 text-xs text-muted">
                Assigned by {b.assigned?.name ?? "—"} · Pickup:{" "}
                {b.pickup_time ? new Date(b.pickup_time).toLocaleString() : "TBD"}
                {b.return_by && <> · Return by: {new Date(b.return_by).toLocaleDateString()}</>}
                {isOverdue(b.return_by) && (
                  <span className="ml-2 status-pill normal-case text-[var(--led-red)]">Delayed</span>
                )}
              </p>
            )}
          </div>
          <StatusPill status={b.status} />
        </div>
      ))}
    </div>
  );
}

export default function InventoryPageGate() {
  return (
    <AuthGate>
      <InventoryPage />
    </AuthGate>
  );
}

function InventoryPage() {
  const [items, setItems] = useState(null);
  const [lentTo, setLentTo] = useState({});
  const [pendingByItem, setPendingByItem] = useState({});
  const [query, setQuery] = useState("");
  const [bookingItem, setBookingItem] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("inventory_items")
      .select("*")
      .order("name")
      .then(({ data }) => setItems(data ?? []));

    supabase
      .from("bookings")
      .select("item_id, approved_at, return_by, profiles:profiles!bookings_user_id_fkey(name)")
      .eq("status", "approved")
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach((b) => {
          map[b.item_id] = map[b.item_id] || [];
          if (b.profiles?.name) {
            map[b.item_id].push({ name: b.profiles.name, approved_at: b.approved_at, return_by: b.return_by });
          }
        });
        setLentTo(map);
      });

    supabase
      .from("bookings")
      .select("item_id, quantity")
      .eq("status", "pending")
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach((b) => {
          map[b.item_id] = (map[b.item_id] ?? 0) + b.quantity;
        });
        setPendingByItem(map);
      });

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", u.id).single();
        setIsAdmin(!!profile?.is_admin);
      }
    });
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (items ?? []).filter(
      (i) => !q || i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Inventory</h1>
        <p className="text-sm text-muted">Sensors, motors, boards, and tools — request what you need for your build.</p>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search inventory by name or category..." />

      {items === null ? (
        <Servo label="Scanning shelves" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const pending = pendingByItem[item.id] ?? 0;
            const effective = Math.max(0, item.available_quantity - pending);
            const loans = lentTo[item.id] ?? [];
            return (
              <div key={item.id} className="circuit-card flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="status-pill text-muted">{item.category ?? "misc"}</span>
                </div>
                <p className="text-sm text-muted">{item.description}</p>

                <div className="text-xs text-muted">
                  {pending > 0 ? (
                    <>
                      <span className="line-through opacity-60">{item.available_quantity}</span>{" "}
                      <span className="font-bold text-foreground">{effective}</span> / {item.quantity} available
                    </>
                  ) : (
                    <>
                      {item.available_quantity} / {item.quantity} available
                    </>
                  )}
                  {item.available_quantity <= 0 && (
                    <span className="ml-2 status-pill normal-case text-[var(--led-amber)]">Complete</span>
                  )}
                  {pending > 0 && (
                    <span className="ml-2 status-pill normal-case text-[var(--led-amber)]">
                      {pending} pending approval
                    </span>
                  )}
                </div>

                {loans.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {loans.map((l, i) => {
                      const overdue = isOverdue(l.return_by);
                      return (
                        <span
                          key={i}
                          className="status-pill normal-case"
                          style={overdue ? { color: "var(--led-red)", borderColor: "var(--led-red)" } : { color: "var(--muted)" }}
                        >
                          {l.name}
                          {l.return_by && ` · due ${new Date(l.return_by).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                          {overdue && " · delayed"}
                        </span>
                      );
                    })}
                  </div>
                )}

                <button
                  disabled={effective < 1}
                  onClick={() => setBookingItem({ ...item, available_quantity: effective })}
                  className="push-btn primary mt-auto rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                >
                  {effective < 1 ? "Unavailable" : "Book item"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <MyBookings userId={user?.id} refreshKey={refreshKey} />
      {isAdmin && (
        <p className="text-xs text-muted">
          Approving bookings has moved to the{" "}
          <a href="/admin" className="font-bold underline decoration-2 underline-offset-2">
            Admin page
          </a>
          .
        </p>
      )}

      {bookingItem && (
        <BookModal
          item={bookingItem}
          onClose={() => setBookingItem(null)}
          onBooked={() => {
            setBookingItem(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

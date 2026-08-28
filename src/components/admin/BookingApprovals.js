"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

function isOverdue(booking) {
  return booking.return_by && new Date(booking.return_by).getTime() < Date.now();
}

export default function BookingApprovals({ adminId }) {
  const [pending, setPending] = useState(null);
  const [active, setActive] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [userQuery, setUserQuery] = useState("");

  function load() {
    const supabase = getSupabaseClient();
    supabase
      .from("bookings")
      .select("*, inventory_items(name), profiles:profiles!bookings_user_id_fkey(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .then(({ data }) => setPending(data ?? []));

    supabase
      .from("bookings")
      .select("*, inventory_items(name), profiles:profiles!bookings_user_id_fkey(name)")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }) => setActive(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(booking, status) {
    const supabase = getSupabaseClient();
    const pickup_time = drafts[booking.id]?.pickup_time || null;
    const approved_at = status === "approved" ? new Date().toISOString() : null;
    await supabase
      .from("bookings")
      .update({
        status,
        assigned_by: adminId,
        pickup_time: status === "approved" ? pickup_time : null,
        approved_at,
      })
      .eq("id", booking.id);
    setPending((p) => p.filter((b) => b.id !== booking.id));
    if (status === "approved") setActive((a) => [...a, { ...booking, status, assigned_by: adminId, pickup_time, approved_at }]);
    await logActivity(
      supabase,
      adminId,
      status === "approved" ? "booking approved" : "booking rejected",
      `${booking.inventory_items?.name} × ${booking.quantity} for ${booking.profiles?.name}`
    );
  }

  async function markReturned(booking) {
    const supabase = getSupabaseClient();
    await supabase.from("bookings").update({ status: "returned" }).eq("id", booking.id);
    const { data: item } = await supabase
      .from("inventory_items")
      .select("available_quantity")
      .eq("id", booking.item_id)
      .single();
    if (item) {
      await supabase
        .from("inventory_items")
        .update({ available_quantity: item.available_quantity + booking.quantity })
        .eq("id", booking.item_id);
    }
    setActive((a) => a.filter((b) => b.id !== booking.id));
    await logActivity(
      supabase,
      adminId,
      "item returned",
      `${booking.inventory_items?.name} × ${booking.quantity} from ${booking.profiles?.name}`
    );
  }

  const groupedActive = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const filtered = (active ?? []).filter((b) => !q || b.profiles?.name?.toLowerCase().includes(q));
    const groups = {};
    filtered.forEach((b) => {
      const name = b.profiles?.name ?? "Unknown";
      groups[name] = groups[name] || [];
      groups[name].push(b);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [active, userQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Pending requests</p>
        {pending === null ? null : !pending.length ? (
          <p className="text-sm text-muted">No pending bookings.</p>
        ) : (
          pending.map((b) => (
            <div key={b.id} className="circuit-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold">
                  {b.inventory_items?.name} × {b.quantity} — {b.profiles?.name}
                </p>
                <p className="text-xs text-muted">{b.notes}</p>
                {b.return_by && (
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">
                    Requested return by: {new Date(b.return_by).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="circuit-card px-2 py-1.5 text-xs outline-none"
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [b.id]: { pickup_time: e.target.value ? new Date(e.target.value).toISOString() : null },
                    }))
                  }
                />
                <ConfirmButton
                  label="Approve"
                  question={`Approve ${b.inventory_items?.name} for ${b.profiles?.name}?`}
                  primary
                  onConfirm={() => act(b, "approved")}
                />
                <ConfirmButton
                  label="Reject"
                  question={`Reject this request?`}
                  danger
                  onConfirm={() => act(b, "rejected")}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Active loans — by borrower</p>
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Search by borrower name..."
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
        />
        {active === null ? null : !groupedActive.length ? (
          <p className="text-sm text-muted">Nothing currently lent out.</p>
        ) : (
          groupedActive.map(([name, bookings]) => (
            <div key={name} className="circuit-card p-4">
              <p className="mb-2 text-sm font-bold">{name}</p>
              <div className="flex flex-col gap-2">
                {bookings.map((b) => {
                  const overdue = isOverdue(b);
                  return (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-border bg-background px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {b.inventory_items?.name} × {b.quantity}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">
                          {b.approved_at && `since ${new Date(b.approved_at).toLocaleDateString()}`}
                          {b.return_by && ` · due ${new Date(b.return_by).toLocaleDateString()}`}
                          {overdue && <span className="ml-2 status-pill normal-case text-[var(--led-red)]">Delayed</span>}
                        </p>
                      </div>
                      <ConfirmButton
                        label="Mark returned"
                        question="Got it back?"
                        primary
                        onConfirm={() => markReturned(b)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

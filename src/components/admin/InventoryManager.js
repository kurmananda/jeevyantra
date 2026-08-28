"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

const EMPTY = { name: "", category: "", description: "", quantity: 1 };

export default function InventoryManager({ adminId }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    getSupabaseClient()
      .from("inventory_items")
      .select("*")
      .order("name")
      .then(({ data }) => setItems(data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const qty = Number(form.quantity) || 1;
    const name = form.name.trim();

    const existing = (items ?? []).find((i) => i.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          quantity: existing.quantity + qty,
          available_quantity: existing.available_quantity + qty,
        })
        .eq("id", existing.id)
        .select()
        .single();
      setSaving(false);
      if (!error) {
        setItems((i) => i.map((x) => (x.id === existing.id ? data : x)));
        setForm(EMPTY);
        await logActivity(supabase, adminId, "inventory item restocked", `${data.name} +${qty} (now ${data.quantity})`);
      }
      return;
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({ ...form, name, quantity: qty, available_quantity: qty })
      .select()
      .single();
    setSaving(false);
    if (!error) {
      setItems((i) => [...i, data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(EMPTY);
      await logActivity(supabase, adminId, "inventory item added", `${data.name} × ${qty}`);
    }
  }

  async function removeItem(item) {
    const supabase = getSupabaseClient();
    await supabase.from("inventory_items").delete().eq("id", item.id);
    setItems((i) => i.filter((x) => x.id !== item.id));
    await logActivity(supabase, adminId, "inventory item removed", item.name);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Adding an item with a name that already exists restocks it — quantity gets added to the existing item
        instead of creating a duplicate.
      </p>
      <form onSubmit={addItem} className="grid gap-3 sm:grid-cols-2">
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        />
        <input
          className="circuit-card px-3 py-2 text-sm outline-none sm:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <input
          type="number"
          min={1}
          className="circuit-card px-3 py-2 text-sm outline-none"
          placeholder="Number of items"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
        />
        <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          {saving ? "Adding..." : "+ Add item"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {(items ?? []).map((item) => {
          const complete = item.available_quantity <= 0;
          return (
            <div key={item.id} className="circuit-card flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.category ?? "misc"} · {item.available_quantity}/{item.quantity} available
                  {complete && <span className="ml-2 status-pill normal-case text-[var(--led-amber)]">Complete</span>}
                </p>
              </div>
              <ConfirmButton label="Remove" question={`Remove ${item.name}?`} danger onConfirm={() => removeItem(item)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

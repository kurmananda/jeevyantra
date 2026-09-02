"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLog";
import ConfirmButton from "@/components/admin/ConfirmButton";

const EMPTY = { name: "", category: "", description: "", quantity: 1, link: "" };

export default function InventoryManager({ adminId }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  function startEdit(item) {
    setEditingId(item.id);
    setEditDraft({
      name: item.name ?? "",
      category: item.category ?? "",
      description: item.description ?? "",
      link: item.link ?? "",
      quantity: item.quantity,
      available_quantity: item.available_quantity,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit(item) {
    setSavingEdit(true);
    const supabase = getSupabaseClient();
    const payload = {
      name: editDraft.name.trim(),
      category: editDraft.category.trim() || null,
      description: editDraft.description.trim() || null,
      link: editDraft.link.trim() || null,
      quantity: Math.max(0, Number(editDraft.quantity) || 0),
      available_quantity: Math.max(0, Number(editDraft.available_quantity) || 0),
    };
    const { data, error } = await supabase
      .from("inventory_items")
      .update(payload)
      .eq("id", item.id)
      .select()
      .single();
    setSavingEdit(false);
    if (!error) {
      setItems((i) => i.map((x) => (x.id === item.id ? data : x)).sort((a, b) => a.name.localeCompare(b.name)));
      await logActivity(supabase, adminId, "inventory item edited", data.name);
      cancelEdit();
    }
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
        <input
          className="circuit-card px-3 py-2 text-sm outline-none sm:col-span-2"
          placeholder="Link (datasheet, product page, etc.)"
          value={form.link}
          onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
        />
        <button disabled={saving} className="push-btn primary rounded-lg px-4 py-2 text-sm">
          {saving ? "Adding..." : "+ Add item"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {(items ?? []).map((item) => {
          const complete = item.available_quantity <= 0;
          const editing = editingId === item.id;

          if (editing) {
            return (
              <div key={item.id} className="circuit-card flex flex-col gap-2 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="circuit-card px-3 py-2 text-sm outline-none"
                    placeholder="Item name"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                  <input
                    className="circuit-card px-3 py-2 text-sm outline-none"
                    placeholder="Category"
                    value={editDraft.category}
                    onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                  />
                  <input
                    className="circuit-card px-3 py-2 text-sm outline-none sm:col-span-2"
                    placeholder="Description"
                    value={editDraft.description}
                    onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                  <input
                    className="circuit-card px-3 py-2 text-sm outline-none sm:col-span-2"
                    placeholder="Link"
                    value={editDraft.link}
                    onChange={(e) => setEditDraft((d) => ({ ...d, link: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted">
                    Available
                    <input
                      type="number"
                      min={0}
                      className="circuit-card w-full px-3 py-2 text-sm outline-none"
                      value={editDraft.available_quantity}
                      onChange={(e) => setEditDraft((d) => ({ ...d, available_quantity: e.target.value }))}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    Total
                    <input
                      type="number"
                      min={0}
                      className="circuit-card w-full px-3 py-2 text-sm outline-none"
                      value={editDraft.quantity}
                      onChange={(e) => setEditDraft((d) => ({ ...d, quantity: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelEdit} className="push-btn rounded-lg px-4 py-2 text-xs font-medium">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => saveEdit(item)}
                    className="push-btn primary rounded-lg px-4 py-2 text-xs font-medium"
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="circuit-card flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.category ?? "misc"} · {item.available_quantity}/{item.quantity} available
                  {complete && <span className="ml-2 status-pill normal-case text-[var(--led-amber)]">Complete</span>}
                </p>
                {item.description && <p className="text-xs text-muted">{item.description}</p>}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-xs font-bold underline decoration-2 underline-offset-2">
                    Link
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => startEdit(item)} className="push-btn rounded-lg px-3 py-1.5 text-xs font-medium">
                  Edit
                </button>
                <ConfirmButton label="Remove" question={`Remove ${item.name}?`} danger onConfirm={() => removeItem(item)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

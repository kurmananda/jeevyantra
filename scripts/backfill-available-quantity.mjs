// One-off: recompute inventory_items.available_quantity from actual approved
// (not yet returned) bookings, to fix items approved before the approval
// handler was patched to decrement available_quantity.
// Run with: node --env-file=.env.local scripts/backfill-available-quantity.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: items, error: itemsErr } = await supabase.from("inventory_items").select("id, name, quantity, available_quantity");
  if (itemsErr) throw itemsErr;

  const { data: bookings, error: bookingsErr } = await supabase
    .from("bookings")
    .select("item_id, quantity")
    .eq("status", "approved");
  if (bookingsErr) throw bookingsErr;

  const takenByItem = {};
  for (const b of bookings) {
    takenByItem[b.item_id] = (takenByItem[b.item_id] ?? 0) + b.quantity;
  }

  for (const item of items) {
    const taken = takenByItem[item.id] ?? 0;
    const correct = Math.max(0, item.quantity - taken);
    if (correct === item.available_quantity) continue;
    const { error } = await supabase.from("inventory_items").update({ available_quantity: correct }).eq("id", item.id);
    if (error) throw error;
    console.log(`${item.name}: ${item.available_quantity} -> ${correct} (quantity=${item.quantity}, taken=${taken})`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

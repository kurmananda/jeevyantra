const STEPS = [
  {
    title: "1. Create an account",
    body: "Go to Sign in → New here? Create an account. Enter your name, phone number, SC code, email, and a password. Phone and SC code show up on your profile and member card, and your phone number is what powers the WhatsApp links on the Team page.",
  },
  {
    title: "2. Edit your profile",
    body: "Once signed in, open Profile from the top bar. You'll see your details as a summary card — click Edit my profile to change your name, phone, SC code, or bio, then Save profile.",
  },
  {
    title: "3. Pitch a project",
    body: "On the Projects page (or from your Profile), hit + Request a project and describe the idea. It shows up under Community requests with a \"requested\" status until an admin reviews it. You'll be able to add teammates and log progress on it once it's approved.",
  },
  {
    title: "4. What happens when a pitch is approved",
    body: "An admin opens Admin → Pitches and clicks Approve → make project (with a Yes/No confirm). That instantly creates a real project owned by you, marks your pitch \"approved,\" and it now appears on the Projects page and your profile's \"My projects\" list. Declining just marks it \"declined\" — nothing is created.",
  },
  {
    title: "5. Build a team & log progress",
    body: "Open any project you own and use + Add teammate to bring other members onto the build, and + Log progress to add a roadmap entry (a month, a milestone title, and what got done). Teammates can log and delete progress too. The one exception is the flagship project, Venture X — its roadmap is only editable from the Admin panel.",
  },
  {
    title: "6. Book inventory",
    body: "On the Inventory page, search for the part you need, use the −/+ buttons to set a quantity, optionally pick a return-by date, and hit Request booking. Your request goes in as \"pending\" — the card's shown count already subtracts anything currently pending, so you always see what's realistically bookable.",
  },
  {
    title: "7. How admin approval actually works, step by step",
    body:
      "① Your request lands in Admin → Bookings → Pending requests, showing your name, quantity, notes, and requested return date.\n" +
      "② The admin optionally sets a pickup time, then clicks Approve (or Reject) — both ask for a Yes/No confirmation first.\n" +
      "③ On approval, the booking is stamped with an approval date and moves to Active loans, grouped by borrower name (searchable).\n" +
      "④ Back on the Inventory page, that unit now shows under \"Lent to\" with your name and due date, right on the item's card — visible to everyone, not just admins.\n" +
      "⑤ If the return date passes before it's marked returned, it's flagged \"Delayed\" in red, both in Admin and on the Inventory page.\n" +
      "⑥ When you physically hand the item back, the admin clicks Mark returned on that loan and confirms \"Got it back? Yes\" — that instantly adds the quantity back to the item's available stock, no manual recount needed.",
  },
  {
    title: "8. Restocking inventory",
    body: "In Admin → Inventory, adding a new item with a name that already exists doesn't create a duplicate — it adds the new quantity onto the existing item's stock (both total and available). You'll see this called out as \"restocked\" in the activity log.",
  },
  {
    title: "9. Admin visibility",
    body: "Every admin action — booking approvals/rejections/returns, pitch approvals/declines, inventory added/removed/restocked, roadmap edits, spotlight changes — is written to Admin → Logs with who did it and when, so nothing happens invisibly.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Help / How to use</h1>
        <p className="text-sm text-muted">Everything you need to get moving on the site, start to finish.</p>
      </div>

      <div className="flex flex-col gap-4">
        {STEPS.map((s) => (
          <div key={s.title} className="circuit-card p-5">
            <p className="font-display mb-1 text-lg font-bold">{s.title}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

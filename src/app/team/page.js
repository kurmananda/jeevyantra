import AuthGate from "@/components/AuthGate";
import { waLink } from "@/lib/team";

const CORE_TEAM = [
  { position: "President", name: "Kurmananda", phone: "9491978534" },
  { position: "Vice-President", name: "Ali Murabbi", phone: "8602350776" },
  { position: "Secretary/Treasurer", name: "Ishaan Gupta", phone: "8302272147" },
  { position: "Events Manager", name: "Trinath Reddy", phone: "9963893453" },
  { position: "Workshop Manager", name: "Kanad", phone: "9256282284" },
  { position: "Inventory Manager", name: "Shreyansh Chaurasiya", phone: "8461063803" },
  { position: "Inventory Manager", name: "Bhargav Reddy", phone: "9491558980" },
  { position: "Project Manager", name: "Divyansh", phone: "9154167563" },
  { position: "Social Media Head", name: "Prathmesh", phone: "9209342102" },
  { position: "Social Media Head", name: "Himanshi", phone: "8983125415" },
];

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.55 3.7-8.24 8.26-8.24 2.21 0 4.28.86 5.84 2.42a8.19 8.19 0 0 1 2.42 5.83c0 4.55-3.71 8.24-8.27 8.24Zm4.53-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12 .17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

function MemberRow({ position, name, phone }) {
  return (
    <div className="circuit-card flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-border bg-orange font-display text-sm font-bold">
          {name[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold">{name}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{position}</p>
        </div>
      </div>
      <a
        href={waLink(phone)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Message ${name} on WhatsApp`}
        className="push-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--led-strong)]"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}

function TeamPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Core Team</h1>
        <p className="text-sm text-muted">The club&apos;s fixed leadership roster.</p>
      </div>

      <div className="flex flex-col gap-2">
        {CORE_TEAM.map((m) => (
          <MemberRow key={`${m.position}-${m.name}`} {...m} />
        ))}
      </div>
    </div>
  );
}

export default function TeamPageGate() {
  return (
    <AuthGate>
      <TeamPage />
    </AuthGate>
  );
}

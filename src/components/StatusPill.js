const DOT_COLORS = {
  current: "var(--led-strong)",
  approved: "var(--led-strong)",
  pending: "var(--led-amber)",
  previous: "var(--muted)",
  returned: "var(--muted)",
  rejected: "var(--led-red)",
  requested: "var(--led-amber)",
  declined: "var(--led-red)",
};

const TEXT_COLORS = {
  current: "var(--led-strong-text)",
  approved: "var(--led-strong-text)",
  pending: "var(--led-amber)",
  previous: "var(--muted)",
  returned: "var(--muted)",
  rejected: "var(--led-red)",
  requested: "var(--led-amber)",
  declined: "var(--led-red)",
};

const LABELS = {
  previous: "completed",
};

export default function StatusPill({ status }) {
  const dotColor = DOT_COLORS[status] ?? "var(--muted)";
  const textColor = TEXT_COLORS[status] ?? "var(--muted)";
  return (
    <span className="status-pill" style={{ color: textColor }}>
      <span className="led-bezel" style={{ width: 10, height: 10 }} aria-hidden>
        <span className="led-bulb on" style={{ "--led-color": dotColor }} />
      </span>
      {LABELS[status] ?? status}
    </span>
  );
}

export default function Servo({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-muted">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <rect x="6" y="26" width="34" height="14" rx="3" fill="#e4e7ec" stroke="#c8cdd6" />
        <g className="servo-spin">
          <rect x="21" y="4" width="4" height="24" rx="2" fill="#0e1420" />
          <circle cx="23" cy="28" r="4" fill="#0e1420" />
        </g>
      </svg>
      <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
    </div>
  );
}

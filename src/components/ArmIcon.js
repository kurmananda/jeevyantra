export default function ArmIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden>
      <rect x="30" y="70" width="60" height="12" rx="3" stroke="currentColor" strokeWidth="3" />
      <circle cx="46" cy="70" r="7" stroke="currentColor" strokeWidth="3" />
      <line x1="46" y1="63" x2="46" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="40" r="4" fill="currentColor" />
      <line x1="46" y1="40" x2="76" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="76" cy="26" r="4" fill="currentColor" />
      <line x1="76" y1="26" x2="96" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M96 38l6 -4M96 38l6 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

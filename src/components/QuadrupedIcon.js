export default function QuadrupedIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden>
      <rect x="34" y="30" width="52" height="24" rx="6" stroke="currentColor" strokeWidth="3" />
      <circle cx="46" cy="24" r="3" fill="currentColor" />
      <circle cx="74" cy="24" r="3" fill="currentColor" />
      <line x1="42" y1="52" x2="36" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="36" y1="72" x2="26" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="54" y1="54" x2="50" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="66" y1="54" x2="70" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="52" x2="84" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="84" y1="72" x2="94" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="55" y="14" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

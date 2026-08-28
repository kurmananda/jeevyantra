"use client";

import Led from "@/components/Led";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="circuit-card flex items-center gap-2 px-4 py-2.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted"
      />
      <Led on={!!value} size={8} />
    </div>
  );
}

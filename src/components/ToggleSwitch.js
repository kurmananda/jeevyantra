"use client";

export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
      aria-pressed={checked}
    >
      <span
        className="relative inline-flex h-6 w-11 items-center rounded-full border border-border transition-colors"
        style={{ background: checked ? "var(--led-strong)" : "#e4e7ec" }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(4px)" }}
        />
      </span>
      {label && <span className="text-sm text-muted">{label}</span>}
    </button>
  );
}

"use client";

import { useState } from "react";

export default function ConfirmButton({
  label,
  question = "Are you sure?",
  onConfirm,
  className = "",
  danger = false,
  primary = false,
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold">{question}</span>
        <button
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="push-btn primary rounded-lg px-3 py-1.5 text-xs font-bold"
        >
          Yes
        </button>
        <button onClick={() => setConfirming(false)} className="push-btn rounded-lg px-3 py-1.5 text-xs font-bold">
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`push-btn rounded-lg px-3 py-1.5 text-xs font-bold ${primary ? "primary" : ""} ${
        danger ? "text-[var(--led-red)]" : ""
      } ${className}`}
    >
      {label}
    </button>
  );
}

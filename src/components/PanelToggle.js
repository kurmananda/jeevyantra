"use client";

import { useEffect, useState } from "react";

export default function PanelToggle({ on = false, scale = 1 }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className="panel-toggle"
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}
      aria-hidden
    >
      <span className="panel-toggle-screw tl" />
      <span className="panel-toggle-screw br" />
      <span className="panel-toggle-socket" />
      <span className={`panel-toggle-lever ${revealed && on ? "on" : ""}`} />
    </span>
  );
}

export default function LeverToggle({ on = false, size = "sm" }) {
  const dims = size === "sm" ? { w: 18, h: 26 } : { w: 24, h: 34 };
  return (
    <span
      className="lever-housing"
      style={{ width: dims.w, height: dims.h }}
      aria-hidden
    >
      <span className="lever-track" />
      <span className={`lever-bar ${on ? "on" : ""}`} />
      <span className="lever-pivot" />
    </span>
  );
}

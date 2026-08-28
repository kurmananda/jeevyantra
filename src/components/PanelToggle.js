export default function PanelToggle({ on = false, scale = 1 }) {
  return (
    <span
      className="panel-toggle"
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}
      aria-hidden
    >
      <span className="panel-toggle-screw tl" />
      <span className="panel-toggle-screw br" />
      <span className="panel-toggle-socket" />
      <span className={`panel-toggle-lever ${on ? "on" : ""}`} />
    </span>
  );
}

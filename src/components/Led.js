export default function Led({ on = false, color = "led-strong", size = 12, pulse = false }) {
  return (
    <span
      className="led-bezel"
      style={{ width: size + 4, height: size + 4 }}
      aria-hidden
    >
      <span
        className={`led-bulb ${on ? "on" : ""} ${on && pulse ? "pulse" : ""}`}
        style={on ? { "--led-color": `var(--${color})` } : undefined}
      />
    </span>
  );
}

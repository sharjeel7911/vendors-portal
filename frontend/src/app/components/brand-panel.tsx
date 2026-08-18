/**
 * Decorative side panel used on the login/register screens. Renders the same
 * "radar / beacon" motif as the app sidebar mark, scaled up, so the console
 * identity is legible before a vendor even signs in.
 */
export function RadarPanel() {
  const rings = [1, 2, 3, 4];
  return (
    <div className="relative hidden w-[42%] max-w-lg shrink-0 items-center justify-center overflow-hidden border-l border-border bg-bg-elevated lg:flex">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="relative flex h-80 w-80 items-center justify-center">
        {rings.map((r) => (
          <span
            key={r}
            className="absolute rounded-full border border-beacon/20"
            style={{ width: `${r * 25}%`, height: `${r * 25}%` }}
          />
        ))}
        <div className="absolute inset-0 animate-radar overflow-hidden rounded-full" style={{ transformOrigin: "50% 50%" }}>
          <div
            className="absolute inset-0"
            style={{ background: "conic-gradient(from 0deg, rgba(255,145,66,0.4), transparent 28%)" }}
          />
        </div>
        <span className="relative h-3 w-3 rounded-full bg-beacon animate-beacon" />

        {/* a few scattered stop pins to suggest a live route board */}
        <span className="absolute left-[20%] top-[30%] h-1.5 w-1.5 rounded-full bg-signal" />
        <span className="absolute left-[72%] top-[62%] h-1.5 w-1.5 rounded-full bg-info" />
        <span className="absolute left-[58%] top-[22%] h-1.5 w-1.5 rounded-full bg-text-faint" />
      </div>

      <div className="absolute bottom-10 left-10 right-10">
        <p className="font-display text-lg font-semibold leading-snug text-text">
          Every stop, tracked. Every route, dispatched.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Devorbits is the operations console behind your delivery fleet — orders, routes, drivers and vehicles in one place.
        </p>
      </div>
    </div>
  );
}

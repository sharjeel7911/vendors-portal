// This is the main home page of the application.
import Link from 'next/link'; // Link lets the user open the Drivers or Vehicles pages.

export default function Home() {
  return (
    // The home page keeps the content vertically spaced.
    <div className="space-y-10">
      {/* The heading introduces what the application is for. */}
      <div>
        <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-2">
          DISPATCH CONSOLE
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
          Manage your fleet.
        </h1>
        <p className="text-dispatch-sub max-w-lg">
          Track drivers and vehicles, keep records up to date, and dispatch
          with confidence. Pick a board to get started.
        </p>
      </div>

      {/* These two cards take the user to the main parts of the app. */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Open the drivers page. */}
        <Link
          href="/drivers"
          className="group border border-dispatch-line bg-dispatch-panel rounded-lg p-6 hover:border-dispatch-amber/60 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-dispatch-sub">01</span>
            <span className="text-dispatch-sub group-hover:text-dispatch-amber transition-colors">
              →
            </span>
          </div>
          <h2 className="font-display text-xl font-bold mb-1">Drivers</h2>
          <p className="text-sm text-dispatch-sub">
            Roster, contact details, and licensing records.
          </p>
        </Link>

        {/* Open the vehicles page. */}
        <Link
          href="/vehicles"
          className="group border border-dispatch-line bg-dispatch-panel rounded-lg p-6 hover:border-dispatch-amber/60 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-dispatch-sub">02</span>
            <span className="text-dispatch-sub group-hover:text-dispatch-amber transition-colors">
              →
            </span>
          </div>
          <h2 className="font-display text-xl font-bold mb-1">Vehicles</h2>
          <p className="text-sm text-dispatch-sub">
            Fleet inventory by depot, type, and capacity.
          </p>
        </Link>
      </div>
    </div>
  );
}

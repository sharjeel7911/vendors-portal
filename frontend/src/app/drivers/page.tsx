// This page shows the complete list of drivers.
import Link from 'next/link'; // Used for the "Add driver" link.
import { fetchDrivers } from '@/lib/api'; // Gets drivers from the backend.
import DriverTable from '@/app/components/DriverTable'; // Displays the drivers.
import { PrimaryButton, ErrorBanner } from '@/app/components/ui'; // Reusable button and error box.

// Always get fresh data for this page instead of relying on an old cached page.
export const dynamic = 'force-dynamic';

// This page is asynchronous because it waits for the backend response.
export default async function DriversPage() {
  // This will hold the drivers after the API call.
  let drivers;

  // This stores a readable error if the API cannot be reached.
  let loadError: string | null = null;

  try {
    // Ask the backend for all drivers.
    drivers = await fetchDrivers();
  } catch (err) {
    // Turn an unknown error into a message the user can understand.
    loadError =
      err instanceof Error ? err.message : 'Could not reach the drivers API.';
  }

  return (
    <div className="space-y-6">
      {/* Page title and add button. */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-dispatch-amber tracking-widest mb-1">
            BOARD / 01
          </p>
          <h1 className="font-display text-2xl font-bold">Drivers</h1>
        </div>

        {/* Open the form for creating a new driver. */}
        <Link href="/drivers/new">
          <PrimaryButton type="button">Add driver</PrimaryButton>
        </Link>
      </div>

      {/* Show the error when loading failed, otherwise show the driver table. */}
      {loadError ? (
        <ErrorBanner
          message={`Failed to load drivers: ${loadError}. Is the NestJS API running on ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}?`}
        />
      ) : (
        <DriverTable drivers={drivers ?? []} />
      )}
    </div>
  );
}
